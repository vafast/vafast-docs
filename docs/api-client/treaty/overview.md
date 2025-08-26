---
title: 类型安全客户端概述 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: 类型安全客户端概述 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 类型安全客户端提供了完整的端到端类型安全，让您能够以类型安全的方式与 Vafast 服务器进行交互。

  - - meta
    - property: 'og:description'
      content: Vafast 类型安全客户端提供了完整的端到端类型安全，让您能够以类型安全的方式与 Vafast 服务器进行交互。
---

# 类型安全客户端概述

Vafast 类型安全客户端是一个强大的工具，它提供了完整的端到端类型安全，让您能够以类型安全的方式与 Vafast 服务器进行交互。通过利用 TypeScript 的类型系统，您可以在编译时捕获类型错误，提高开发效率和代码质量。

## ✨ 核心特性

### 🔒 端到端类型安全
- 服务器和客户端之间的完全类型同步
- 编译时类型检查，避免运行时错误
- 自动类型推断和智能提示

### 🎯 零代码生成
- 无需额外的代码生成步骤
- 直接使用 TypeScript 类型系统
- 实时类型同步

### 🚀 高性能
- 轻量级实现，体积小
- 快速的类型推断
- 优化的运行时性能

### 🧩 易于集成
- 与现有 Vafast 项目无缝集成
- 支持所有 Vafast 功能
- 灵活的配置选项

## 🏗️ 架构设计

Vafast 类型安全客户端采用智能的类型推断机制，通过分析 Vafast 服务器的类型定义，自动生成对应的客户端类型。这种设计确保了：

```
Vafast 服务器类型定义
         ↓
   类型安全客户端
         ↓
   类型化的 API 调用
         ↓
   编译时类型检查
```

### 类型推断流程

1. **服务器类型导出** - 从 Vafast 服务器导出类型定义
2. **客户端类型生成** - 自动推断客户端可用的类型
3. **API 调用验证** - 在编译时验证 API 调用的正确性
4. **运行时类型安全** - 确保运行时数据的类型一致性

## 🔧 核心概念

### 类型安全
类型安全是指在编译时能够检测到类型错误，避免在运行时出现类型不匹配的问题。Vafast 类型安全客户端通过以下方式实现类型安全：

- **请求参数类型检查** - 验证请求参数的类型和结构
- **响应数据类型推断** - 自动推断响应的数据类型
- **路径参数类型验证** - 确保路径参数的类型正确性
- **查询参数类型检查** - 验证查询参数的类型

### 端到端类型同步
端到端类型同步意味着服务器端的类型定义会自动同步到客户端，当服务器端的类型发生变化时，客户端会立即获得相应的类型更新。这确保了：

- **类型一致性** - 服务器和客户端的类型始终保持一致
- **自动更新** - 无需手动同步类型定义
- **错误预防** - 在编译时捕获类型不匹配的问题

### 零代码生成
零代码生成意味着您不需要运行额外的工具来生成类型定义，所有的类型推断都在 TypeScript 编译时完成。这带来了：

- **开发效率** - 无需等待代码生成
- **类型准确性** - 类型定义始终是最新的
- **维护简单** - 减少了额外的构建步骤

## 📱 使用场景

### 前端应用
- **React 应用** - 类型安全的 API 调用
- **Vue 应用** - 完整的类型支持
- **Angular 应用** - 强类型的数据绑定
- **Svelte 应用** - 类型安全的组件通信

### 后端服务
- **微服务通信** - 类型安全的服务间调用
- **API 网关** - 统一的类型定义
- **数据同步** - 类型一致的数据传输

### 移动应用
- **React Native** - 跨平台的类型安全
- **Flutter** - 通过 FFI 实现类型安全
- **原生应用** - 类型安全的网络层

### 桌面应用
- **Electron** - 类型安全的 IPC 通信
- **Tauri** - 类型安全的后端调用
- **原生应用** - 类型安全的网络请求

## 🚀 快速开始

### 1. 导出服务器类型

```typescript
// server.ts
import { Server, defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: createRouteHandler(({ params }) => `User ${params.id}`),
    params: Type.Object({
      id: Type.String()
    })
  },
  {
    method: 'POST',
    path: '/users',
    handler: createRouteHandler(({ body }) => `Created user: ${body.name}`),
    body: Type.Object({
      name: Type.String(),
      email: Type.String()
    })
  }
])

const server = new Server(routes)

// 导出服务器类型
export type App = typeof server
export default { fetch: server.fetch }
```

### 2. 创建类型安全客户端

```typescript
// client.ts
import { createTypedClient } from '@vafast/api-client'
import type { App } from './server'

// 创建类型安全客户端
const client = createTypedClient<App>('http://localhost:3000')

export default client
```

