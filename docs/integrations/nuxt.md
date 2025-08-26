---
title: Nuxt 集成 - Vafast
---

# Nuxt 集成

Vafast 可以与 Nuxt 无缝集成，为您提供强大的后端 API 和现代化的前端开发体验。

## 项目结构

```
my-vafast-nuxt-app/
├── server/                  # Nuxt 服务器路由
│   └── api/                 # Vafast API 路由
│       ├── routes.ts        # 路由定义
│       ├── server.ts        # Vafast 服务器
│       └── types.ts         # 类型定义
├── components/              # Vue 组件
├── pages/                   # 页面组件
├── composables/             # 组合式函数
├── package.json
├── nuxt.config.ts
└── tsconfig.json
```

## 安装依赖

```bash
bun add vafast @vafast/cors @vafast/helmet
bun add -D @types/node
```

## 创建 Vafast API 服务器

```typescript
// server/api/server.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'
import { routes } from './routes'

export const app = createRouteHandler(routes)
  .use(cors({
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3000'] 
      : [process.env.NUXT_PUBLIC_APP_URL],
    credentials: true
  }))
  .use(helmet())

export const handler = app.handler
```

## 定义 API 路由

```typescript
// server/api/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { Type } from '@sinclair/typebox'

export const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/products',
    handler: createRouteHandler(async () => {
      // 模拟数据库查询
      const products = [
        { id: 1, name: 'Product 1', price: 99.99, description: 'Amazing product' },
        { id: 2, name: 'Product 2', price: 149.99, description: 'Another great product' }
      ]
      
      return { products }
    })
  },
  
  {
    method: 'POST',
    path: '/api/products',
    handler: createRouteHandler(async ({ body }) => {
      // 创建新产品
      const newProduct = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
      
      return { product: newProduct }, { status: 201 }
    }),
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      price: Type.Number({ minimum: 0 }),
      description: Type.Optional(Type.String())
    })
  },
  
  {
    method: 'GET',
    path: '/api/products/:id',
    handler: createRouteHandler(async ({ params }) => {
      const productId = parseInt(params.id)
      
      // 模拟数据库查询
      const product = { 
        id: productId, 
        name: 'Sample Product', 
        price: 99.99, 
        description: 'Sample description' 
      }
      
      if (!product) {
        return { error: 'Product not found' }, { status: 404 }
      }
      
      return { product }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    })
  },
  
  {
    method: 'PUT',
    path: '/api/products/:id',
    handler: createRouteHandler(async ({ params, body }) => {
      const productId = parseInt(params.id)
      
      // 模拟数据库更新
      const updatedProduct = {
        id: productId,
        ...body,
        updatedAt: new Date().toISOString()
      }
      
      return { product: updatedProduct }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    }),
    body: Type.Object({
      name: Type.Optional(Type.String({ minLength: 1 })),
      price: Type.Optional(Type.Number({ minimum: 0 })),
      description: Type.Optional(Type.String())
    })
  },
  
  {
    method: 'DELETE',
    path: '/api/products/:id',
    handler: createRouteHandler(async ({ params }) => {
      const productId = parseInt(params.id)
      
      // 模拟数据库删除
      console.log(`Deleting product ${productId}`)
      
      return { success: true }
    }),
    params: Type.Object({
      id: Type.String({ pattern: '^\\d+$' })
    })
  }
])
```

## 创建 Nuxt 服务器路由

```typescript
// server/api/[...path].ts
import { handler } from './server'

export default defineEventHandler(async (event) => {
  const request = event.node.req
  const response = await handler(request)
  
  // 设置响应状态和头
  setResponseStatus(event, response.status)
  
  // 复制响应头
  for (const [key, value] of response.headers.entries()) {
    setResponseHeader(event, key, value)
  }
  
  // 返回响应体
  return response.json()
})
```

## 类型定义

```typescript
// server/api/types.ts
import { Type } from '@sinclair/typebox'

export const ProductSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  price: Type.Number({ minimum: 0 }),
  description: Type.Optional(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
})

export const CreateProductSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  price: Type.Number({ minimum: 0 }),
  description: Type.Optional(Type.String())
})

export const UpdateProductSchema = Type.Partial(CreateProductSchema)

export type Product = typeof ProductSchema.T
export type CreateProduct = typeof CreateProductSchema.T
export type UpdateProduct = typeof UpdateProductSchema.T
```

## 前端集成

### 使用 API 路由

