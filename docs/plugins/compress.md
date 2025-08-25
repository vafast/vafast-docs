---
title: Compress 插件 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Compress 插件 - Vafast

  - - meta
    - name: 'description'
      content: Vafast 的压缩插件，支持 Brotli、GZIP 和 Deflate 压缩算法，自动根据客户端的 accept-encoding 头部选择合适的压缩方式。

  - - meta
    - name: 'og:description'
      content: Vafast 的压缩插件，支持 Brotli、GZIP 和 Deflate 压缩算法，自动根据客户端的 accept-encoding 头部选择合适的压缩方式。
---

# Compress 插件

用于 [Vafast](https://github.com/vafastjs/vafast) 的压缩插件，支持 Brotli、GZIP 和 Deflate 压缩算法。

## 安装

通过以下命令安装：

```bash
bun add @vafast/compress
```

## 基本用法

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'

// 定义路由处理器
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { message: 'Hello World!'.repeat(100) } // 生成足够长的响应以触发压缩
    }),
    middleware: [
      compression({
        encodings: ['br', 'gzip', 'deflate'],
        threshold: 1024,
        compressStream: false
      })
    ]
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
  fetch: (req: Request) => server.fetch(req)
}
```

## 配置选项

### CompressionOptions

```typescript
interface CompressionOptions {
  /**
   * Brotli 压缩选项
   * @see https://nodejs.org/api/zlib.html#compressor-options
   */
  brotliOptions?: BrotliOptions

  /**
   * GZIP 或 Deflate 压缩选项
   * @see https://nodejs.org/api/zlib.html#class-options
   */
  zlibOptions?: ZlibOptions

  /**
   * 支持的压缩编码
   * 默认优先级：1. br (Brotli) 2. gzip 3. deflate
   * 如果客户端不支持某个编码或缺少 accept-encoding 头部，将不会压缩
   * 示例：encodings: ['gzip', 'deflate']
   */
  encodings?: CompressionEncoding[]

  /**
   * 是否通过 x-no-compression 头部禁用压缩
   * 默认情况下，如果请求包含 x-no-compression 头部，将不会压缩响应
   * @default true
   */
  disableByHeader?: boolean

  /**
   * 触发压缩的最小字节大小
   * @default 1024
   */
  threshold?: number

  /**
   * 是否压缩流数据
   * 通常用于 Server-Sent Events
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
   * @default false
   */
  compressStream?: boolean
}
```

### LifeCycleOptions

```typescript
interface LifeCycleOptions {
  /**
   * 中间件执行顺序和作用域
   * @default 'after'
   */
  as?: 'before' | 'after'
}
```

### CacheOptions

```typescript
interface CacheOptions {
  /**
   * 缓存的生存时间（秒）
   * @default 86400 (24 小时)
   */
  TTL?: number
}
```

## 压缩算法

### 支持的编码

- **Brotli (`br`)**: 现代压缩算法，通常提供最佳的压缩比
- **GZIP (`gzip`)**: 广泛支持的压缩算法，兼容性好
- **Deflate (`deflate`)**: 轻量级压缩算法

### 默认优先级

1. `br` (Brotli) - 最高优先级
2. `gzip` - 中等优先级  
3. `deflate` - 最低优先级

## 使用模式

### 1. 基本压缩配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'

const routes = [
  {
    method: 'GET',
    path: '/api/data',
    handler: createRouteHandler(() => {
      // 返回大量数据，触发压缩
      return {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a description for item ${i}`.repeat(10)
        }))
      }
    }),
    middleware: [
      compression({
        encodings: ['br', 'gzip'],
        threshold: 512, // 降低阈值，更容易触发压缩
        compressStream: false
      })
    ]
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 2. 自定义压缩选项

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'
import { constants } from 'node:zlib'

