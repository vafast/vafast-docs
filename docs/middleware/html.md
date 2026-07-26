---
title: HTML 中间件 - Vafast
---

# HTML

`@vafast/html` 在请求上挂载 `req.html`，提供 `html()` / `stream()`，配合 [@kitajs/html](https://github.com/kitajs/html) 返回 HTML。

::: warning 不要直接 return HTML 字符串
框架会把普通 `string` 当成 **`text/plain`**。必须 `return req.html.html(...)`（或自行构造 `Content-Type: text/html` 的 `Response`）。
:::

## 安装

```bash
npm install @vafast/html
```

## 快速开始

```typescript
import { Server, defineRoute, defineRoutes, serve } from 'vafast'
import { html } from '@vafast/html'

type HtmlRequest = Request & {
  html: {
    html: (value: string | JSX.Element) => Response | string | Promise<Response | string>
  }
}

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: ({ req }) => {
      return (req as HtmlRequest).html.html(`
        <!doctype html>
        <html>
          <body><h1>Hello</h1></body>
        </html>
      `)
    },
  }),
])

const server = new Server(routes)
server.use(html())
serve({ fetch: server.fetch, port: 3000 })
```

## 用法

### 全局挂载

```typescript
server.use(html())
// 路由里仍须调用 req.html.html(...)
```

### 路由级挂载

```typescript
defineRoute({
  method: 'GET',
  path: '/page',
  middleware: [html()],
  handler: ({ req }) => (req as HtmlRequest).html.html('<html><body>Hi</body></html>'),
})
```

### `req.html.html(value)`

渲染字符串 / JSX，返回带 `content-type` 的 `Response`。若 `autoDoctype` 开启且内容以 `<html` 开头，会自动加 `<!doctype html>`。

### `req.html.stream(fn, args)`

基于 `@kitajs/html/suspense` 的流式渲染：

```typescript
handler: ({ req }) => {
  return (req as HtmlRequest & {
    html: {
      stream: (
        fn: (arg: { id: number; title: string }) => JSX.Element,
        args: { title: string },
      ) => Response | Promise<Response>
    }
  }).html.stream(
    ({ id, title }) => `<html><body><h1>${title} #${id}</h1></body></html>`,
    { title: 'Stream' },
  )
}
```

### 自动检测（`autoDetect`）

默认开启：若下游 `Response` 已是 `text/html`，会统一改写为配置的 `contentType`。

**不会**把 handler 返回的普通字符串魔法转成 HTML。

### 其它导出

```typescript
import {
  html,           // createHtmlPlugin 别名
  createHtmlPlugin,
  Html,           // @kitajs/html
  createElement,
  ErrorBoundary,
  isHtml,
} from '@vafast/html'
```

## API完整参数

### `html(options?)` / `createHtmlPlugin(options?)`

```typescript
html(options?: HtmlOptions): Middleware
```

### `HtmlOptions`

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `contentType` | `string` | `'text/html; charset=utf8'` | HTML 响应 Content-Type |
| `autoDetect` | `boolean` | `true` | 下游已是 HTML Response 时统一 content-type |
| `autoDoctype` | `boolean \| 'full'` | `true` | 对经 `html()` / `stream()` 渲染、且以 `<html` 开头的内容前置 doctype |
| `isHtml` | `(value: string) => boolean` | 内置 `isHtml` | 字符串是否像 HTML（长度≥7、以 `<` 开头、以 `>` 结尾） |

### `req.html` 方法

| 方法 | 说明 |
|------|------|
| `html(value)` | `value`: 字符串 / Readable / JSX；返回 HTML `Response` |
| `stream(fn, args)` | `fn` 接收 `args & { id }`，流式渲染 |

## 最佳实践

- 一律 `return req.html.html(...)`，不要 `return '<html>...'`  
- SSR / 大页面优先考虑 `stream`  
- JSX 项目配合 `@kitajs/html` 与 TypeScript JSX 配置  
- 全局 `server.use(html())` 一次即可，避免重复挂载

## 注意事项

- **字符串返回值 = `text/plain`**，这是框架行为，不是 bug  
- `autoDoctype: 'full'` 在类型注释里表示「无插件返回也加 doctype」，当前中间件主路径对普通 string 返回**不会**自动转换；请始终走 `req.html.html()`  
- `autoDetect` 只处理已是 HTML 的 `Response`，不改变 plain text  
- 中间件把对象挂到 `(req as any).html`；TypeScript 侧建议自建 `HtmlRequest` 类型

## 相关链接

- [处理程序](/essential/handler)
- [中间件概览](/middleware)
