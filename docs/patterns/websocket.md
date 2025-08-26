---
title: WebSocket - Vafast
---

# WebSocket

WebSocket 是一种用于客户端与服务器之间通信的实时协议。

与 HTTP 不同，客户端一次又一次地询问网站信息并等待每次的回复，WebSocket 建立了一条直接的通道，使我们的客户端和服务器可以直接来回发送消息，从而使对话更快、更流畅，而无需每条消息都重新开始。

Vafast 使用 Bun 的内置 WebSocket 支持，提供了高性能的实时通信能力。

## 基本 WebSocket 实现

要使用 WebSocket，您可以使用 Bun 的内置 WebSocket 服务器：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 定义 HTTP 路由
const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => 'Hello Vafast!')
  }
])

const server = new Server(routes)

// 创建 WebSocket 服务器
const wsServer = Bun.serve({
  port: 3001,
  fetch(req, server) {
    // 升级 HTTP 请求到 WebSocket
    if (server.upgrade(req)) {
      return // 返回 undefined 表示升级成功
    }
    return new Response("Upgrade failed", { status: 500 })
  },
  websocket: {
    // 连接建立时
    open(ws) {
      console.log("WebSocket 连接已建立")
      ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to Vafast WebSocket!' }))
    },
    // 接收消息时
    message(ws, message) {
      console.log("收到消息:", message)
      // 回显消息
      ws.send(JSON.stringify({ 
        type: 'echo', 
        message: message,
        timestamp: Date.now()
      }))
    },
    // 连接关闭时
    close(ws, code, reason) {
      console.log("WebSocket 连接已关闭:", code, reason)
    },
    // 发生错误时
    error(ws, error) {
      console.error("WebSocket 错误:", error)
    }
  }
})

console.log(`WebSocket 服务器运行在端口 ${wsServer.port}`)
export default { fetch: server.fetch }
```

## 集成到 Vafast 应用

您可以将 WebSocket 功能集成到现有的 Vafast 应用中：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

const routes = defineRoutes([
  {
    method: 'GET',
    path: '/',
    handler: createRouteHandler(() => `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vafast WebSocket Demo</title>
        </head>
        <body>
          <h1>Vafast WebSocket 演示</h1>
          <div id="messages"></div>
          <input type="text" id="messageInput" placeholder="输入消息">
          <button onclick="sendMessage()">发送</button>
          
          <script>
            const ws = new WebSocket('ws://localhost:3001')
            const messagesDiv = document.getElementById('messages')
            
            ws.onopen = () => {
              console.log('WebSocket 连接已建立')
            }
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data)
              const messageDiv = document.createElement('div')
              messageDiv.textContent = \`[\${new Date().toLocaleTimeString()}] \${data.message}\`
              messagesDiv.appendChild(messageDiv)
            }
            
            function sendMessage() {
              const input = document.getElementById('messageInput')
              const message = input.value
              if (message) {
                ws.send(message)
                input.value = ''
              }
            }
          </script>
        </body>
      </html>
    `)
  }
])

const server = new Server(routes)

// 启动 HTTP 服务器
const httpServer = Bun.serve({
  port: 3000,
  fetch: server.fetch
})