const routes = [
  {
    method: 'GET',
    path: '/optimized',
    handler: createRouteHandler(() => {
      return { message: 'Optimized compression response' }
    }),
    middleware: [
      compression({
        encodings: ['br', 'gzip'],
        threshold: 100, // 非常低的阈值
        compressStream: true, // 启用流压缩
        brotliOptions: {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: 11, // 最高质量
            [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC
          }
        },
        zlibOptions: {
          level: 9, // 最高压缩级别
          memLevel: 9 // 最高内存使用
        },
        TTL: 3600 // 1 小时缓存
      })
    ]
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 3. 条件压缩

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'

const routes = [
  {
    method: 'GET',
    path: '/public',
    handler: createRouteHandler(() => {
      return { message: 'Public endpoint - no compression' }
    })
    // 不应用压缩中间件
  },
  {
    method: 'GET',
    path: '/api/large',
    handler: createRouteHandler(() => {
      return { 
        data: 'Large response data'.repeat(1000),
        timestamp: Date.now()
      }
    }),
    middleware: [
      compression({
        encodings: ['br'],
        threshold: 100,
        compressStream: false
      })
    ]
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 4. 流数据压缩

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'

const routes = [
  {
    method: 'GET',
    path: '/stream',
    handler: createRouteHandler(() => {
      // 创建 Server-Sent Events 流
      const stream = new ReadableStream({
        start(controller) {
          let count = 0
          const interval = setInterval(() => {
            if (count >= 100) {
              clearInterval(interval)
              controller.close()
              return
            }
            
            const data = `data: ${JSON.stringify({
              id: count,
              message: `Event ${count}`,
              timestamp: Date.now()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(data))
            count++
          }, 100)
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }),
    middleware: [
      compression({
        encodings: ['gzip'],
        threshold: 1,
        compressStream: true, // 启用流压缩
        zlibOptions: { level: 6 }
      })
    ]
  }
]

const server = new Server(routes)
export default { fetch: (req: Request) => server.fetch(req) }
```

### 5. 全局压缩配置

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'

// 创建全局压缩中间件
const globalCompression = compression({
  encodings: ['br', 'gzip'],
  threshold: 1024,
  compressStream: false,
  TTL: 7200 // 2 小时缓存
})

const routes = [
  {
    method: 'GET',
    path: '/api/users',
    handler: createRouteHandler(() => {
      return { users: generateLargeUserList() }
    })
  },
  {
    method: 'GET',
    path: '/api/products',
    handler: createRouteHandler(() => {
      return { products: generateLargeProductList() }
    })
  }
]

const server = new Server(routes)

export default {
  fetch: (req: Request) => {
    // 为所有请求应用压缩中间件
    return globalCompression(req, () => server.fetch(req))
  }
}
```

## 完整示例

```typescript
import { Server, createRouteHandler } from 'vafast'
import { compression } from '@vafast/compress'
import { constants } from 'node:zlib'

// 模拟数据生成函数
const generateLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `This is a detailed description for item ${i}`.repeat(5),
    metadata: {
      category: `Category ${i % 10}`,
      tags: [`tag${i}`, `tag${i + 1}`, `tag${i + 2}`],
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }
  }))
}

const generateMarkdownContent = () => {
  return `# 大型文档内容

## 章节 1
${'这是章节 1 的详细内容，包含大量文本信息。'.repeat(100)}

## 章节 2
${'这是章节 2 的详细内容，同样包含大量文本信息。'.repeat(100)}

## 章节 3
${'这是章节 3 的详细内容，继续包含大量文本信息。'.repeat(100)}

## 总结
${'这是一个包含大量内容的文档，用于演示压缩效果。'.repeat(50)}
`
}

// 定义路由
const routes = [
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => {
      return { 
        message: 'Vafast Compression API',
        endpoints: [
          '/api/data - 获取大型数据集',
          '/api/markdown - 获取 Markdown 文档',
          '/api/stream - 获取流式数据',
          '/api/optimized - 获取优化压缩的数据'
        ]
      }
    })
  },
  {
    method: 'GET',
    path: '/api/data',
    handler: createRouteHandler(() => {
      return {
        message: 'Large dataset retrieved successfully',
        data: generateLargeDataset(500),
        totalItems: 500,
        timestamp: Date.now()
      }
    }),
    middleware: [
      compression({
        encodings: ['br', 'gzip'],
        threshold: 1024,
        compressStream: false,
        TTL: 3600 // 1 小时缓存
      })
    ]
  },
  {
    method: 'GET',
    path: '/api/markdown',
    handler: createRouteHandler(() => {
      return {
        content: generateMarkdownContent(),
        format: 'markdown',
        size: generateMarkdownContent().length,
        timestamp: Date.now()
      }
    }),
    middleware: [
      compression({
        encodings: ['br', 'gzip', 'deflate'],
        threshold: 512,
        compressStream: false
      })
    ]
  },
  {
    method: 'GET',
    path: '/api/stream',
    handler: createRouteHandler(() => {
      const stream = new ReadableStream({
        start(controller) {
          let count = 0
          const interval = setInterval(() => {
            if (count >= 50) {
              clearInterval(interval)
              controller.close()
              return
            }
            
            const data = `data: ${JSON.stringify({
              id: count,
              message: `Stream event ${count}`,
              data: `Event data ${count}`.repeat(20),
              timestamp: Date.now()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(data))
            count++
          }, 200)
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }),
    middleware: [
      compression({
        encodings: ['gzip'],
        threshold: 1,
        compressStream: true,
        zlibOptions: { level: 6 }
      })
    ]
  },
  {
    method: 'GET',
    path: '/api/optimized',
    handler: createRouteHandler(() => {
      return {
        message: 'Optimized compression response',
        data: generateLargeDataset(200),
        compression: {
          algorithm: 'brotli',
          quality: 'maximum',
          cache: 'enabled'
        }
      }
    }),
    middleware: [
      compression({
        encodings: ['br'],
        threshold: 100,
        compressStream: false,
        brotliOptions: {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: 11,
            [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC
          }
        },
        TTL: 7200 // 2 小时缓存
      })
    ]
  }
]

// 创建服务器
const server = new Server(routes)

// 导出 fetch 函数
export default {
  fetch: (req: Request) => server.fetch(req)
}

console.log('🚀 Vafast Compression API 服务器启动成功！')
console.log('📊 数据端点: GET /api/data (启用 Brotli/GZIP 压缩)')
console.log('📝 文档端点: GET /api/markdown (启用多种压缩算法)')
console.log('🌊 流式端点: GET /api/stream (启用流压缩)')
console.log('⚡ 优化端点: GET /api/optimized (启用 Brotli 最高质量压缩)')
```

## 测试示例

```typescript
import { describe, expect, it } from 'bun:test'

describe('Vafast Compression API', () => {
  it('should compress large responses', async () => {
    const res = await app.fetch(new Request('http://localhost/api/data'))
    
    expect(res.headers.get('Content-Encoding')).toBeTruthy()
    expect(res.headers.get('Vary')).toBe('accept-encoding')
    expect(res.ok).toBe(true)
  })
  
  it('should not compress small responses below threshold', async () => {
    const res = await app.fetch(new Request('http://localhost/'))
    
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.headers.get('Vary')).toBeNull()
    expect(res.ok).toBe(true)
  })
  
  it('should respect x-no-compression header', async () => {
    const res = await app.fetch(new Request('http://localhost/api/data', {
      headers: { 'x-no-compression': 'true' }
    }))
    
    expect(res.headers.get('Content-Encoding')).toBeNull()
    expect(res.ok).toBe(true)
  })
  
  it('should handle different accept-encoding preferences', async () => {
    const res = await app.fetch(new Request('http://localhost/api/data', {
      headers: { 'accept-encoding': 'gzip, deflate' }
    }))
    
    expect(res.headers.get('Content-Encoding')).toBe('gzip')
    expect(res.ok).toBe(true)
  })
})
```

## 特性

- ✅ **多种压缩算法**: 支持 Brotli、GZIP 和 Deflate
- ✅ **智能编码选择**: 根据客户端的 `accept-encoding` 头部自动选择最佳压缩方式
- ✅ **可配置阈值**: 可设置最小压缩字节大小
- ✅ **流数据支持**: 支持压缩 Server-Sent Events 等流数据
- ✅ **缓存机制**: 内置压缩结果缓存，提高性能
- ✅ **HTTP 标准兼容**: 自动设置 `Content-Encoding` 和 `Vary` 头部
- ✅ **条件压缩**: 支持通过请求头部禁用压缩
- ✅ **类型安全**: 完整的 TypeScript 类型支持

## 性能优化建议

### 1. 压缩级别选择

```typescript
// 生产环境 - 平衡压缩比和性能
compression({
  zlibOptions: { level: 6 }, // 默认级别
  brotliOptions: {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 6 // 平衡质量
    }
  }
})

// 开发环境 - 快速压缩
compression({
  zlibOptions: { level: 1 },
  brotliOptions: {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 3
    }
  }
})
```

### 2. 缓存策略

```typescript
// 静态内容 - 长缓存
compression({
  TTL: 86400 * 7 // 7 天
})

// 动态内容 - 短缓存
compression({
  TTL: 3600 // 1 小时
})
```

### 3. 阈值优化

```typescript
// 文本内容 - 低阈值
compression({
  threshold: 256 // 256 字节
})

// 二进制内容 - 高阈值
compression({
  threshold: 2048 // 2KB
})
```

## 注意事项

1. **压缩开销**: 压缩会增加 CPU 开销，对于小文件可能得不偿失
2. **缓存策略**: 合理设置 TTL 值，避免内存泄漏
3. **流压缩**: 启用 `compressStream` 时注意内存使用
4. **内容类型**: 某些二进制格式（如图片、视频）不适合压缩
5. **HTTPS 影响**: 在 HTTPS 连接中，压缩可能被 TLS 层处理

## 相关链接

- [HTTP 压缩 - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression)
- [Accept-Encoding - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)
- [Content-Encoding - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
- [Brotli 压缩算法](https://en.wikipedia.org/wiki/Brotli)
- [Vafast 官方文档](https://vafast.dev)
