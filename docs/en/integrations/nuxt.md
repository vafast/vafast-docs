---
title: Nuxt Integration - Vafast
description: 'Guide to integrating Vafast with Nuxt: create a Vafast API server and Nuxt server routes, type definitions, frontend integration and composables.'
---

# Nuxt Integration

Vafast integrates seamlessly with Nuxt, giving you a powerful backend API and a modern frontend development experience.

## Project Structure

```
my-vafast-nuxt-app/
├── server/                  # Nuxt server routes
│   └── api/                 # Vafast API routes
│       ├── routes.ts        # route definitions
│       ├── server.ts        # Vafast server
│       └── types.ts         # type definitions
├── components/              # Vue components
├── pages/                   # page components
├── composables/             # composables
├── package.json
├── nuxt.config.ts
└── tsconfig.json
```

## Installing Dependencies

```bash
# npm
npm install vafast @vafast/cors @vafast/helmet
npm install -D @types/node

# or with bun
npm install vafast @vafast/cors @vafast/helmet
npm install -D @types/node
```

## Creating the Vafast API Server

```typescript
// server/api/server.ts
import { Server, defineRoute, defineRoutes } from 'vafast'
import { cors } from '@vafast/cors'
import { helmet } from '@vafast/helmet'
import { routes } from './routes'

const server = new Server(routes)
server.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000'] 
    : [process.env.NUXT_PUBLIC_APP_URL],
  credentials: true
}))
server.use(helmet())

export const handler = server.fetch
```

> **Notes on the new framework API**:
> - The `createHandler` function is no longer used
> - Create a server instance with the `Server` class
> - Register global middleware with `server.use()`

## Defining API Routes

```typescript
// server/api/routes.ts
import { defineRoute, defineRoutes, err, Type } from 'vafast'

export const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/api/products',
    handler: async () => {
      // simulate a database query
      const products = [
        { id: 1, name: 'Product 1', price: 99.99, description: 'Amazing product' },
        { id: 2, name: 'Product 2', price: 149.99, description: 'Another great product' }
      ]
      
      return { products }
    }
  }),
  
  defineRoute({
    method: 'POST',
    path: '/api/products',
    schema: {
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        price: Type.Number({ minimum: 0 }),
        description: Type.Optional(Type.String())
      })
    },
    handler: async ({ body }) => {
      // create a new product
      const newProduct = {
        id: Date.now(),
        ...body,
        createdAt: new Date().toISOString()
      }
      
      return { product: newProduct }
    }
  }),
  
  defineRoute({
    method: 'GET',
    path: '/api/products/:id',
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
      })
    },
    handler: async ({ params }) => {
      const productId = parseInt(params.id)
      
      // simulate a database query
      const product = { 
        id: productId, 
        name: 'Sample Product', 
        price: 99.99, 
        description: 'Sample description' 
      }
      
      if (!product) {
        throw err.notFound('Product not found')
      }
      
      return { product }
    }
  }),
  
  defineRoute({
    method: 'PUT',
    path: '/api/products/:id',
    handler: async ({ params, body }) => {
      const productId = parseInt(params.id)
      
      // simulate a database update
      const updatedProduct = {
        id: productId,
        ...body,
        updatedAt: new Date().toISOString()
      }
      
      return { product: updatedProduct }
    },
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        price: Type.Optional(Type.Number({ minimum: 0 })),
        description: Type.Optional(Type.String())
      })
    }
  }),
  
  defineRoute({
    method: 'DELETE',
    path: '/api/products/:id',
    handler: async ({ params }) => {
      const productId = parseInt(params.id)
      
      // simulate a database delete
      console.log(`Deleting product ${productId}`)
      
      return { success: true }
    },
    schema: {
      params: Type.Object({
        id: Type.String({ pattern: '^\\d+$' })
      })
    }
  })
])
```

## Creating the Nuxt Server Route