// 启动 WebSocket 服务器
const wsServer = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response("Upgrade failed", { status: 500 })
  },
  websocket: {
    open(ws) {
      console.log("WebSocket 连接已建立")
    },
    message(ws, message) {
      console.log("收到消息:", message)
      ws.send(JSON.stringify({ 
        type: 'response', 
        message: \`服务器收到: \${message}\`,
        timestamp: Date.now()
      }))
    },
    close(ws) {
      console.log("WebSocket 连接已关闭")
    }
  }
})

console.log(`HTTP 服务器运行在端口 ${httpServer.port}`)
console.log(`WebSocket 服务器运行在端口 ${wsServer.port}`)
```

## 类型安全的 WebSocket

您可以使用 TypeScript 和 TypeBox 来确保 WebSocket 消息的类型安全：

```typescript
import { Type } from '@sinclair/typebox'

// 定义消息类型
const MessageSchema = Type.Object({
  type: Type.Union([
    Type.Literal('chat'),
    Type.Literal('notification'),
    Type.Literal('status')
  ]),
  content: Type.String(),
  userId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.Number())
})

type Message = Static<typeof MessageSchema>

// WebSocket 服务器
const wsServer = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response("Upgrade failed", { status: 500 })
  },
  websocket: {
    open(ws) {
      console.log("WebSocket 连接已建立")
    },
    message(ws, message) {
      try {
        // 解析和验证消息
        const parsedMessage = JSON.parse(message as string)
        
        if (Type.Check(MessageSchema, parsedMessage)) {
          // 消息类型安全
          const validatedMessage: Message = parsedMessage
          console.log("收到有效消息:", validatedMessage)
          
          // 处理不同类型的消息
          switch (validatedMessage.type) {
            case 'chat':
              ws.send(JSON.stringify({
                type: 'chat_response',
                content: `收到聊天消息: ${validatedMessage.content}`,
                timestamp: Date.now()
              }))
              break
            case 'notification':
              ws.send(JSON.stringify({
                type: 'notification_response',
                content: '通知已收到',
                timestamp: Date.now()
              }))
              break
            case 'status':
              ws.send(JSON.stringify({
                type: 'status_response',
                content: '状态已更新',
                timestamp: Date.now()
              }))
              break
          }
        } else {
          // 发送验证错误
          ws.send(JSON.stringify({
            type: 'error',
            message: '消息格式无效',
            timestamp: Date.now()
          }))
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '消息解析失败',
          timestamp: Date.now()
        }))
      }
    },
    close(ws) {
      console.log("WebSocket 连接已关闭")
    }
  }
})
```

## 房间和广播

实现聊天室功能：

```typescript
import { Server, defineRoutes, createRouteHandler } from 'vafast'

// 房间管理
class RoomManager {
  private rooms = new Map<string, Set<WebSocket>>()
  
  addToRoom(roomId: string, ws: WebSocket) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set())
    }
    this.rooms.get(roomId)!.add(ws)
  }
  
  removeFromRoom(roomId: string, ws: WebSocket) {
    const room = this.rooms.get(roomId)
    if (room) {
      room.delete(ws)
      if (room.size === 0) {
        this.rooms.delete(roomId)
      }
    }
  }
  
  broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
    const room = this.rooms.get(roomId)
    if (room) {
      const messageStr = JSON.stringify(message)
      room.forEach(ws => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr)
        }
      })
    }
  }
}

const roomManager = new RoomManager()

const wsServer = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response("Upgrade failed", { status: 500 })
  },
  websocket: {
    open(ws) {
      console.log("WebSocket 连接已建立")
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message as string)
        
        if (data.type === 'join_room') {
          const { roomId, userId } = data
          roomManager.addToRoom(roomId, ws)
          
          // 通知房间其他用户
          roomManager.broadcastToRoom(roomId, {
            type: 'user_joined',
            userId,
            roomId,
            timestamp: Date.now()
          }, ws)
          
          // 确认加入房间
          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId,
            userId,
            timestamp: Date.now()
          }))
        } else if (data.type === 'chat_message') {
          const { roomId, userId, content } = data
          
          // 广播消息到房间
          roomManager.broadcastToRoom(roomId, {
            type: 'chat_message',
            userId,
            content,
            roomId,
            timestamp: Date.now()
          })
        } else if (data.type === 'leave_room') {
          const { roomId, userId } = data
          roomManager.removeFromRoom(roomId, ws)
          
          // 通知房间其他用户
          roomManager.broadcastToRoom(roomId, {
            type: 'user_left',
            userId,
            roomId,
            timestamp: Date.now()
          })
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '消息处理失败',
          timestamp: Date.now()
        }))
      }
    },
    close(ws) {
      console.log("WebSocket 连接已关闭")
      // 从所有房间中移除用户
      // 这里需要维护 ws 到房间的映射
    }
  }
})
```

## 配置选项

Bun 的 WebSocket 服务器支持多种配置选项：

```typescript
const wsServer = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response("Upgrade failed", { status: 500 })
  },
  websocket: {
    // 连接建立时
    open(ws) {
      console.log("WebSocket 连接已建立")
    },
    // 接收消息时
    message(ws, message) {
      ws.send(message)
    },
    // 连接关闭时
    close(ws, code, reason) {
      console.log("WebSocket 连接已关闭:", code, reason)
    },
    // 发生错误时
    error(ws, error) {
      console.error("WebSocket 错误:", error)
    }
  },
  // 其他配置选项
  maxPayloadLength: 1024 * 1024, // 1MB
  idleTimeout: 30, // 30秒空闲超时
  perMessageDeflate: false, // 禁用消息压缩
  maxBackpressure: 1024 * 1024 // 1MB 背压限制
})
```

## 错误处理

实现健壮的错误处理：

```typescript
const wsServer = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response("Upgrade failed", { status: 500 })
  },
  websocket: {
    open(ws) {
      try {
        console.log("WebSocket 连接已建立")
        ws.send(JSON.stringify({ type: 'connected' }))
      } catch (error) {
        console.error("连接建立失败:", error)
        ws.close(1011, "Internal error")
      }
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message as string)
        // 处理消息...
        ws.send(JSON.stringify({ type: 'ack', data }))
      } catch (error) {
        console.error("消息处理失败:", error)
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: '消息处理失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    },
    close(ws, code, reason) {
      console.log("WebSocket 连接已关闭:", code, reason)
      // 清理资源
    },
    error(ws, error) {
      console.error("WebSocket 错误:", error)
      // 尝试优雅地关闭连接
      try {
        ws.close(1011, "Internal error")
      } catch (closeError) {
        console.error("关闭连接失败:", closeError)
      }
    }
  }
})
```

## 性能优化

### 1. 消息批处理

```typescript
class MessageBatcher {
  private batch: any[] = []
  private batchTimeout: Timer | null = null
  private readonly batchSize = 10
  private readonly batchDelay = 100 // 100ms
  
  addMessage(message: any) {
    this.batch.push(message)
    
    if (this.batch.length >= this.batchSize) {
      this.flush()
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flush(), this.batchDelay)
    }
  }
  
  private flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    
    if (this.batch.length > 0) {
      // 发送批量消息
      console.log(`发送批量消息: ${this.batch.length} 条`)
      this.batch = []
    }
  }
}

const batcher = new MessageBatcher()
```

### 2. 连接池管理

```typescript
class ConnectionPool {
  private connections = new Set<WebSocket>()
  private maxConnections = 1000
  
  addConnection(ws: WebSocket): boolean {
    if (this.connections.size >= this.maxConnections) {
      return false
    }
    this.connections.add(ws)
    return true
  }
  
  removeConnection(ws: WebSocket) {
    this.connections.delete(ws)
  }
  
  broadcast(message: any) {
    const messageStr = JSON.stringify(message)
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr)
      }
    })
  }
  
  getConnectionCount(): number {
    return this.connections.size
  }
}

const connectionPool = new ConnectionPool()
```

## 总结

Vafast 的 WebSocket 实现提供了：

- ✅ 基于 Bun 的高性能 WebSocket 支持
- ✅ 类型安全的消息处理
- ✅ 房间和广播功能
- ✅ 完整的错误处理
- ✅ 性能优化选项
- ✅ 灵活的配置选项

### 下一步

- 查看 [路由系统](/essential/route) 了解如何组织路由
- 学习 [中间件系统](/middleware) 了解如何增强功能
- 探索 [验证系统](/essential/validation) 了解类型安全
- 查看 [最佳实践](/essential/best-practice) 获取更多开发建议

如果您有任何问题，请查看我们的 [社区页面](/community) 或 [GitHub 仓库](https://github.com/vafast/vafast)。
