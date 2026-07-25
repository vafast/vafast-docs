---
title: 与其他 TS 客户端对比 - Vafast
---

# 与其他 TypeScript 客户端对比

`@vafast/api-client` 提供 Eden 风格链式调用、`{ data, error }` 错误模型，以及 Koa 风格洋葱中间件。类型可通过契约或 CLI（`vafast sync`）获得，不依赖特定后端运行时。

下文先给出总览，再按 **调用风格 → 错误处理 → 客户端横切 → SSE → 类型与耦合** 逐项展开，最后给出选型建议。

## 总览

<div class="table-scroll">

| 维度 | **本库** | Eden | tRPC | Hono `hc` | OpenAPI | Axios / ky |
|------|----------|------|------|-----------|---------|------------|
| 调用风格 | 链式 `.post(body)` | Treaty 链式 | `query` / `mutate` | `$get(...)` | `GET('/path')` | `axios.get` |
| 错误处理 | `{ data, error }` | `{ data, error }` | 抛错 | `Response` | 视生成器 | 抛异常 |
| 客户端横切 | 洋葱 `next()` | 请求/响应钩子 | Links | headers / fetch | 弱 | 拦截器 |
| SSE | 同调用 `.sse()` | `subscribe` | subscription | 视用法 | 通常无 | 通常无 |
| 类型与耦合 | 契约 / CLI，弱耦合 | 同构，绑 Elysia | 同构，绑 tRPC | 同构，绑 Hono | 生成，无绑定 | 无端到端类型 |

</div>

## 一、调用风格

### 对照

<div class="table-scroll">

| 库 | 典型写法 | 特点 |
|----|----------|------|
| **本库** | `await api.users.find.post(body)` | 路径用 `.`，动词在链末，无 `$` 前缀 |
| **Eden** | `await app.users.post(body)` | Treaty：路径即属性，与本库最接近 |
| **tRPC** | `await trpc.users.list.query(input)` | 过程名 + `query` / `mutate`，弱化 HTTP 动词 |
| **Hono `hc`** | `await client.users.$get({ query })` | 路径链式，方法名加 `$`；入参常嵌套 `query` / `param` |
| **OpenAPI** | `await api.GET('/users', { params })` | 动词 + 字符串路径，资源感较弱 |
| **Axios** | `await axios.get('/users', { params })` | 经典 REST，无路径级类型补全 |

</div>

### 说明

本库借鉴 Eden「路径即属性」，并在细节上统一：

<div class="table-scroll">

| 约定 | 本库 | 其他库 |
|------|------|--------|
| 路径段 | `api.users.find` → `/users/find` | Eden 同类；Hono 类似但方法带 `$` |
| HTTP 方法 | `.get` / `.post`，无前缀 | Hono 为 `$get` / `$post` |
| 路径参数 | `api.users({ id: '1' }).get()` | 与 Eden 一致 |
| 入参 | GET/HEAD 第一参为 query，其余为 body | Hono 多为 `{ query, param }` |
| 路径段与动词同名 | `api.prices.delete.post()` → `POST /prices/delete` | 类型层区分路径节点与方法定义 |

</div>

```typescript
// 普通请求：懒执行，await 时才发出
const { data, error } = await api.users.find.post({ current: 1, pageSize: 20 })

// 路径参数 + 动词
await api.users({ id: '123' }).put({ name: 'Ada' })
```

方法调用返回 `RequestBuilder`（`PromiseLike`）：在 `await` 之前不发请求，因此可与下一节的 `.sse()` 共用同一表达式。相对 Hono，少 `$` 与嵌套包装；相对 tRPC，保留 HTTP 动词与路径可读性。

## 二、错误处理

### 对照

<div class="table-scroll">

| 库 | 模型 | 业务失败时 |
|----|------|------------|
| **本库** | `{ data, error }` | `if (error)`；422 可读 `error.details` |
| **Eden** | `{ data, error }` | 同 Result；错误结构随 Elysia 版本略有差异 |
| **tRPC** | 抛 `TRPCClientError` | `try / catch` |
| **Hono `hc`** | `Response` | 先判 `res.ok`，再 `json()` / `text()` |
| **OpenAPI** | 视生成器 | 常见 Result 或抛错两种 |
| **Axios** | 抛异常 | `catch` 中读 `e.response` |

</div>

### 说明

同一场景：分页查用户；失败输出信息，成功使用 `list`（`console` 可换成 UI）。

**本库 / Eden（Result）**

```typescript
const { data, error } = await api.users.find.post({ current: 1, pageSize: 20 })

if (error) {
  console.error(error.message)
  return
}

const users = data.list
```

**tRPC / Axios（异常）**

```typescript
try {
  const data = await trpc.users.list.query({ page: 1, pageSize: 20 })
  const users = data.list
} catch (e) {
  console.error(e.message)
}
```

**Hono `hc`（Response）**

```typescript
const res = await client.users.$get({ query: { page: '1' } })
if (!res.ok) {
  console.error(await res.text())
  return
}
const data = await res.json()
const users = data.list
```

本库与 Vafast 服务端约定对齐：业务错误进入 `error`（含 `code` / `message`），校验失败为 HTTP 422 + `details`，控制流保持线性，无需为业务失败包一层 `try / catch`。

