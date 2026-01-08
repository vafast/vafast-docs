---
title: 安装指南 - Vafast API 客户端
---

# 安装指南

Vafast API 客户端提供了多种安装方式，您可以根据项目需求选择最适合的方法。

## 包管理器安装

### 使用 Bun（推荐）

```bash
npm install @vafast/api-client
```

### 使用 npm

```bash
npm install @vafast/api-client
```

### 使用 yarn

```bash
yarn add @vafast/api-client
```

### 使用 pnpm

```bash
pnpm add @vafast/api-client
```

## 开发依赖安装

如果您需要在开发环境中使用类型定义或测试工具：

```bash
# Bun
npm install -d @vafast/api-client

# npm
npm install -D @vafast/api-client

# yarn
yarn add -D @vafast/api-client

# pnpm
pnpm add -D @vafast/api-client
```

## 系统要求

### Node.js 版本
- **Node.js**: 18.0.0 或更高版本
- **Bun**: 1.0.0 或更高版本（推荐）

### TypeScript 支持
- **TypeScript**: 5.0.0 或更高版本
- **ES2020** 或更高版本支持

### 浏览器支持
- **现代浏览器**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **不支持**: Internet Explorer

## 快速开始

### 1. 创建项目

```bash
# 使用 Bun 创建新项目
bun create vafast my-api-client
cd my-api-client

# 或使用 npm
npm create vafast@latest my-api-client
cd my-api-client
```

### 2. 安装依赖

```bash
npm install @vafast/api-client
```

### 3. 创建客户端

```typescript
// src/client.ts
import { VafastApiClient } from '@vafast/api-client'

const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3
})

export default client
```

### 4. 使用客户端

```typescript
// src/index.ts
import client from './client'

async function main() {
  try {
    // 发送 GET 请求
    const response = await client.get('/users')
    
    if (response.error) {
      console.error('Error:', response.error)
    } else {
      console.log('Users:', response.data)
    }
  } catch (error) {
    console.error('Request failed:', error)
  }
}

main()
```

### 5. 运行项目

```bash
npm run src/index.ts
```

## 配置选项

### 基础配置

```typescript
import { VafastApiClient } from '@vafast/api-client'

const client = new VafastApiClient({
  // 基础 URL
  baseURL: 'https://api.example.com',
  
  // 默认请求头
  defaultHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'Vafast-API-Client/1.0.0'
  },
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 重试次数
  retries: 3,
  
  // 重试延迟（毫秒）
  retryDelay: 1000,
  
  // 是否启用缓存
  enableCache: true,
  
  // 缓存过期时间（毫秒）
  cacheExpiry: 300000, // 5分钟
})
```

### 高级配置

```typescript
import { VafastApiClient } from '@vafast/api-client'

const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  
  // 请求拦截器
  requestInterceptors: [
    async (config) => {
      // 添加认证头
      if (localStorage.getItem('token')) {
        config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
      }
      return config
    }
  ],
  
  // 响应拦截器
  responseInterceptors: [
    async (response) => {
      // 处理响应数据
      if (response.status === 401) {
        // 处理未授权错误
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return response
    }
  ],
  
  // 错误处理器
  errorHandler: (error) => {
    console.error('API Error:', error)
    // 可以在这里添加全局错误处理逻辑
  },
  
  // 日志配置
  logging: {
    enabled: true,
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    format: 'json' // 'json' | 'text'
  }
})
```

## 环境变量配置

### 创建环境配置文件

```bash
# .env
API_BASE_URL=https://api.example.com
API_TIMEOUT=10000
API_RETRIES=3
API_ENABLE_CACHE=true
API_CACHE_EXPIRY=300000

# .env.development
API_BASE_URL=http://localhost:3000
API_TIMEOUT=5000
API_RETRIES=1

# .env.production
API_BASE_URL=https://api.production.com
API_TIMEOUT=15000
API_RETRIES=5
```

### 使用环境变量