```typescript
// server/api/[...path].ts
import { handler } from './server'

export default defineEventHandler(async (event) => {
  const request = event.node.req
  const response = await handler(request)
  
  // set the response status and headers
  setResponseStatus(event, response.status)
  
  // copy the response headers
  for (const [key, value] of response.headers.entries()) {
    setResponseHeader(event, key, value)
  }
  
  // return the response body
  return response.json()
})
```

## Type Definitions

```typescript
// server/api/types.ts
import { Type } from 'vafast'

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

## Frontend Integration

### Using the API Routes

```vue
<!-- pages/products/index.vue -->
<template>
  <div class="container">
    <h1>Products</h1>
    
    <!-- create a new product -->
    <div class="create-form">
      <input 
        v-model="newProduct.name"
        type="text" 
        placeholder="Product name"
        @keydown.enter="createProduct"
      />
      <input 
        v-model.number="newProduct.price"
        type="number" 
        placeholder="Price"
        step="0.01"
        min="0"
      />
      <textarea 
        v-model="newProduct.description"
        placeholder="Product description (optional)"
        rows="3"
      ></textarea>
      <button @click="createProduct" :disabled="!newProduct.name || !newProduct.price">
        Create product
      </button>
    </div>
    
    <!-- error display -->
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- loading state -->
    <div v-if="loading" class="loading">Loading...</div>
    
    <!-- product list -->
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
            Edit
          </button>
          <button @click="deleteProduct(product.id)" class="delete-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product, CreateProduct } from '~/server/api/types'