```vue
<!-- pages/products/index.vue -->
<template>
  <div class="container">
    <h1>产品列表</h1>
    
    <!-- 创建新产品 -->
    <div class="create-form">
      <input 
        v-model="newProduct.name"
        type="text" 
        placeholder="输入产品名称"
        @keydown.enter="createProduct"
      />
      <input 
        v-model.number="newProduct.price"
        type="number" 
        placeholder="输入价格"
        step="0.01"
        min="0"
      />
      <textarea 
        v-model="newProduct.description"
        placeholder="输入产品描述（可选）"
        rows="3"
      ></textarea>
      <button @click="createProduct" :disabled="!newProduct.name || !newProduct.price">
        创建产品
      </button>
    </div>
    
    <!-- 错误显示 -->
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    
    <!-- 产品列表 -->
    <div v-else class="products">
      <div 
        v-for="product in products" 
        :key="product.id"
        class="product-card"
      >
        <h3>{{ product.name }}</h3>
        <p class="price">¥{{ product.price }}</p>
        <p v-if="product.description" class="description">
          {{ product.description }}
        </p>
        <div class="actions">
          <button @click="editProduct(product)" class="edit-btn">
            编辑
          </button>
          <button @click="deleteProduct(product.id)" class="delete-btn">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, CreateProduct } from '~/server/api/types'

// 响应式数据
const products = ref<Product[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const newProduct = ref<CreateProduct>({
  name: '',
  price: 0,
  description: ''
})

// 获取产品列表
async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const response = await $fetch('/api/products')
    products.value = response.products
  } catch (err: any) {
    error.value = err.message || '获取产品失败'
  } finally {
    loading.value = false
  }
}

// 创建产品
async function createProduct() {
  if (!newProduct.value.name || !newProduct.value.price) return
  
  try {
    const response = await $fetch('/api/products', {
      method: 'POST',
      body: newProduct.value
    })
    
    products.value.push(response.product)
    
    // 重置表单
    newProduct.value = {
      name: '',
      price: 0,
      description: ''
    }
  } catch (err) {
    console.error('创建产品失败:', err)
  }
}

// 编辑产品
function editProduct(product: Product) {
  navigateTo(`/products/${product.id}/edit`)
}

// 删除产品
async function deleteProduct(id: number) {
  if (!confirm('确定要删除这个产品吗？')) return
  
  try {
    await $fetch(`/api/products/${id}`, {
      method: 'DELETE'
    })
    
    products.value = products.value.filter(p => p.id !== id)
  } catch (err) {
    console.error('删除产品失败:', err)
  }
}

// 页面加载时获取产品列表
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.create-form {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: grid;
  gap: 1rem;
}

.create-form input,
.create-form textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.create-form button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.create-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-card h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #007bff;
  margin: 0.5rem 0;
}

.description {
  color: #666;
  margin: 0.5rem 0;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.edit-btn {
  background: #28a745;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}
</style>
```

### 产品详情页面

```vue
<!-- pages/products/[id].vue -->
<template>
  <div class="container">
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="fetchProduct" class="retry-btn">重试</button>
    </div>
    
    <div v-else-if="product" class="product-detail">
      <h1>{{ product.name }}</h1>
      <div class="product-info">
        <p class="price">¥{{ product.price }}</p>
        <p v-if="product.description" class="description">
          {{ product.description }}
        </p>
        <p class="created-at">
          创建时间: {{ new Date(product.createdAt).toLocaleDateString() }}
        </p>
      </div>
      
      <div class="actions">
        <button @click="editProduct" class="edit-btn">编辑产品</button>
        <button @click="deleteProduct" class="delete-btn">删除产品</button>
        <button @click="goBack" class="back-btn">返回列表</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/server/api/types'

const route = useRoute()
const router = useRouter()

const product = ref<Product | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// 获取产品详情
async function fetchProduct() {
  try {
    loading.value = true
    error.value = null
    const response = await $fetch(`/api/products/${route.params.id}`)
    product.value = response.product
  } catch (err: any) {
    error.value = err.message || '获取产品失败'
  } finally {
    loading.value = false
  }
}

// 编辑产品
function editProduct() {
  navigateTo(`/products/${route.params.id}/edit`)
}

// 删除产品
async function deleteProduct() {
  if (!confirm('确定要删除这个产品吗？')) return
  
  try {
    await $fetch(`/api/products/${route.params.id}`, {
      method: 'DELETE'
    })
    
    // 删除成功后返回列表页面
    navigateTo('/products')
  } catch (err) {
    console.error('删除产品失败:', err)
  }
}

// 返回列表
function goBack() {
  navigateTo('/products')
}

// 页面加载时获取产品详情
onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.product-detail {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.product-detail h1 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.product-info {
  margin-bottom: 2rem;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin: 1rem 0;
}

.description {
  color: #666;
  line-height: 1.6;
  margin: 1rem 0;
}

.created-at {
  color: #999;
  font-size: 0.9rem;
  margin: 1rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.edit-btn,
.delete-btn,
.back-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.edit-btn {
  background: #28a745;
  color: white;
}

.edit-btn:hover {
  background: #218838;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.back-btn:hover {
  background: #545b62;
}
</style>
```

## 组合式函数

