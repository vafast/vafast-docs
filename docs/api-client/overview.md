---
title: API 客户端概述 - Vafast
---

# API 客户端概述

Vafast API 客户端是一个专门为 Vafast 框架打造的现代化、类型安全的 API 客户端中间件。它提供了完整的 HTTP 和 WebSocket 支持，让您能够轻松地与各种 API 服务进行交互。

## 核心特性

### 专为 Vafast 设计
- 完全兼容 Vafast 框架架构
- 与 Vafast 的类型系统无缝集成
- 支持 Vafast 的中间件和验证系统

### 类型安全
- 完整的 TypeScript 类型支持
- 自动类型推断和检查
- 编译时错误检测

### 智能路由
- 自动推断路由类型和方法
- 支持动态路径参数
- 智能的查询参数处理

### 🔄 自动重试
- 内置指数退避重试机制
- 可配置的重试策略
- 智能的错误处理

### 📡 WebSocket 支持
- 完整的 WebSocket 客户端
- 自动重连机制
- 事件驱动的消息处理

### 🧩 中间件系统
- 灵活的请求/响应处理
- 可组合的中间件链
- 支持异步中间件

### 拦截器
- 强大的请求/响应拦截能力
- 支持请求和响应转换
- 错误处理和日志记录

## 架构设计

Vafast API 客户端采用模块化设计，主要包含以下核心组件：

```
VafastApiClient
├── HTTP 客户端
│   ├── 请求处理器
│   ├── 响应处理器
│   ├── 错误处理器
│   └── 重试机制
├── WebSocket 客户端
│   ├── 连接管理
│   ├── 消息处理
│   └── 重连机制
├── 中间件系统
│   ├── 请求中间件
│   ├── 响应中间件
│   └── 错误中间件
└── 类型系统
    ├── 类型推断
    ├── 验证器
    └── 类型检查
```

## 核心概念

### 客户端实例
每个 `VafastApiClient` 实例代表一个独立的 API 客户端，可以配置不同的基础 URL、超时时间、重试策略等。

### 中间件
中间件是处理请求和响应的函数，可以用于添加认证头、记录日志、处理错误等。中间件按照添加顺序依次执行。

### 拦截器
拦截器允许您在请求发送前和响应接收后执行自定义逻辑，比如添加认证信息、转换数据格式等。

### 类型安全
通过 TypeScript 和 Vafast 的类型系统，API 客户端提供完整的类型检查，确保请求和响应的类型安全。

## 📱 使用场景

### 前端应用
- 与后端 API 交互
- 处理用户认证
- 管理应用状态

### 后端服务
- 微服务间通信
- 第三方 API 集成
- 数据同步

### 移动应用
- 与服务器通信
- 实时数据更新
- 离线数据同步

### 桌面应用
- 本地服务调用
- 远程 API 访问
- 数据备份和同步

## 快速开始

### 安装

```bash
npm install @vafast/api-client
```

### 基础用法

```typescript
import { VafastApiClient } from '@vafast/api-client'

// 创建客户端
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3
})

// 发送请求
const response = await client.get('/users', { page: 1, limit: 10 })
if (response.error) {
  console.error('Error:', response.error)
} else {
  console.log('Users:', response.data)
}
```

### 类型安全客户端

```typescript
import { createTypedClient } from '@vafast/api-client'
import type { Server } from 'vafast'

// 从 Vafast 服务器创建类型安全客户端
const typedClient = createTypedClient<Server>(server, {
  baseURL: 'https://api.example.com'
})

// 现在有完整的类型检查
const users = await typedClient.get('/users', { page: 1, limit: 10 })
const user = await typedClient.post('/users', { name: 'John', email: 'john@example.com' })
```

## 相关链接

- [安装指南](/api-client/installation) - 了解如何安装和配置
- [基础用法](/api-client/fetch) - 学习基本的 HTTP 请求
- [测试指南](/api-client/test) - 学习如何测试

## 📚 下一步

现在您已经了解了 Vafast API 客户端的基本概念和特性，接下来可以：

1. **安装和配置** - 按照安装指南设置您的项目
2. **学习基础用法** - 掌握基本的 HTTP 请求方法
3. **探索高级特性** - 了解中间件、拦截器等高级功能
4. **构建类型安全应用** - 利用 TypeScript 和 Vafast 的类型系统

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。