## 三、客户端横切

### 对照

<div class="table-scroll">

| 库 | 模型 | 说明 |
|----|------|------|
| **本库** | `(ctx, next) => ResponseContext` | Koa 洋葱；`request` 与 SSE 用的 `requestRaw` 共用 `compose`；内置 `retry` / `timeout` / `logger` 同一接口 |
| **Eden** | `onRequest` / `onResponse` | 请求与响应分钩子，可数组叠加 |
| **tRPC** | Links | Observable 链，末端须为 terminating link（如 `httpLink`）；面向 RPC operation |
| **Hono `hc`** | 创建选项 | 主要是默认 `headers`、自定义 `fetch`；无一等客户端中间件栈（路由中间件在服务端） |
| **Axios** | `interceptors` | request / response 拦截器，生态成熟 |
| **OpenAPI** | 通常较弱 | 横切多依赖底层 fetch / 另接拦截层 |

</div>

### 说明

各库都能做鉴权头、日志等横切，差异在组合方式：

- **本库**：同一中间件内可「修改 `ctx` → `await next()` → 根据 `{ data, error }` 分支或再次 `next()`」。
- **Eden**：请求改动与响应处理拆在两个钩子。
- **tRPC**：Link 订阅结果流，错误多经 observable / 异常传播，而非 HTTP `ctx` + Result。
- **Hono**：客户端侧能力有限，复杂横切需自包 `fetch`。
- **Axios**：拦截器成熟，但无路径类型与内建 Result。

更复杂的多服务、多租户等组合见 [高级用法](/api-client/advanced)。

## 四、SSE

### 对照

<div class="table-scroll">

| 库 | 流式入口 | 与普通请求的关系 |
|----|----------|------------------|
| **本库** | `.post(body).sse({ onMessage })` | 同一链式调用；走同一中间件链 |
| **Eden** | 端点上的 `subscribe` 等 | 与普通 `.get` / `.post` 分开 |
| **tRPC** | `subscription` + 对应 link | 与 `query` / `mutation` 另一套模型 |
| **Hono `hc`** | 视路由与用法 | 能力不一，常需自行处理流 |
| **OpenAPI / Axios** | 通常无一等 SSE | 需自建 EventSource / fetch 流 |

</div>

### 说明

```typescript
api.chat.stream.post({ prompt: 'hi' }).sse({
  onMessage: (chunk) => { /* 逐块处理 */ },
  onError: (e) => console.error(e.message),
})
```

`RequestBuilder` 在 `await` 时发 JSON，在 `.sse()` 时改走流式；路径、方法、body 与鉴权中间件与普通请求一致，不必为流式再配一套客户端。

## 五、类型来源与后端耦合

### 对照

<div class="table-scroll">

| 库 | 类型从哪来 | 与后端的关系 |
|----|------------|--------------|
| **本库** | 手写契约，或 `vafast sync` / CLI 生成 | 弱耦合：HTTP + 契约，不强制运行时 |
| **Eden** | 从 Elysia `App` 同构推断 | 强绑 Elysia，零生成体验最好 |
| **tRPC** | 从 `AppRouter` 同构推断 | 强绑 tRPC（或兼容层） |
| **Hono `hc`** | 从 `AppType` 同构推断 | 强绑 Hono |
| **OpenAPI** | 由 OpenAPI 文档生成 | 不绑运行时；多语言友好，流水线较重 |
| **Axios** | 无端到端类型（除非另接） | 不绑运行时；路径与响应靠约定 |

</div>

### 说明

<div class="table-scroll">

| 路线 | 优点 | 代价 |
|------|------|------|
| 同构推断（tRPC / Eden / Hono） | 同仓改接口即可传到客户端 | 换运行时成本高 |
| 契约 / CLI（本库） | 前后端可分仓，保留 HTTP 语义 | 需维护同步步骤 |
| OpenAPI 生成 | 网关、多语言一致 | 生成与文档维护成本高 |
| 无类型（Axios） | 上手快 | 易出现路径 / 字段漂移 |

</div>

本库介于同构 RPC 与通用 HTTP 客户端之间：调用体验接近 Eden，部署上不强制 Elysia、tRPC 或 Hono。

## 选型建议

<div class="table-scroll">

| 场景 | 建议 |
|------|------|
| 后端为 tRPC，前后端同仓 | tRPC |
| 后端为 Elysia，希望零生成同构 | Eden |
| 后端为 Hono，以类型对齐为主 | Hono `hc` |
| 多语言客户端，或已有 OpenAPI | OpenAPI 生成客户端 |
| 仅需 HTTP，不依赖端到端类型 | Axios / ky / ofetch |
| 后端为 Vafast，或需要洋葱中间件、Result 与统一 SSE | **本库** |
| 多服务、多租户、较重横切逻辑 | **本库**（[高级用法](/api-client/advanced)） |

</div>

已绑定某一同构 RPC 栈时，优先用该栈官方客户端；需要可拆仓的 HTTP 契约，以及统一的链式调用、中间件与 SSE 时，可选用本库。

## 相关

- [概述](/api-client/overview)
- [基础用法](/api-client/fetch)
- [高级用法](/api-client/advanced)
- [CLI](/tools/cli)
