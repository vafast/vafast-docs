---
title: HTML 中间件 - Vafast
---

# HTML 中间件

允许您在 Vafast 服务器中使用 [JSX](#jsx) 和 HTML，并提供适当的头部和支持。

## ✨ 特性

- 🚀 **快速 HTML 渲染** - 高效的 HTML 响应处理
- 🔧 **简单集成** - 与 Vafast 的简单中间件集成
- 📝 **JSX 支持** - 支持 JSX 元素和流式渲染
- 🎯 **自动检测** - 自动检测和处理 HTML 响应
- ⚡ **流式支持** - 内置流式 HTML 响应

## 安装

通过以下命令安装：

```bash
bun add @vafast/html
```

## 快速开始

```typescript
import { Server, createRouteHandler } from 'vafast'
import { html } from '@vafast/html'

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Hello World</title>
          </head>
          <body>
            <h1>Hello from Vafast!</h1>
          </body>
        </html>
      `
    })
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用 HTML 中间件
export default {
  fetch: (req: Request) => {
    // 应用 HTML 中间件
    return html()(req, () => server.fetch(req))
  }
}
```

## 基本用法

### 基础 HTML 响应

```typescript
import { html } from '@vafast/html'

// 使用 HTML 中间件
app.use(html())

app.get('/page', (req) => {
  return req.html.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My Page</title>
      </head>
      <body>
        <h1>Welcome!</h1>
        <p>This is a simple HTML page.</p>
      </body>
    </html>
  `)
})
```

### JSX 支持

Vafast HTML 基于 [@kitajs/html](https://github.com/kitajs/html)，允许我们在编译时将 JSX 定义为字符串，以实现高性能。

需要使用 JSX 的文件名称应以后缀 **"x"** 结尾：

- .js -> .jsx
- .ts -> .tsx

要注册 TypeScript 类型，请将以下内容添加到 **tsconfig.json**：

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "Html.createElement",
    "jsxFragmentFactory": "Html.Fragment"
  }
}
```

使用 JSX 的示例：

```tsx
import { Server, createRouteHandler } from 'vafast'
import { html, Html } from '@vafast/html'

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => (
      <html lang="en">
        <head>
          <title>Hello World</title>
        </head>
        <body>
          <h1>Hello World</h1>
        </body>
      </html>
    ))
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return html()(req, () => server.fetch(req))
  }
}
```

### 流式响应

```typescript
app.get('/stream', (req) => {
  return req.html.stream(({ id }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Streaming</title>
      </head>
      <body>
        <h1>Stream ID: ${id}</h1>
        <p>Generated at: ${new Date().toISOString()}</p>
      </body>
    </html>
  `, { timestamp: Date.now() })
})
```

## API 参考

### `html(options?: HtmlOptions)`

创建一个具有指定选项的 HTML 中间件。

#### 选项

- `contentType` - HTML 响应的 Content-Type 头部（默认：`"text/html; charset=utf8"`）
- `autoDetect` - 自动检测 HTML 响应（默认：`true`）
- `autoDoctype` - 自动为 HTML 添加 DOCTYPE（默认：`true`）
- `isHtml` - 检测 HTML 内容的自定义函数

### `req.html.html(value: string | JSX.Element)`

渲染 HTML 内容并返回一个 Response 对象。

### `req.html.stream<T>(value: Function, args: T)`

创建一个流式 HTML 响应。

## 配置选项

### HtmlOptions

```typescript
interface HtmlOptions {
  /**
   * 响应的内容类型
   * @default 'text/html; charset=utf8'
   */
  contentType?: string

  /**
   * 是否自动检测 HTML 内容并设置内容类型
   * @default true
   */
  autoDetect?: boolean

  /**
   * 是否在响应开头是 <html> 时自动添加 <!doctype html>，如果未找到
   * 
   * 使用 'full' 还可以在没有此中间件的响应中自动添加文档类型
   * 
   * @default true
   */
  autoDoctype?: boolean | 'full'

  /**
   * 用于检测字符串是否为 HTML 的函数
   * 
   * 默认实现是如果长度大于 3，且以 < 开头并以 > 结尾
   * 
   * 没有真正的方法来验证 HTML，所以这只是一个最佳猜测
   * @default isHtml
   */
  isHtml?: (this: void, value: string) => boolean
}
```

## 高级用法

### 自定义选项

```typescript
app.use(html({
  contentType: "text/html; charset=UTF-8",
  autoDetect: true,
  autoDoctype: false
}))
```

### XSS 防护

Vafast HTML 基于 Kita HTML 中间件，在编译时检测可能的 XSS 攻击。

您可以使用专用的 `safe` 属性来清理用户值，以防止 XSS 漏洞：

```tsx
import { Server, createRouteHandler } from 'vafast'
import { html, Html } from '@vafast/html'

const routes = [
  {
    method: 'POST',
    path: '/',
    handler: createRouteHandler(({ body }) => (
      <html lang="en">
        <head>
          <title>Hello World</title>
        </head>
        <body>
          <h1 safe>{body}</h1>
        </body>
      </html>
    ))
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    return html()(req, () => server.fetch(req))
  }
}
```

### 类型安全提醒

要添加类型安全提醒，请安装：

```bash
bun add @kitajs/ts-html-plugin
```

然后在 **tsconfig.json** 中添加以下内容：

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "Html.createElement",
    "jsxFragmentFactory": "Html.Fragment",
    "plugins": [{ "name": "@kitajs/ts-html-plugin" }]
  }
}
```

## 从 Elysia 迁移

如果您正在从 `@elysiajs/html` 迁移，主要变化是：

1. **导入**: 从 `import { html } from '@elysiajs/html'` 改为 `import { html } from '@vafast/html'`
2. **用法**: 使用 `app.use(html())` 而不是 `app.use(html())`
3. **API**: API 保持不变：`req.html.html()` 和 `req.html.stream()`

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { html, Html } from '@vafast/html'

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => (
      <html lang="en">
        <head>
          <title>Vafast HTML Plugin</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <h1>Welcome to Vafast!</h1>
          <p>This page is rendered using the HTML plugin.</p>
          <ul>
            <li>Fast HTML rendering</li>
            <li>JSX support</li>
            <li>Streaming responses</li>
            <li>Auto-detection</li>
          </ul>
        </body>
      </html>
    ))
  },
  {
    method: 'GET',
    path: '/dynamic/:name',
    handler: createRouteHandler(({ params }) => (
      <html lang="en">
        <head>
          <title>Hello {params.name}</title>
        </head>
        <body>
          <h1>Hello, {params.name}!</h1>
          <p>Welcome to your personalized page.</p>
        </body>
      </html>
    ))
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数，应用 HTML 中间件
export default {
  fetch: (req: Request) => {
    return html()(req, () => server.fetch(req))
  }
}
```

## 测试

```bash
bun test
```

## 相关链接

- [GitHub 仓库](https://github.com/vafastjs/vafast-html)
- [@kitajs/html](https://github.com/kitajs/html) - 底层 HTML 渲染库
- [Vafast 官方文档](https://vafast.dev)