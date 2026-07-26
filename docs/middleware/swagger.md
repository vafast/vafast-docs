---
title: Swagger - Vafast
---

# Swagger

`@vafast/swagger` 为 Vafast 提供 **OpenAPI 文档 UI** 与 **OpenAPI JSON** 端点。UI 可选 [Scalar](https://github.com/scalar/scalar)（默认）或经典 [Swagger UI](https://swagger.io/tools/swagger-ui/)。

::: warning 不会自动扫描路由
当前实现**只**响应配置的 `path`（UI 页面）与 `specPath`（JSON 规范）。规范内容完全来自你传入的 `documentation`（尤其是 `documentation.paths`），**不会**从 `defineRoute` 自动生成。
:::

## 先搞清几个概念（给新用户）

### OpenAPI 文档长什么样？

中间件最终产出一份 OpenAPI **3.0.3** JSON，结构固定为：

```typescript
{
  openapi: '3.0.3',
  info: { title, description, version },
  paths: { /* 各接口 */ },
  components: { /* 可复用 schema / 安全方案等 */ },
  tags: [ /* 分组标签 */ ],
}
```

### `documentation.info` 字段（拆开说明）

| 字段 | 作用 | 缺省值（源码） |
|------|------|----------------|
| `info.title` | API 名称，显示在 UI 标题等处 | `'Vafast API'` |
| `info.description` | 简短说明，介绍这套 API 做什么 | `'API documentation'` |
| `info.version` | **你的 API 版本号**（不是 Swagger UI CDN 版本） | `'1.0.0'` |

注意区分：

- `documentation.info.version` → OpenAPI 里的 API 版本
- 配置项 `version` → **Swagger UI** 的 `swagger-ui-dist` CDN 版本（默认 `'4.18.2'`）
- `scalarVersion` → **Scalar** CDN 版本（默认 `'latest'`）

### `paths` / `components` / `tags` 是什么？

| 字段 | 白话 |
|------|------|
| **`paths`** | 核心：每个 URL 路径下有哪些 HTTP 方法、参数、响应。UI 里看到的接口列表就来自这里。**不写就空白。** |
| **`components`** | 可复用零件：如 `schemas`（数据模型）、`securitySchemes`（Bearer / API Key 等）。在 path 里用 `$ref` 引用。 |
| **`tags`** | 给接口分组的标签元数据（名称 + 可选描述）。各 operation 上的 `tags: ['users']` 与之对应，UI 会按组折叠。 |

### `provider`：Scalar vs Swagger UI

| `provider` | 体验 | 主要相关配置 |
|------------|------|----------------|
| **`'scalar'`**（默认） | 现代阅读体验，适合浏览与试调用 | `scalarVersion`、`scalarCDN`、`scalarConfig` |
| **`'swagger-ui'`** | 经典 Swagger UI，「Try it out」习惯用户多 | `version`、`swaggerOptions`、`autoDarkMode` |

两者都从相对路径 `./json` 拉取规范（相对 UI 页面路径）。自定义 `path` / `specPath` 时注意相对关系。

### 哪些配置目前没用？

类型 `VafastSwaggerConfig` 里仍有 `theme`、`excludeStaticFile`、`exclude`、`excludeMethods`、`excludeTags`，但 **`swagger()` 中间件主路径未用它们做换肤、扫描或过滤**（详见下方 API 表）。请以手写 `documentation` 为准。

## 安装

```bash
npm install @vafast/swagger
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { swagger } from '@vafast/swagger'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    handler: () => [{ id: 1, name: 'Ada' }],
  }),
])

const server = new Server(routes)

server.use(
  swagger({
    path: '/swagger',
    provider: 'scalar',
    documentation: {
      info: {
        title: 'My API',
        version: '1.0.0',
        description: '示例 API',
      },
      paths: {
        '/users': {
          get: {
            summary: '用户列表',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }),
)

serve({ fetch: server.fetch, port: 3000 })
```

- UI：`http://localhost:3000/swagger`
- JSON：`http://localhost:3000/swagger/json`（默认 `specPath = ${path}/json`）

## 用法

### 手写完整 `documentation`（含 components 最小示例）

路由增加后，必须同步维护 `paths`，否则 UI 里看不到：

```typescript
documentation: {
  info: {
    title: 'API',
    description: '业务 API',
    version: '1.0.0',
  },
  tags: [{ name: 'users', description: '用户相关' }],
  paths: {
    '/users/{id}': {
      get: {
        tags: ['users'],
        summary: '用户详情',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['id'],
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
}
```

源码里 `components` / `schemas` 结构较宽松（属性多为 `any`），上表是常见、可用的最小写法。

### 切换 Swagger UI

```typescript
swagger({
  provider: 'swagger-ui',
  version: '4.18.2', // swagger-ui-dist CDN 版本
  autoDarkMode: true,
  swaggerOptions: {
    persistAuthorization: true,
  },
  documentation: { /* ... */ },
})
```

### Scalar 自定义

```typescript
swagger({
  provider: 'scalar',
  scalarVersion: 'latest',
  scalarCDN: '', // 空则用 jsDelivr；可换成自建 URL
  scalarConfig: { theme: 'default' },
  documentation: { /* ... */ },
})
```

### 自定义路径

```typescript
swagger({
  path: '/docs',
  specPath: '/docs/openapi.json',
  documentation: { paths: { /* ... */ } },
})
```

## API

### `swagger(config?)`

```typescript
swagger(config?: VafastSwaggerConfig): Middleware
```

中间件逻辑：

1. `pathname === path` → 返回 UI HTML（`htmlResponse`）
2. `pathname === specPath` → 返回 `createOpenAPISpec(documentation)` JSON
3. 其它 → `next()`

### `VafastSwaggerConfig`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `provider` | `'scalar' \| 'swagger-ui'` | `'scalar'` | UI 提供方 |
| `path` | `string` | `'/swagger'` | UI 路径 |
| `specPath` | `string` | `` `${path}/json` `` | OpenAPI JSON 路径 |
| `documentation` | 见下表 | `{}` | **手写**规范片段 |
| `scalarVersion` | `string` | `'latest'` | Scalar CDN 版本 |
| `scalarCDN` | `string` | `''` | 自定义 Scalar script URL；空则用 jsDelivr |
| `scalarConfig` | `Record<string, any>` | `{}` | 写入 Scalar `data-configuration` |
| `version` | `string` | `'4.18.2'` | Swagger UI dist 版本 |
| `swaggerOptions` | `Record<string, any>` | `{}` | 注入 `SwaggerUIBundle({...})`（函数类选项不支持） |
| `autoDarkMode` | `boolean` | `true` | Swagger UI 暗色媒体查询 |

### `documentation` 字段

| 字段 | 说明 |
|------|------|
| `info.title` | API 标题；缺省 `'Vafast API'` |
| `info.description` | API 描述；缺省 `'API documentation'` |
| `info.version` | API 版本；缺省 `'1.0.0'` |
| `paths` | OpenAPI paths（**需手写**）；缺省 `{}` |
| `components` | 如 `schemas`、`securitySchemes`；缺省 `{}` |
| `tags` | `{ name, description? }[]`；缺省 `[]` |

### 配置了但当前未使用的选项

类型里仍有以下字段，**当前 `swagger()` 实现未用于过滤、扫描或换肤**：

| 参数 | 默认 | 说明 |
|------|------|------|
| `theme` | unpkg swagger-ui.css URL | 传入 `renderSwaggerUI` 形参但**未使用**；CSS 写死 unpkg |
| `excludeStaticFile` | `true` | 未参与中间件分支逻辑 |
| `exclude` | `[]` | 未用于排除 path |
| `excludeMethods` | `['OPTIONS']` | 未用于过滤 methods |
| `excludeTags` | `[]` | 未用于过滤 tags |

请以手写 `documentation` 为准，不要假设这些选项会自动改规范。

## 最佳实践

1. 把 `documentation` 抽到独立模块（如 `openapi.ts`），与路由变更一起 review
2. 需要从代码生成 OpenAPI 时，另见 [OpenAPI 集成](/integrations/openapi) 或自建生成器，再把结果传入 `documentation`
3. 生产可把 UI 限内网，或仅暴露 `specPath` 给网关聚合
4. Scalar 适合现代阅读；需要经典 Try-it-out 时用 `swagger-ui`
5. `components.schemas` + `$ref` 避免在每个 path 里重复贴同一份模型

## 注意事项

- **不会**自动发现 `defineRoute`；漏写 `paths` = UI 空白
- `theme` / `exclude*` / `excludeStaticFile` 在中间件路径上基本无效
- UI 通过相对路径 `./json` 拉规范；自定义 `path` 时注意与 `specPath` 的相对关系，必要时显式设 `specPath`
- CDN 依赖外网（unpkg / jsDelivr）；内网需自备静态资源并改 `scalarCDN`（Scalar）。Swagger UI 的 CSS/JS URL 当前写死 unpkg，内网需自行改源码或反代

## 相关链接

- [OpenAPI](/integrations/openapi)
- [路由](/routing)
- [中间件概览](/middleware)
- [OpenAPI 3.0.3](https://swagger.io/specification/v3)
- [Scalar](https://github.com/scalar/scalar)
- [Swagger UI](https://github.com/swagger-api/swagger-ui)