```typescript
// composables/useProducts.ts
import type { Product, CreateProduct, UpdateProduct } from '~/server/api/types'

export const useProducts = () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取产品列表
  const fetchProducts = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch('/api/products')
      products.value = response.products
    } catch (err: any) {
      error.value = err.message || '获取产品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取单个产品
  const fetchProduct = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch(`/api/products/${id}`)
      return response.product
    } catch (err: any) {
      error.value = err.message || '获取产品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建产品
  const createProduct = async (productData: CreateProduct) => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch('/api/products', {
        method: 'POST',
        body: productData
      })
      
      products.value.push(response.product)
      return response.product
    } catch (err: any) {
      error.value = err.message || '创建产品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新产品
  const updateProduct = async (id: number, productData: UpdateProduct) => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch(`/api/products/${id}`, {
        method: 'PUT',
        body: productData
      })
      
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = response.product
      }
      
      return response.product
    } catch (err: any) {
      error.value = err.message || '更新产品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除产品
  const deleteProduct = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      await $fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      
      products.value = products.value.filter(p => p.id !== id)
    } catch (err: any) {
      error.value = err.message || '删除产品失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    products: readonly(products),
    loading: readonly(loading),
    error: readonly(error),
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct
  }
}
```

## 中间件集成

### 认证中间件

```typescript
// server/api/middleware/auth.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authMiddleware = async (
  request: Request,
  next: () => Promise<Response>
) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    // 验证 JWT token
    const user = await verifyToken(token)
    ;(request as AuthenticatedRequest).user = user
    return next()
  } catch (error) {
    return new Response('Invalid token', { status: 401 })
  }
}

async function verifyToken(token: string) {
  // 实现 JWT 验证逻辑
  // 这里应该使用 @vafast/jwt 中间件
  return { id: '123', email: 'user@example.com', role: 'user' }
}
```

### 使用认证中间件

```typescript
// server/api/routes.ts
import { defineRoutes, createRouteHandler } from 'vafast'
import { authMiddleware } from './middleware/auth'

export const routes = defineRoutes([
  {
    method: 'GET',
    path: '/api/profile',
    handler: createRouteHandler(async ({ request }) => {
      const user = (request as AuthenticatedRequest).user
      return { user }
    }),
    middleware: [authMiddleware]
  }
])
```

## Nuxt 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 启用 SSR
  ssr: true,
  
  // 开发工具
  devtools: { enabled: true },
  
  // 模块
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  // 运行时配置
  runtimeConfig: {
    // 私有配置（仅在服务器端可用）
    apiSecret: process.env.API_SECRET,
    
    // 公共配置（客户端和服务器端都可用）
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },
  
  // Nitro 配置
  nitro: {
    // 服务器端配置
    experimental: {
      wasm: true
    }
  }
})
```

## 环境配置

```typescript
// server/api/config.ts
export const config = {
  development: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001']
    },
    logging: true
  },
  
  production: {
    cors: {
      origin: [process.env.NUXT_PUBLIC_APP_URL]
    },
    logging: false
  }
}

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  return config[env as keyof typeof config]
}
```

## 测试

### API 测试

```typescript
// server/api/__tests__/products.test.ts
import { describe, expect, it } from 'bun:test'
import { handler } from '../server'

describe('Products API', () => {
  it('should get products', async () => {
    const request = new Request('http://localhost/api/products')
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.products).toBeDefined()
    expect(Array.isArray(data.products)).toBe(true)
  })
  
  it('should create product', async () => {
    const productData = {
      name: 'Test Product',
      price: 99.99,
      description: 'Test description'
    }
    
    const request = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    })
    
    const response = await handler(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.product.name).toBe(productData.name)
    expect(data.product.price).toBe(productData.price)
  })
})
```

## 部署

### 静态部署

```bash
# 构建应用
nuxt build

# 生成静态文件
nuxt generate

# 部署到静态托管服务
```

### 服务器部署

```bash
# 构建应用
nuxt build

# 启动生产服务器
node .output/server/index.mjs
```

### Docker 部署

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]
```

## 最佳实践

1. **类型安全**：使用 TypeScript 确保前后端类型一致
2. **错误处理**：实现统一的错误处理机制
3. **中间件顺序**：注意中间件的执行顺序
4. **环境配置**：根据环境配置不同的设置
5. **测试覆盖**：为 API 路由编写完整的测试
6. **性能优化**：使用适当的缓存和压缩策略
7. **SSR 优化**：利用 Nuxt 的 SSR 能力优化性能
8. **组合式函数**：将 API 逻辑封装到可复用的组合式函数中

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [Nuxt 文档](https://nuxt.com/docs) - Nuxt 官方文档
- [中间件系统](/middleware) - 探索可用的中间件
- [类型验证](/patterns/type) - 了解类型验证系统
- [部署指南](/patterns/deploy) - 生产环境部署建议