// reactive state
const products = ref<Product[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const newProduct = ref<CreateProduct>({
  name: '',
  price: 0,
  description: ''
})

// fetch the product list
async function fetchProducts() {
  try {
    loading.value = true
    error.value = null
    const response = await $fetch('/api/products')
    products.value = response.products
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch products'
  } finally {
    loading.value = false
  }
}

// create a product
async function createProduct() {
  if (!newProduct.value.name || !newProduct.value.price) return
  
  try {
    const response = await $fetch('/api/products', {
      method: 'POST',
      body: newProduct.value
    })
    
    products.value.push(response.product)
    
    // reset the form
    newProduct.value = {
      name: '',
      price: 0,
      description: ''
    }
  } catch (err) {
    console.error('Failed to create product:', err)
  }
}

// edit a product
function editProduct(product: Product) {
  navigateTo(`/products/${product.id}/edit`)
}

// delete a product
async function deleteProduct(id: number) {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  try {
    await $fetch(`/api/products/${id}`, {
      method: 'DELETE'
    })
    
    products.value = products.value.filter(p => p.id !== id)
  } catch (err) {
    console.error('Failed to delete product:', err)
  }
}

// fetch the product list on page load
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

### Product Detail Page

```vue
<!-- pages/products/[id].vue -->
<template>
  <div class="container">
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="error" class="error">
      {{ error }}
      <button @click="fetchProduct" class="retry-btn">Retry</button>
    </div>
    
    <div v-else-if="product" class="product-detail">
      <h1>{{ product.name }}</h1>
      <div class="product-info">
        <p class="price">¥{{ product.price }}</p>
        <p v-if="product.description" class="description">
          {{ product.description }}
        </p>
        <p class="created-at">
          Created: {{ new Date(product.createdAt).toLocaleDateString() }}
        </p>
      </div>
      
      <div class="actions">
        <button @click="editProduct" class="edit-btn">Edit product</button>
        <button @click="deleteProduct" class="delete-btn">Delete product</button>
        <button @click="goBack" class="back-btn">Back to list</button>
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

// fetch the product details
async function fetchProduct() {
  try {
    loading.value = true
    error.value = null
    const response = await $fetch(`/api/products/${route.params.id}`)
    product.value = response.product
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch product'
  } finally {
    loading.value = false
  }
}

// edit the product
function editProduct() {
  navigateTo(`/products/${route.params.id}/edit`)
}

// delete the product
async function deleteProduct() {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  try {
    await $fetch(`/api/products/${route.params.id}`, {
      method: 'DELETE'
    })
    
    // go back to the list after deleting
    navigateTo('/products')
  } catch (err) {
    console.error('Failed to delete product:', err)
  }
}

// back to the list
function goBack() {
  navigateTo('/products')
}

// fetch the product details on page load
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

## Composables

```typescript
// composables/useProducts.ts
import type { Product, CreateProduct, UpdateProduct } from '~/server/api/types'

export const useProducts = () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // fetch the product list
  const fetchProducts = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch('/api/products')
      products.value = response.products
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch products'
      throw err
    } finally {
      loading.value = false
    }
  }

  // fetch a single product
  const fetchProduct = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      const response = await $fetch(`/api/products/${id}`)
      return response.product
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch product'
      throw err
    } finally {
      loading.value = false
    }
  }

  // create a product
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
      error.value = err.message || 'Failed to create product'
      throw err
    } finally {
      loading.value = false
    }
  }

  // update a product
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
      error.value = err.message || 'Failed to update product'
      throw err
    } finally {
      loading.value = false
    }
  }

  // delete a product
  const deleteProduct = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      await $fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      
      products.value = products.value.filter(p => p.id !== id)
    } catch (err: any) {
      error.value = err.message || 'Failed to delete product'
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

## Middleware Integration

### Auth Middleware

::: tip Recommended for production
For full user authentication, use [@vafast/auth-middleware](/en/middleware/auth-middleware) (`authWithApp`, `requireUser`). Below is how to integrate it in Nuxt server routes.
:::

```typescript
// server/api/routes.ts
import { defineRoute, defineRoutes } from 'vafast'
import {
  authWithApp,
  requireUser,
  defineAuthRouteWithApp,
} from '@vafast/auth-middleware'

export const routes = defineRoutes([
  defineRoute({
    path: '/api',
    middleware: [authWithApp],
    children: [
      defineAuthRouteWithApp({
        method: 'GET',
        path: '/profile',
        middleware: [requireUser],
        handler: ({ userInfo, app }) => ({
          userId: userInfo.id,
          appId: app.id,
        }),
      }),
    ],
  }),
])
```

If you only need simple JWT verification (no separate auth service), see [@vafast/jwt](/en/middleware/jwt) or write your own `defineMiddleware`.

## Nuxt Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // enable SSR
  ssr: true,
  
  // devtools
  devtools: { enabled: true },
  
  // modules
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  // runtime config
  runtimeConfig: {
    // private config (server only)
    apiSecret: process.env.API_SECRET,
    
    // public config (available on client and server)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },
  
  // Nitro config
  nitro: {
    // server config
    experimental: {
      wasm: true
    }
  }
})
```

## Environment Configuration

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

## Testing

### API Tests

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

## Deployment

### Static Deployment

```bash
# build the app
nuxt build

# generate static files
nuxt generate

# deploy to a static host
```

### Server Deployment

```bash
# build the app
nuxt build

# start the production server
node .output/server/index.mjs
```

### Docker Deployment

**Node.js version:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

**Bun version:**

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["bun", "run", "start"]
```

## Best Practices

1. **Type safety**: use TypeScript to keep frontend and backend types consistent
2. **Error handling**: implement a unified error handling mechanism
3. **Middleware order**: pay attention to middleware execution order
4. **Environment config**: use different settings per environment
5. **Test coverage**: write thorough tests for API routes
6. **Performance**: use appropriate caching and compression strategies
7. **SSR optimization**: take advantage of Nuxt's SSR capabilities
8. **Composables**: wrap API logic in reusable composables

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [Nuxt docs](https://nuxt.com/docs) - official Nuxt documentation
- [Middleware system](/en/middleware) - explore available middleware
- [Type validation](/en/patterns/type) - learn about the type validation system
- [Deployment guide](/en/patterns/deploy) - production deployment advice
