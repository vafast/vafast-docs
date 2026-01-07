---
title: Webhook 中间件 - Vafast
---

# Webhook 中间件

声明式 Webhook 事件分发中间件，支持自动触发、重试、并发控制。

## 安装

```bash
npm install @vafast/webhook
```

## 特性

- 🎯 **声明式配置** - 在路由定义中直接声明 Webhook
- 🔄 **自动重试** - 支持指数退避重试策略
- ⚡ **并发控制** - 限制同时发送的 Webhook 数量
- 🔐 **签名验证** - HMAC-SHA256 签名确保安全
- 📝 **事件 ID** - 支持幂等性处理

## 快速开始

```typescript
import { Server, defineRoutes, createHandler } from 'vafast'
import { webhook, defineWebhooks } from '@vafast/webhook'

// 定义路由，声明 Webhook
const routes = defineRoutes([
  {
    method: 'POST',
    path: '/users',
    handler: createHandler(({ body }) => {
      return { id: '123', ...body }
    }),
    webhook: {
      eventKey: 'user.created',
      name: '用户创建',
      description: '当新用户注册时触发'
    }
  }
])

// 定义 Webhook 订阅
const webhooks = defineWebhooks([
  {
    eventKey: 'user.created',
    url: 'https://example.com/webhook',
    secret: 'my-secret'
  }
])

const server = new Server(routes)

// 使用 Webhook 中间件
server.use(webhook({
  storage: webhooks
}))

export default { fetch: server.fetch }
```

## 路由配置

在路由中声明 `webhook` 字段即可自动触发：

```typescript
{
  method: 'POST',
  path: '/orders',
  handler: createHandler(...),
  webhook: {
    // 事件键（自动从路径派生，或手动指定）
    eventKey: 'order.created',
    
    // 事件名称
    name: '订单创建',
    
    // 事件描述
    description: '当新订单创建时触发',
    
    // 排除敏感字段
    exclude: ['password', 'token'],
    
    // 仅包含特定字段
    include: ['id', 'email', 'name'],
    
    // 自定义数据转换
    transform: (data) => ({
      ...data,
      timestamp: Date.now()
    }),
    
    // 触发条件
    condition: (data) => data.status === 'success'
  }
}
```

简写形式：

```typescript
{
  method: 'POST',
  path: '/users',
  handler: createHandler(...),
  webhook: true  // 使用默认配置
}
```

## 中间件配置

```typescript
webhook({
  // Webhook 订阅存储
  storage: webhooks,
  
  // 路径前缀（用于自动派生 eventKey）
  pathPrefix: '/api',
  
  // 获取应用 ID（多租户场景）
  getAppId: (req) => req.headers.get('X-App-Id'),
  
  // 判断请求是否成功
  isSuccess: (res) => res.status >= 200 && res.status < 300,
  
  // 获取响应数据
  getData: async (res) => await res.json(),
  
  // 日志器
  logger: console,
  
  // 重试配置
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },
  
  // 并发限制
  concurrency: 10,
  
  // 超时时间（毫秒）
  timeout: 30000
})
```

## Webhook 存储

### 静态定义

```typescript
import { defineWebhooks } from '@vafast/webhook'

const webhooks = defineWebhooks([
  {
    eventKey: 'user.created',
    url: 'https://example.com/webhook',
    secret: 'my-secret'
  },
  {
    eventKey: 'order.*',  // 通配符匹配
    url: 'https://example.com/orders',
    secret: 'order-secret'
  }
])
```

### 数据库存储

```typescript
webhook({
  storage: {
    async find(eventKey, appId) {
      return await db.webhooks.find({
        where: { eventKey, appId, status: 'active' }
      })
    }
  },
  saveLog: async (log) => {
    await db.webhookLogs.create({ data: log })
  }
})
```

## 签名验证

接收方验证示例：

```typescript
import crypto from 'crypto'

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// 在接收端
app.post('/webhook', (req) => {
  const signature = req.headers.get('X-Webhook-Signature')
  const isValid = verifyWebhook(req.body, signature, 'my-secret')
  
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // 处理 Webhook...
})
```

## 获取事件列表

```typescript
import { getAllWebhookEvents, getWebhookCategories } from '@vafast/webhook'

// 获取所有 Webhook 事件
const events = getAllWebhookEvents('/api')
// [{ eventKey: 'user.created', name: '用户创建', ... }]

// 获取事件分类
const categories = getWebhookCategories('/api')
// [{ category: 'user', name: '用户管理' }]
```

## 手动触发

```typescript
import { dispatchWebhook } from '@vafast/webhook'

await dispatchWebhook({
  eventKey: 'custom.event',
  payload: { message: 'Hello' },
  storage: webhooks,
  logger: console
})
```

## 相关链接

- [GitHub](https://github.com/vafast/vafast-webhook)
- [npm](https://www.npmjs.com/package/@vafast/webhook)

