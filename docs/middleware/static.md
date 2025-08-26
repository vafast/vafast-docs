---
title: Static 中间件 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Static 中间件 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 的中间件，提供高性能的静态文件服务功能，支持缓存、ETag 和智能路由。开始时请使用 "bun add @vafast/static" 安装中间件。

  - - meta
    - name: 'og:description'
      content: Vafast 的中间件，提供高性能的静态文件服务功能，支持缓存、ETag 和智能路由。开始时请使用 "bun add @vafast/static" 安装中间件。
---

# Static 中间件

该中间件为 [Vafast](https://github.com/vafastjs/vafast) 提供了高性能的静态文件服务功能，支持智能缓存、ETag 验证、自定义头部和灵活的配置选项。

## 安装

安装命令：
```bash
bun add @vafast/static
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'
import { join } from 'path'

// 创建静态文件路由
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static'
})

// 添加自定义路由
const customRoutes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { message: 'Static file server is running' }
        })
    }
]

// 合并路由
const allRoutes = [...customRoutes, ...staticRoutes]

const server = new Server(allRoutes)

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

## 配置选项

### StaticPluginOptions

```typescript
interface StaticPluginOptions {
  /** 静态文件目录路径，默认：'public' */
  assets?: string
  
  /** URL 前缀，默认：'/public' */
  prefix?: string
  
  /** 静态路由文件数量限制，默认：1024 */
  staticLimit?: number
  
  /** 是否始终使用静态路由，默认：NODE_ENV === 'production' */
  alwaysStatic?: boolean
  
  /** 忽略的文件模式，默认：['.DS_Store', '.git', '.env'] */
  ignorePatterns?: Array<string | RegExp>
  
  /** 是否不需要文件扩展名，默认：false */
  noExtension?: boolean
  
  /** 是否启用 URI 解码，默认：false */
  enableDecodeURI?: boolean
  
  /** 路径解析函数，默认：Node.js resolve */
  resolve?: (...pathSegments: string[]) => string
  
  /** 自定义响应头部 */
  headers?: Record<string, string>
  
  /** 是否禁用缓存，默认：false */
  noCache?: boolean
  
  /** 缓存控制指令，默认：'public' */
  directive?: 'public' | 'private' | 'must-revalidate' | 'no-cache' | 'no-store' | 'no-transform' | 'proxy-revalidate' | 'immutable'
  
  /** 缓存最大年龄（秒），默认：86400 (24小时) */
  maxAge?: number | null
  
  /** 是否启用 index.html 服务，默认：true */
  indexHTML?: boolean
}
```

### 默认配置

```typescript
const defaultOptions = {
  assets: 'public',                    // 静态文件目录
  prefix: '/public',                   // URL 前缀
  staticLimit: 1024,                   // 文件数量限制
  alwaysStatic: process.env.NODE_ENV === 'production',  // 生产环境默认启用
  ignorePatterns: ['.DS_Store', '.git', '.env'],        // 忽略的文件
  noExtension: false,                  // 需要文件扩展名
  enableDecodeURI: false,              // 不启用 URI 解码
  resolve: resolveFn,                  // 使用 Node.js resolve
  headers: {},                         // 无自定义头部
  noCache: false,                      // 启用缓存
  directive: 'public',                 // 公共缓存
  maxAge: 86400,                       // 24小时缓存
  indexHTML: true                      // 启用 index.html
}
```

## 使用模式

### 1. 基本静态文件服务

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static'
})

const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { message: 'Welcome to Static File Server' }
        })
    }
]

const server = new Server([...routes, ...staticRoutes])

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

### 2. 生产环境优化

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
    assets: 'dist',
    prefix: '/assets',
    alwaysStatic: true,           // 生产环境使用静态路由
    noCache: false,               // 启用缓存
    maxAge: 31536000,             // 1年缓存
    directive: 'public, immutable' // 不可变缓存
})

const server = new Server(staticRoutes)

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

### 3. 自定义头部和缓存控制

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    headers: {
        'X-Served-By': 'Vafast Static Plugin',
        'X-Version': '1.0.0'
    },
    noCache: false,
    directive: 'public',
    maxAge: 3600  // 1小时缓存
})

const server = new Server(staticRoutes)

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

### 4. 忽略特定文件

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    ignorePatterns: [
        '.DS_Store',
        '.git',
        '.env',
        '*.log',
        'temp/*',
        /\.(config|local)$/  // 使用正则表达式
    ]
})

const server = new Server(staticRoutes)

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

### 5. 无扩展名支持

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'

const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    noExtension: true,        // 不需要文件扩展名
    alwaysStatic: true        // 必须启用
})

const server = new Server(staticRoutes)

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

### 6. 混合路由配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'

// 创建静态文件路由
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    alwaysStatic: false,      // 使用通配符路由
    staticLimit: 500          // 降低限制以使用通配符
})

// 添加自定义路由
const customRoutes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return { message: 'Mixed routes server' }
        })
    },
    {
        method: 'GET',
        path: '/api/status',
        handler: createRouteHandler(() => {
            return { status: 'running', staticRoutes: staticRoutes.length }
        })
    }
]

const server = new Server([...customRoutes, ...staticRoutes])

export default {
    fetch: (req: Request) => server.fetch(req)
}
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'
import { join } from 'path'

// 创建不同配置的静态文件路由
const publicStaticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/public',
    alwaysStatic: true,
    headers: {
        'X-Served-By': 'Vafast Static Plugin',
        'X-Category': 'Public Assets'
    },
    noCache: false,
    directive: 'public',
    maxAge: 86400  // 24小时
})

const assetsStaticRoutes = await staticPlugin({
    assets: 'dist/assets',
    prefix: '/assets',
    alwaysStatic: true,
    headers: {
        'X-Served-By': 'Vafast Static Plugin',
        'X-Category': 'Build Assets'
    },
    noCache: false,
    directive: 'public, immutable',
    maxAge: 31536000  // 1年
})

const docsStaticRoutes = await staticPlugin({
    assets: 'docs',
    prefix: '/docs',
    alwaysStatic: false,      // 使用通配符路由
    staticLimit: 100,         // 降低限制
    enableDecodeURI: true,    // 启用 URI 解码
    headers: {
        'X-Served-By': 'Vafast Static Plugin',
        'X-Category': 'Documentation'
    },
    noCache: true,            // 文档不缓存
    indexHTML: true           // 支持 index.html
})

// 定义自定义路由
const routes = [
    {
        method: 'GET',
        path: '/',
        handler: createRouteHandler(() => {
            return {
                message: 'Vafast Static File Server',
                version: '1.0.0',
                endpoints: [
                    'GET /public/* - 公共静态文件（24小时缓存）',
                    'GET /assets/* - 构建资源（1年缓存）',
                    'GET /docs/* - 文档文件（无缓存）',
                    'GET /api/status - 服务器状态',
                    'GET /api/files - 文件统计'
                ]
            }
        })
    },
    {
        method: 'GET',
        path: '/api/status',
        handler: createRouteHandler(() => {
            return {
                status: 'running',
                timestamp: new Date().toISOString(),
                staticRoutes: {
                    public: publicStaticRoutes.length,
                    assets: assetsStaticRoutes.length,
                    docs: docsStaticRoutes.length
                }
            }
        })
    },
    {
        method: 'GET',
        path: '/api/files',
        handler: createRouteHandler(async () => {
            // 这里可以添加文件统计逻辑
            return {
                message: 'File statistics',
                totalRoutes: publicStaticRoutes.length + assetsStaticRoutes.length + docsStaticRoutes.length,
                categories: {
                    public: publicStaticRoutes.length,
                    assets: assetsStaticRoutes.length,
                    docs: docsStaticRoutes.length
                }
            }
        })
    }
]

// 合并所有路由
const allRoutes = [
    ...routes,
    ...publicStaticRoutes,
    ...assetsStaticRoutes,
    ...docsStaticRoutes
]

// 创建服务器
const server = new Server(allRoutes)

// 导出 fetch 函数
export default {
    fetch: (req: Request) => server.fetch(req)
}

console.log('🚀 Vafast Static File Server 启动成功！')
console.log('📁 公共文件：/public/* (24小时缓存)')
console.log('🔧 构建资源：/assets/* (1年缓存)')
console.log('📚 文档文件：/docs/* (无缓存)')
console.log('📊 总路由数：', allRoutes.length)
```

## 测试示例

```typescript
import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { Server, createRouteHandler } from 'vafast'
import { staticPlugin } from '@vafast/static'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('Vafast Static Plugin', () => {
    let tempDir: string
    let testFilePath: string
    let testHtmlPath: string

    beforeAll(async () => {
        // 创建临时目录和测试文件
        tempDir = join(tmpdir(), 'vafast-static-test-' + Date.now())
        await mkdir(tempDir, { recursive: true })

        // 创建测试文件
        testFilePath = join(tempDir, 'test.txt')
        await writeFile(testFilePath, 'Hello, Static File!')

        // 创建测试 HTML 文件
        testHtmlPath = join(tempDir, 'index.html')
        await writeFile(testHtmlPath, '<html><body>Test HTML</body></html>')
    })

    afterAll(async () => {
        // 清理临时文件
        await rm(tempDir, { recursive: true, force: true })
    })

    it('should create static routes', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true
        })

        expect(routes).toBeDefined()
        expect(Array.isArray(routes)).toBe(true)
        expect(routes.length).toBeGreaterThan(0)
    })

    it('should serve static files with correct paths', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true
        })

        const app = new Server(routes)

        // 测试访问静态文件
        const res = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(res.status).toBe(200)
        const data = await res.text()
        expect(data).toBe('Hello, Static File!')
    })

    it('should handle index.html correctly', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true,
            indexHTML: true
        })

        const app = new Server(routes)

        // 测试访问目录根路径（应该返回 index.html）
        const res = await app.fetch(new Request('http://localhost/static/'))
        expect(res.status).toBe(200)
        const data = await res.text()
        expect(data).toContain('Test HTML')
    })

    it('should respect custom headers', async () => {
        const customHeaders = {
            'X-Custom-Header': 'custom-value',
            'X-Another-Header': 'another-value'
        }

        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true,
            headers: customHeaders
        })

        const app = new Server(routes)

        const res = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(res.status).toBe(200)

        // 检查自定义头部
        expect(res.headers.get('X-Custom-Header')).toBe('custom-value')
        expect(res.headers.get('X-Another-Header')).toBe('another-value')
    })

    it('should handle caching correctly', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true,
            noCache: false,
            directive: 'public',
            maxAge: 3600
        })

        const app = new Server(routes)

        const res = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(res.status).toBe(200)

        // 检查缓存头部
        expect(res.headers.get('Cache-Control')).toContain('public')
        expect(res.headers.get('Cache-Control')).toContain('max-age=3600')
        expect(res.headers.get('Etag')).toBeDefined()
    })

    it('should handle no-cache option', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true,
            noCache: true
        })

        const app = new Server(routes)

        const res = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(res.status).toBe(200)

        // 检查无缓存头部
        expect(res.headers.get('Cache-Control')).toBeUndefined()
        expect(res.headers.get('Etag')).toBeUndefined()
    })

    it('should handle wildcard routes when not alwaysStatic', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: false,
            staticLimit: 1  // 强制使用通配符路由
        })

        const app = new Server(routes)

        // 应该有一个通配符路由
        const wildcardRoute = routes.find(route => route.path === '/static/*')
        expect(wildcardRoute).toBeDefined()

        // 测试通配符路由
        const res = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(res.status).toBe(200)
        const data = await res.text()
        expect(data).toBe('Hello, Static File!')
    })

    it('should ignore specified patterns', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true,
            ignorePatterns: ['test.txt']
        })

        // 被忽略的文件不应该有路由
        const ignoredRoute = routes.find(route => route.path === '/static/test.txt')
        expect(ignoredRoute).toBeUndefined()
    })

    it('should handle root prefix correctly', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/',  // 根前缀
            alwaysStatic: true
        })

        const app = new Server(routes)

        // 测试使用根前缀访问文件
        const res = await app.fetch(new Request('http://localhost/test.txt'))
        expect(res.status).toBe(200)
        const data = await res.text()
        expect(data).toBe('Hello, Static File!')
    })

    it('should handle 304 Not Modified responses', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true,
            noCache: false
        })

        const app = new Server(routes)

        // 第一次请求
        const res1 = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(res1.status).toBe(200)
        const etag = res1.headers.get('Etag')
        expect(etag).toBeDefined()

        // 第二次请求，带 If-None-Match 头部
        const res2 = await app.fetch(
            new Request('http://localhost/static/test.txt', {
                headers: {
                    'If-None-Match': etag!
                }
            })
        )

        // 应该返回 304 Not Modified
        expect(res2.status).toBe(304)
    })

    it('should work with custom routes', async () => {
        const staticRoutes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true
        })

        // 添加自定义路由
        const customRoutes = [
            {
                method: 'GET',
                path: '/',
                handler: createRouteHandler(() => {
                    return { message: 'Static server is running' }
                })
            }
        ]

        const allRoutes = [...customRoutes, ...staticRoutes]
        const app = new Server(allRoutes)

        // 测试自定义路由
        const customRes = await app.fetch(new Request('http://localhost/'))
        expect(customRes.status).toBe(200)
        const customData = await customRes.json()
        expect(customData.message).toBe('Static server is running')

        // 测试静态文件路由
        const staticRes = await app.fetch(
            new Request('http://localhost/static/test.txt')
        )
        expect(staticRes.status).toBe(200)
        const staticData = await staticRes.text()
        expect(staticData).toBe('Hello, Static File!')
    })

    it('should handle file not found correctly', async () => {
        const routes = await staticPlugin({
            assets: tempDir,
            prefix: '/static',
            alwaysStatic: true
        })

        const app = new Server(routes)

        // 测试访问不存在的文件
        try {
            await app.fetch(
                new Request('http://localhost/static/nonexistent.txt')
            )
            // 如果到这里，说明错误没有被正确处理
            expect(true).toBe(false)
        } catch (error) {
            expect(error).toBeDefined()
        }
    })
})
```

## 特性

- ✅ **高性能**: 支持静态路由和通配符路由两种模式
- ✅ **智能缓存**: 自动生成 ETag 和缓存控制头部
- ✅ **灵活配置**: 支持自定义头部、缓存策略和忽略模式
- ✅ **文件扩展名**: 可选的扩展名支持
- ✅ **索引文件**: 自动服务 index.html 文件
- ✅ **路径安全**: 防止目录遍历攻击
- ✅ **类型安全**: 完整的 TypeScript 类型支持
- ✅ **易于集成**: 无缝集成到 Vafast 应用

## 最佳实践

### 1. 生产环境配置

```typescript
const staticRoutes = await staticPlugin({
    assets: 'dist',
    prefix: '/assets',
    alwaysStatic: true,           // 生产环境使用静态路由
    noCache: false,               // 启用缓存
    maxAge: 31536000,             // 1年缓存
    directive: 'public, immutable' // 不可变缓存
})
```

### 2. 开发环境配置

```typescript
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    alwaysStatic: false,          // 开发环境使用通配符路由
    noCache: true,                // 禁用缓存便于调试
    maxAge: null                  // 无缓存年龄
})
```

### 3. 安全配置

```typescript
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    ignorePatterns: [
        '.env',
        '.git',
        '*.log',
        'temp/*',
        /\.(config|local)$/
    ]
})
```

### 4. 性能优化

```typescript
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    alwaysStatic: files.length <= 1000,  // 根据文件数量动态选择
    staticLimit: 1000,                   // 设置合理的限制
    headers: {
        'X-Content-Type-Options': 'nosniff'
    }
})
```

### 5. 监控和调试

```typescript
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    alwaysStatic: true
})

// 添加监控路由
const monitorRoutes = [
    {
        method: 'GET',
        path: '/admin/static-stats',
        handler: createRouteHandler(() => {
            return {
                totalRoutes: staticRoutes.length,
                mode: 'static',
                timestamp: new Date().toISOString(),
                cacheInfo: {
                    statCache: statCache.keys().length,
                    fileCache: fileCache.keys().length,
                    htmlCache: htmlCache.keys().length
                }
            }
        })
    }
]
```

### 6. 错误处理和日志

```typescript
import { createRouteHandler } from 'vafast'

const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    alwaysStatic: false,  // 使用通配符路由以支持错误处理
    staticLimit: 100
})

// 添加错误处理中间件
const errorHandlingRoutes = [
    {
        method: 'GET',
        path: '/static/*',
        handler: createRouteHandler(async (req: Request) => {
            try {
                // 这里可以添加自定义的错误处理逻辑
                const response = await handleStaticRequest(req)
                return response
            } catch (error) {
                console.error('Static file error:', error)
                
                if (error instanceof NotFoundError) {
                    return new Response('File not found', { status: 404 })
                }
                
                return new Response('Internal server error', { status: 500 })
            }
        })
    }
]
```

## 高级特性

### 1. 智能路由选择

中间件会根据文件数量和配置自动选择最优的路由模式：

```typescript
// 文件数量 <= staticLimit (默认 1024) 时使用静态路由
const staticRoutes = await staticPlugin({
    assets: 'public',
    prefix: '/static',
    alwaysStatic: false,      // 让中间件自动选择
    staticLimit: 500          // 降低阈值以使用通配符路由
})

// 文件数量 > staticLimit 时自动使用通配符路由
// 这样可以减少内存占用，提高启动速度
```

### 2. 多层缓存系统

中间件内置了三层缓存系统：

```typescript
// 文件状态缓存 (3小时 TTL)
const statCache = new Cache({
    useClones: false,
    checkperiod: 5 * 60,      // 5分钟检查一次
    stdTTL: 3 * 60 * 60,      // 3小时过期
    maxKeys: 250               // 最多缓存250个文件状态
})

// 文件路径缓存 (3小时 TTL)
const fileCache = new Cache({
    useClones: false,
    checkperiod: 5 * 60,
    stdTTL: 3 * 60 * 60,
    maxKeys: 250
})

// HTML 文件缓存 (3小时 TTL)
const htmlCache = new Cache({
    useClones: false,
    checkperiod: 5 * 60,
    stdTTL: 3 * 60 * 60,
    maxKeys: 250
})
```

### 3. 智能 ETag 生成

中间件使用 MD5 哈希算法生成 ETag，支持 HTTP 304 响应：

```typescript
// 自动生成 ETag
const etag = await generateETag(filePath)

// 支持 If-None-Match 头部
if (await isCached(headersRecord, etag, filePath)) {
    return new Response(null, {
        status: 304,
        headers
    })
}
```

### 4. 跨平台路径处理

中间件自动处理不同操作系统的路径分隔符：

```typescript
const URL_PATH_SEP = '/'
const isFSSepUnsafe = sep !== URL_PATH_SEP

// 自动转换路径分隔符
const pathName = isFSSepUnsafe
    ? prefix + relativePath.split(sep).join(URL_PATH_SEP)
    : join(prefix, relativePath)
```

## 注意事项

1. **文件数量**: 大量文件时建议使用通配符路由以减少内存占用
2. **缓存策略**: 根据文件类型和更新频率设置合适的缓存策略
3. **安全考虑**: 避免暴露敏感文件，使用 ignorePatterns 过滤
4. **性能影响**: 静态路由模式在启动时扫描所有文件，大目录可能影响启动时间
5. **路径安全**: 中间件已内置路径安全检查，防止目录遍历攻击
6. **缓存清理**: 中间件会自动清理过期的缓存项，无需手动管理
7. **内存使用**: 通配符路由模式内存占用更少，适合大文件目录
8. **启动时间**: 静态路由模式启动更快，但内存占用更多

## 版本信息

- **当前版本**: 0.0.1
- **Vafast 兼容性**: >= 0.1.12
- **Node.js 支持**: >= 18.0.0
- **Bun 支持**: 完全支持

## 更新日志

查看完整的更新历史：[CHANGELOG.md](https://github.com/vafastjs/vafast-static/blob/main/CHANGELOG.md)

### 最新特性

- ✅ 智能路由选择（静态路由 vs 通配符路由）
- ✅ 多层缓存系统（文件状态、路径、HTML）
- ✅ 智能 ETag 生成和 HTTP 304 支持
- ✅ 跨平台路径处理
- ✅ 完整的 TypeScript 类型支持
- ✅ 灵活的缓存策略配置
- ✅ 安全的文件访问控制

## 相关链接

- [HTTP 缓存 MDN 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [ETag MDN 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
- [Cache-Control MDN 文档](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Vafast 官方文档](https://vafast.dev)
- [GitHub 仓库](https://github.com/vafastjs/vafast-static)
- [问题反馈](https://github.com/vafastjs/vafast-static/issues)