```typescript
import { VafastApiClient } from '@vafast/api-client'

const client = new VafastApiClient({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.API_TIMEOUT || '10000'),
  retries: parseInt(process.env.API_RETRIES || '3'),
  enableCache: process.env.API_ENABLE_CACHE === 'true',
  cacheExpiry: parseInt(process.env.API_CACHE_EXPIRY || '300000')
})
```

## 浏览器环境

### 使用 CDN

```html
<!DOCTYPE html>
<html>
<head>
  <title>Vafast API Client Demo</title>
</head>
<body>
  <div id="app">
    <h1>Vafast API Client</h1>
    <button onclick="fetchUsers()">获取用户</button>
    <div id="result"></div>
  </div>

  <script type="module">
    import { VafastApiClient } from 'https://unpkg.com/@vafast/api-client@latest/dist/index.js'
    
    const client = new VafastApiClient({
      baseURL: 'https://api.example.com'
    })
    
    async function fetchUsers() {
      try {
        const response = await client.get('/users')
        const resultDiv = document.getElementById('result')
        
        if (response.error) {
          resultDiv.innerHTML = `<p style="color: red;">错误: ${response.error.message}</p>`
        } else {
          resultDiv.innerHTML = `<pre>${JSON.stringify(response.data, null, 2)}</pre>`
        }
      } catch (error) {
        console.error('请求失败:', error)
      }
    }
    
    window.fetchUsers = fetchUsers
  </script>
</body>
</html>
```

## 🧪 测试环境配置

### 安装测试依赖

```bash
# Bun
npm install -d bun @types/node

# npm
npm install -D jest @types/jest ts-jest

# yarn
yarn add -D jest @types/jest ts-jest

# pnpm
pnpm add -D jest @types/jest ts-jest
```

### 测试配置

```typescript
// test/client.test.ts
import { describe, expect, it, beforeEach } from 'bun:test'
import { VafastApiClient } from '@vafast/api-client'

describe('VafastApiClient', () => {
  let client: VafastApiClient
  
  beforeEach(() => {
    client = new VafastApiClient({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 5000
    })
  })
  
  it('should fetch users successfully', async () => {
    const response = await client.get('/users')
    
    expect(response.error).toBeUndefined()
    expect(response.data).toBeDefined()
    expect(Array.isArray(response.data)).toBe(true)
  })
  
  it('should handle errors gracefully', async () => {
    const response = await client.get('/nonexistent')
    
    expect(response.error).toBeDefined()
    expect(response.data).toBeUndefined()
  })
})
```

### 运行测试

```bash
# Bun
npm test

# npm
npm test

# yarn
yarn test

# pnpm
pnpm test
```

## 🔍 故障排除

### 常见问题

#### 1. 类型错误
```bash
# 确保安装了正确的类型定义
npm install -d @types/node

# 检查 TypeScript 配置
npx tsc --noEmit
```

#### 2. 网络错误
```typescript
// 检查网络连接
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  timeout: 5000, // 减少超时时间
  retries: 1     // 减少重试次数
})
```

#### 3. CORS 问题
```typescript
// 在服务器端配置 CORS
// 或使用代理服务器
const client = new VafastApiClient({
  baseURL: '/api', // 使用相对路径
  proxy: 'http://localhost:3001' // 配置代理
})
```

### 调试模式

```typescript
const client = new VafastApiClient({
  baseURL: 'https://api.example.com',
  logging: {
    enabled: true,
    level: 'debug'
  }
})

// 启用详细日志
client.setLogLevel('debug')
```

## 下一步

安装完成后，您可以：

1. **阅读基础用法** - 学习如何发送 HTTP 请求
2. **探索类型安全** - 了解如何创建类型安全的客户端
3. **学习 WebSocket** - 掌握实时通信功能
4. **配置中间件** - 自定义请求和响应处理
5. **运行测试** - 确保代码质量

如果您在安装过程中遇到任何问题，请查看我们的 [GitHub Issues](https://github.com/vafast/vafast/issues) 或 [社区页面](/community)。
