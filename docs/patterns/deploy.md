---
title: 部署到生产环境 - Vafast
---

# 部署到生产环境
本页面是关于如何将 Vafast 部署到生产环境的指南。

## 编译为二进制
我们建议在部署到生产环境之前运行构建命令，因为这可能会显著减少内存使用和文件大小。

我们推荐使用以下命令将 Vafast 编译成单个二进制文件：
```bash
bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts
```

这将生成一个可移植的二进制文件 `server`，我们可以运行它来启动我们的服务器。

将服务器编译为二进制文件通常会将内存使用量显著减少 2-3 倍，相较于开发环境。

这个命令有点长，所以让我们分解一下：
1. `--compile` - 将 TypeScript 编译为二进制
2. `--minify-whitespace` - 删除不必要的空白
3. `--minify-syntax` - 压缩 JavaScript 语法以减少文件大小
4. `--target bun` - 针对 `bun` 平台，可以为目标平台优化二进制文件
5. `--outfile server` - 输出二进制文件为 `server`
6. `./src/index.ts` - 我们服务器的入口文件（代码库）

要启动我们的服务器，只需运行二进制文件。
```bash
./server
```

一旦二进制文件编译完成，您就不需要在机器上安装 `Bun` 以运行服务器。

这很好，因为部署服务器不需要安装额外的运行时，使得二进制文件便于移植。

### 为什么不使用 --minify
Bun 确实有 `--minify` 标志，用于压缩二进制文件。

然而，如果我们正在使用 [OpenTelemetry](/middleware/opentelemetry)，它会将函数名缩减为单个字符。

这使得跟踪变得比应该的更加困难，因为 OpenTelemetry 依赖于函数名。

但是，如果您不使用 OpenTelemetry，您可以选择使用 `--minify`：
```bash
bun build \
	--compile \
	--minify \
	--target bun \
	--outfile server \
	./src/index.ts
```

### 权限
一些 Linux 发行版可能无法运行二进制文件，如果您使用的是 Linux，建议为二进制文件启用可执行权限：
```bash
chmod +x ./server

./server
```

### 未知的随机中文错误
如果您尝试将二进制文件部署到服务器但无法运行，并出现随机中文字符错误。

这意味着您运行的机器 **不支持 AVX2**。

不幸的是，Bun 要求机器具有 `AVX2` 硬件支持。

据我们所知没有替代方案。

## 编译为 JavaScript
如果您无法编译为二进制文件或您正在 Windows 服务器上进行部署。

您可以将服务器打包为一个 JavaScript 文件。

```bash
bun build \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile ./dist/index.js \
	./src/index.ts
```

这将生成一个压缩的 JavaScript 文件，您可以使用 Node.js 或 Bun 运行它。

```bash
# 使用 Bun 运行
bun ./dist/index.js

# 或使用 Node.js 运行
node ./dist/index.js
```

## Docker 部署

### 创建 Dockerfile

```dockerfile
# 使用 Bun 官方镜像
FROM oven/bun:1 as base
WORKDIR /usr/src/app

# 安装依赖
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN bun run build

# 生产镜像
FROM oven/bun:1-slim
WORKDIR /usr/src/app

# 复制构建产物和依赖
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/package.json ./

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["bun", "dist/index.js"]
```

### 构建和运行 Docker 镜像

```bash
# 构建镜像
docker build -t vafast-app .

# 运行容器
docker run -p 3000:3000 vafast-app
```

## 环境变量配置

在生产环境中，建议使用环境变量来配置应用：

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key
```

在代码中使用：

```typescript
// src/config.ts
export const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'development'
}
```

## 性能优化

### 1. 启用压缩

```typescript
// src/index.ts
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { compress } from '@vafast/compress'

const routes = defineRoutes([
  // ... 你的路由
])

const server = new Server(routes)

// 应用压缩中间件
server.use(compress())

export default { fetch: server.fetch }
```

### 2. 缓存策略

```typescript
// 添加缓存头
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/static/:file',
    handler: createRouteHandler(({ params }) => {
      const file = getStaticFile(params.file)
      return new Response(file, {
        headers: {
          'Cache-Control': 'public, max-age=31536000', // 1年
          'ETag': generateETag(file)
        }
      })
    })
  }
])
```

### 3. 负载均衡

如果您的应用需要处理高流量，可以考虑使用负载均衡器：

```bash
# 使用 Nginx 作为反向代理
upstream vafast_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://vafast_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控和日志

### 1. 健康检查端点

```typescript
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/health',
    handler: createRouteHandler(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }))
  }
])
```

### 2. 结构化日志

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const loggingMiddleware = async (req: Request, next: () => Promise<Response>) => {
  const startTime = Date.now()
  const response = await next()
  const duration = Date.now() - startTime
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: response.status,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent')
  }))
  
  return response
}

const server = new Server(routes)
server.use(loggingMiddleware)
```

### 3. 性能监控

```typescript
import { withMonitoring } from 'vafast/monitoring'

const server = new Server(routes)
const monitoredServer = withMonitoring(server, {
  enableMetrics: true,
  enableLogging: true
})

export default { fetch: monitoredServer.fetch }
```

## 安全配置

### 1. HTTPS 配置

在生产环境中，强烈建议使用 HTTPS：

```typescript
// 使用 Bun 的内置 HTTPS 支持
const server = Bun.serve({
  port: 3000,
  fetch: server.fetch,
  tls: {
    cert: Bun.file('path/to/cert.pem'),
    key: Bun.file('path/to/key.pem')
  }
})
```

### 2. 安全头

```typescript
import { helmet } from '@vafast/helmet'

const server = new Server(routes)
server.use(helmet())
```

### 3. 速率限制

```typescript
import { rateLimit } from '@vafast/rate-limit'

const server = new Server(routes)
server.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
}))
```

## 部署检查清单

在部署到生产环境之前，请确保：

- [ ] 所有环境变量已正确配置
- [ ] 数据库连接已测试
- [ ] 日志记录已启用
- [ ] 监控已配置
- [ ] 健康检查端点已实现
- [ ] 错误处理已完善
- [ ] 安全头已配置
- [ ] 速率限制已启用
- [ ] HTTPS 已配置（如果适用）
- [ ] 备份策略已制定

## 总结

Vafast 的生产部署提供了：

- ✅ 二进制编译支持
- ✅ Docker 容器化
- ✅ 环境变量配置
- ✅ 性能优化选项
- ✅ 监控和日志
- ✅ 安全配置
- ✅ 负载均衡支持

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