### 3. 使用类型安全客户端

```typescript
// index.ts
import client from './client'

async function main() {
  try {
    // 类型安全的 GET 请求
    const homeResponse = await client.get('/')
    console.log('Home:', homeResponse.data) // 类型: string
    
    // 类型安全的路径参数
    const userResponse = await client.get('/users/:id', { id: '123' })
    console.log('User:', userResponse.data) // 类型: string
    
    // 类型安全的 POST 请求
    const createResponse = await client.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    console.log('Created:', createResponse.data) // 类型: string
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
```

## 🔍 类型推断示例

### 自动类型推断

```typescript
// 服务器端类型定义
interface User {
  id: string
  name: string
  email: string
  profile: {
    age: number
    location: string
  }
}

// 客户端自动获得类型推断
const user = await client.get('/users/:id', { id: '123' })
// user.data 的类型自动推断为 User

// 完整的类型支持
console.log(user.data.name) // ✅ 类型安全
console.log(user.data.profile.age) // ✅ 类型安全
console.log(user.data.invalid) // ❌ 编译时错误
```

### 参数类型验证

```typescript
// 服务器端验证器
const userValidator = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  age: Type.Number({ minimum: 0, maximum: 150 })
})

// 客户端自动获得类型信息
const response = await client.post('/users', {
  name: 'John', // ✅ 类型正确
  email: 'john@example.com', // ✅ 类型正确
  age: 30 // ✅ 类型正确
})

// 类型错误会在编译时被捕获
const invalidResponse = await client.post('/users', {
  name: 123, // ❌ 编译时错误：应该是 string
  email: 'invalid-email', // ❌ 编译时错误：格式不正确
  age: 'thirty' // ❌ 编译时错误：应该是 number
})
```

## 🎛️ 高级功能

### 中间件类型支持

```typescript
// 服务器端中间件
const authMiddleware = createMiddleware(async (request, next) => {
  const token = request.headers.get('Authorization')
  if (!token) {
    throw new Error('Unauthorized')
  }
  return await next(request)
})

// 客户端自动获得中间件类型
const response = await client.get('/protected', {}, {
  headers: {
    'Authorization': 'Bearer token123' // ✅ 类型安全
  }
})
```

### 错误类型推断

```typescript
// 服务器端错误类型
interface ApiError {
  code: string
  message: string
  details?: any
}

// 客户端自动获得错误类型
const response = await client.get('/users/:id', { id: 'invalid' })

if (response.error) {
  // response.error 的类型自动推断为 ApiError
  console.log(response.error.code) // ✅ 类型安全
  console.log(response.error.message) // ✅ 类型安全
  console.log(response.error.details) // ✅ 类型安全
}
```

### 响应类型推断

```typescript
// 服务器端响应类型
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// 客户端自动获得响应类型
const response = await client.get('/users', { page: 1, limit: 10 })

// response.data 的类型自动推断为 PaginatedResponse<User>
console.log(response.data.total) // ✅ 类型安全
console.log(response.data.data[0].name) // ✅ 类型安全
```

## 🔗 与其他工具集成

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  parserOptions: {
    project: './tsconfig.json'
  }
}
```

### VSCode 配置

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 📚 最佳实践

### 1. 类型定义组织
- 将类型定义放在单独的文件中
- 使用命名空间组织相关类型
- 导出所有必要的类型

### 2. 验证器设计
- 使用 TypeBox 创建严格的验证器
- 为所有输入参数定义验证规则
- 提供清晰的错误消息

### 3. 错误处理
- 定义统一的错误类型
- 在客户端处理所有可能的错误
- 提供用户友好的错误消息

### 4. 性能优化
- 避免不必要的类型检查
- 使用类型缓存减少重复计算
- 优化大型类型定义的性能

## 🔍 故障排除

### 常见问题

#### 1. 类型推断失败
```typescript
// 确保服务器类型正确导出
export type App = typeof server

// 确保客户端正确导入类型
import type { App } from './server'
```

#### 2. 类型不匹配
```typescript
// 检查服务器和客户端的类型定义
// 确保它们使用相同的类型库版本
```

#### 3. 编译性能问题
```typescript
// 使用类型缓存
// 避免过大的类型定义
// 使用类型别名简化复杂类型
```

## 📚 下一步

现在您已经了解了 Vafast 类型安全客户端的基本概念，接下来可以：

1. **学习具体用法** - 了解如何创建和使用类型安全客户端
2. **探索高级特性** - 学习中间件、错误处理等高级功能
3. **集成到项目** - 将类型安全客户端集成到您的项目中
4. **性能优化** - 学习如何优化类型推断的性能
5. **最佳实践** - 了解更多的使用技巧和最佳实践

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。
