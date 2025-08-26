---
title: WebSocket 支持 - Vafast 类型安全客户端
head:
  - - meta
    - property: 'og:title'
      content: WebSocket 支持 - Vafast 类型安全客户端

  - - meta
    - name: 'description'
      content: 学习如何在 Vafast 类型安全客户端中使用 WebSocket 进行实时通信，包括连接管理、消息处理、类型安全等。

  - - meta
    - property: 'og:description'
      content: 学习如何在 Vafast 类型安全客户端中使用 WebSocket 进行实时通信，包括连接管理、消息处理、类型安全等。
---

# WebSocket 支持

Vafast 类型安全客户端提供了完整的 WebSocket 支持，让您能够进行类型安全的实时通信。本章将详细介绍如何使用 WebSocket 功能。

## 🌐 WebSocket 概述

WebSocket 是一种在客户端和服务器之间建立持久连接的协议，支持双向实时通信。Vafast 类型安全客户端基于 Bun 的原生 WebSocket 支持，提供了类型安全和易用的 API。

### 主要特性

- **类型安全** - 完整的 TypeScript 类型支持
- **自动重连** - 智能的连接管理和重连机制
- **事件驱动** - 基于事件的 API 设计
- **消息验证** - 运行时消息类型验证
- **性能优化** - 高效的连接池和消息处理

## 🚀 快速开始

### 基本 WebSocket 连接

```typescript
import { createWebSocketClient } from '@vafast/api-client'

// 创建 WebSocket 客户端
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  autoReconnect: true,
  maxReconnectAttempts: 5
})

// 连接到服务器
await wsClient.connect()

// 发送消息
wsClient.send({ type: 'chat', message: 'Hello, World!' })

// 监听消息
wsClient.on('message', (data) => {
  console.log('Received:', data)
})

// 关闭连接
wsClient.close()
```

### 类型安全的 WebSocket

```typescript
// 定义消息类型
interface ChatMessage {
  type: 'chat'
  message: string
  userId: string
  timestamp: number
}

interface SystemMessage {
  type: 'system'
  action: 'user_joined' | 'user_left' | 'notification'
  data: any
}

type WebSocketMessage = ChatMessage | SystemMessage

// 创建类型安全的 WebSocket 客户端
const wsClient = createWebSocketClient<WebSocketMessage>('ws://localhost:3000/ws', {
  autoReconnect: true
})

// 连接后发送类型安全的消息
await wsClient.connect()

// 发送聊天消息
wsClient.send({
  type: 'chat',
  message: 'Hello, everyone!',
  userId: 'user123',
  timestamp: Date.now()
})

// 监听消息（类型安全）
wsClient.on('message', (data: WebSocketMessage) => {
  switch (data.type) {
    case 'chat':
      console.log(`${data.userId}: ${data.message}`)
      break
      
    case 'system':
      console.log(`System: ${data.action}`)
      break
  }
})
```

## 🔌 连接管理

### 连接配置

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  // 自动重连
  autoReconnect: true,
  
  // 最大重连次数
  maxReconnectAttempts: 10,
  
  // 重连延迟（毫秒）
  reconnectDelay: 1000,
  
  // 连接超时
  connectionTimeout: 5000,
  
  // 心跳间隔
  heartbeatInterval: 30000,
  
  // 心跳超时
  heartbeatTimeout: 5000,
  
  // 协议
  protocols: ['chat', 'v1'],
  
  // 请求头
  headers: {
    'Authorization': 'Bearer token123',
    'User-Agent': 'Vafast-WebSocket-Client/1.0.0'
  }
})
```

### 连接状态管理

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 监听连接状态变化
wsClient.on('open', () => {
  console.log('WebSocket connected')
})

wsClient.on('close', (event) => {
  console.log('WebSocket closed:', event.code, event.reason)
})

wsClient.on('error', (error) => {
  console.error('WebSocket error:', error)
})

// 检查连接状态
if (wsClient.isConnected()) {
  console.log('WebSocket is connected')
} else {
  console.log('WebSocket is disconnected')
}

// 获取连接信息
const connectionInfo = wsClient.getConnectionInfo()
console.log('Connection URL:', connectionInfo.url)
console.log('Protocol:', connectionInfo.protocol)
console.log('Ready State:', connectionInfo.readyState)
```

### 手动连接控制

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  autoReconnect: false // 禁用自动重连
})

// 手动连接
try {
  await wsClient.connect()
  console.log('Connected successfully')
} catch (error) {
  console.error('Connection failed:', error)
}

// 手动重连
if (wsClient.isConnected()) {
  wsClient.reconnect()
}

// 关闭连接
wsClient.close(1000, 'Normal closure')

// 强制关闭
wsClient.forceClose()
```

## 📨 消息处理

### 发送消息

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

await wsClient.connect()

// 发送文本消息
wsClient.send('Hello, WebSocket!')

// 发送 JSON 消息
wsClient.send({
  type: 'user_action',
  action: 'click',
  target: 'button',
  timestamp: Date.now()
})

// 发送二进制数据
const buffer = new ArrayBuffer(8)
const view = new DataView(buffer)
view.setFloat64(0, Math.PI)
wsClient.send(buffer)

// 发送 Blob
const blob = new Blob(['Hello, Blob!'], { type: 'text/plain' })
wsClient.send(blob)
```

### 接收消息

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 监听所有消息
wsClient.on('message', (data, event) => {
  console.log('Raw message:', data)
  console.log('Event:', event)
})

// 监听特定类型的消息
wsClient.on('message', (data) => {
  if (typeof data === 'string') {
    console.log('Text message:', data)
  } else if (data instanceof ArrayBuffer) {
    console.log('Binary message:', data)
  } else if (data instanceof Blob) {
    console.log('Blob message:', data)
  } else {
    console.log('JSON message:', data)
  }
})

// 类型安全的消息处理
interface GameMessage {
  type: 'game_update' | 'player_move' | 'game_over'
  data: any
}

wsClient.on('message', (data: GameMessage) => {
  switch (data.type) {
    case 'game_update':
      updateGameState(data.data)
      break
      
    case 'player_move':
      handlePlayerMove(data.data)
      break
      
    case 'game_over':
      showGameOver(data.data)
      break
  }
})
```

### 消息验证

```typescript
import { Type } from '@sinclair/typebox'

// 定义消息验证器
const messageValidator = Type.Union([
  Type.Object({
    type: Type.Literal('chat'),
    message: Type.String(),
    userId: Type.String()
  }),
  Type.Object({
    type: Type.Literal('status'),
    online: Type.Boolean(),
    timestamp: Type.Number()
  })
])

const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  // 启用消息验证
  messageValidation: {
    enabled: true,
    validator: messageValidator
  }
})

// 监听验证失败的消息
wsClient.on('validation_error', (error, message) => {
  console.error('Message validation failed:', error)
  console.error('Invalid message:', message)
})

// 发送消息时会自动验证
wsClient.send({
  type: 'chat',
  message: 'Hello!',
  userId: 'user123'
}) // ✅ 有效

wsClient.send({
  type: 'invalid',
  data: 'invalid'
}) // ❌ 验证失败
```

## 🔄 事件系统

### 内置事件

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 连接事件
wsClient.on('open', (event) => {
  console.log('Connection opened:', event)
})

wsClient.on('close', (event) => {
  console.log('Connection closed:', event.code, event.reason)
})

wsClient.on('error', (error) => {
  console.error('Connection error:', error)
})

// 消息事件
wsClient.on('message', (data, event) => {
  console.log('Message received:', data)
})

// 重连事件
wsClient.on('reconnect', (attempt) => {
  console.log(`Reconnecting... Attempt ${attempt}`)
})

wsClient.on('reconnect_success', (attempt) => {
  console.log(`Reconnected successfully after ${attempt} attempts`)
})

wsClient.on('reconnect_failed', (attempt) => {
  console.log(`Reconnection failed after ${attempt} attempts`)
})

// 心跳事件
wsClient.on('heartbeat', () => {
  console.log('Heartbeat sent')
})

wsClient.on('heartbeat_timeout', () => {
  console.log('Heartbeat timeout')
})
```

### 自定义事件

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 创建自定义事件发射器
const eventEmitter = wsClient.createEventEmitter()

// 监听自定义事件
eventEmitter.on('user_joined', (user) => {
  console.log('User joined:', user)
  updateUserList(user)
})

eventEmitter.on('user_left', (user) => {
  console.log('User left:', user)
  removeUserFromList(user)
})

eventEmitter.on('message_sent', (message) => {
  console.log('Message sent:', message)
  addMessageToChat(message)
})

// 发射自定义事件
wsClient.on('message', (data) => {
  if (data.type === 'user_joined') {
    eventEmitter.emit('user_joined', data.user)
  } else if (data.type === 'user_left') {
    eventEmitter.emit('user_left', data.user)
  } else if (data.type === 'message_sent') {
    eventEmitter.emit('message_sent', data.message)
  }
})
```

## 🏗️ 房间和广播

### 房间管理

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 加入房间
wsClient.joinRoom('general')
wsClient.joinRoom('support')
wsClient.joinRoom('announcements')

// 离开房间
wsClient.leaveRoom('support')

// 获取当前房间
const currentRooms = wsClient.getCurrentRooms()
console.log('Current rooms:', currentRooms)

// 监听房间事件
wsClient.on('room_joined', (roomName) => {
  console.log(`Joined room: ${roomName}`)
})

wsClient.on('room_left', (roomName) => {
  console.log(`Left room: ${roomName}`)
})

wsClient.on('room_message', (roomName, message) => {
  console.log(`Message in ${roomName}:`, message)
})
```

### 广播消息

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 向所有连接的客户端广播
wsClient.broadcast({
  type: 'announcement',
  message: 'Server maintenance in 5 minutes',
  timestamp: Date.now()
})

// 向特定房间广播
wsClient.broadcastToRoom('general', {
  type: 'chat',
  message: 'Hello, general room!',
  sender: 'system'
})

// 向多个房间广播
wsClient.broadcastToRooms(['general', 'support'], {
  type: 'notification',
  message: 'New feature available!',
  feature: 'real-time-chat'
})

// 向特定用户广播
wsClient.broadcastToUser('user123', {
  type: 'private_message',
  message: 'You have a new message',
  from: 'admin'
})
```

## 🔒 安全特性

### 认证和授权

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  // 认证配置
  auth: {
    // 自动添加认证头
    autoAuth: true,
    
    // 获取认证信息
    getToken: () => localStorage.getItem('ws_token'),
    
    // 认证失败处理
    onAuthFailure: (error) => {
      console.error('Authentication failed:', error)
      localStorage.removeItem('ws_token')
      window.location.href = '/login'
    }
  }
})

// 发送认证消息
wsClient.send({
  type: 'authenticate',
  token: localStorage.getItem('ws_token')
})

// 监听认证响应
wsClient.on('message', (data) => {
  if (data.type === 'auth_success') {
    console.log('Authentication successful')
    wsClient.setAuthenticated(true)
  } else if (data.type === 'auth_failed') {
    console.error('Authentication failed:', data.reason)
    wsClient.setAuthenticated(false)
  }
})
```

### 消息加密

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  // 加密配置
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
    key: 'your-secret-key'
  }
})

// 发送加密消息
const encryptedMessage = wsClient.encrypt({
  type: 'sensitive_data',
  data: 'confidential information'
})

wsClient.send(encryptedMessage)

// 接收加密消息
wsClient.on('message', (data) => {
  if (data.encrypted) {
    const decryptedMessage = wsClient.decrypt(data)
    console.log('Decrypted message:', decryptedMessage)
  } else {
    console.log('Plain message:', data)
  }
})
```

## 📊 性能监控

### 连接统计

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws')

// 获取连接统计
const stats = wsClient.getStats()
console.log('Total messages sent:', stats.messagesSent)
console.log('Total messages received:', stats.messagesReceived)
console.log('Connection uptime:', stats.uptime)
console.log('Reconnection attempts:', stats.reconnectionAttempts)
console.log('Average message size:', stats.averageMessageSize)

// 监听性能事件
wsClient.on('performance_metric', (metric) => {
  console.log('Performance metric:', metric)
  
  // 发送到监控系统
  sendToMonitoring({
    type: 'websocket_performance',
    metric,
    timestamp: Date.now()
  })
})
```

### 消息队列

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  // 消息队列配置
  messageQueue: {
    enabled: true,
    maxSize: 1000,
    flushInterval: 100
  }
})

// 批量发送消息
wsClient.queueMessage({ type: 'log', level: 'info', message: 'User action' })
wsClient.queueMessage({ type: 'log', level: 'info', message: 'Another action' })
wsClient.queueMessage({ type: 'log', level: 'info', message: 'Third action' })

// 手动刷新队列
wsClient.flushMessageQueue()

// 获取队列状态
const queueStatus = wsClient.getMessageQueueStatus()
console.log('Queue size:', queueStatus.size)
console.log('Queue full:', queueStatus.isFull)
```

## 🧪 测试和调试

### WebSocket 测试

```typescript
// test/websocket.test.ts
import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { createWebSocketClient } from '@vafast/api-client'

describe('WebSocket Client', () => {
  let wsClient: any
  
  beforeEach(() => {
    wsClient = createWebSocketClient('ws://localhost:3000/ws', {
      autoReconnect: false
    })
  })
  
  afterEach(() => {
    wsClient.close()
  })
  
  it('should connect successfully', async () => {
    await wsClient.connect()
    expect(wsClient.isConnected()).toBe(true)
  })
  
  it('should send and receive messages', async () => {
    await wsClient.connect()
    
    const messagePromise = new Promise((resolve) => {
      wsClient.on('message', resolve)
    })
    
    wsClient.send({ type: 'test', data: 'hello' })
    
    const receivedMessage = await messagePromise
    expect(receivedMessage).toEqual({ type: 'test', data: 'hello' })
  })
  
  it('should handle connection errors', async () => {
    const errorPromise = new Promise((resolve) => {
      wsClient.on('error', resolve)
    })
    
    // 尝试连接到无效的 URL
    wsClient = createWebSocketClient('ws://invalid-url:9999')
    
    try {
      await wsClient.connect()
    } catch (error) {
      // 预期会失败
    }
    
    const error = await errorPromise
    expect(error).toBeDefined()
  })
})
```

### 调试工具

```typescript
const wsClient = createWebSocketClient('ws://localhost:3000/ws', {
  // 启用调试模式
  debug: {
    enabled: true,
    logMessages: true,
    logEvents: true,
    logPerformance: true
  }
})

// 在浏览器控制台中查看详细日志
wsClient.on('debug', (info) => {
  console.group('WebSocket Debug')
  console.log('Type:', info.type)
  console.log('Data:', info.data)
  console.log('Timestamp:', info.timestamp)
  console.groupEnd()
})

// 获取调试信息
const debugInfo = wsClient.getDebugInfo()
console.log('Debug info:', debugInfo)
```

## 📱 实际应用示例

### 实时聊天应用

```typescript
class ChatClient {
  private wsClient: any
  
  constructor(serverUrl: string, token: string) {
    this.wsClient = createWebSocketClient(`${serverUrl}/chat`, {
      autoReconnect: true,
      headers: { Authorization: `Bearer ${token}` }
    })
    
    this.setupEventHandlers()
  }
  
  private setupEventHandlers() {
    this.wsClient.on('open', () => {
      console.log('Chat connected')
      this.joinRoom('general')
    })
    
    this.wsClient.on('message', (data) => {
      this.handleMessage(data)
    })
    
    this.wsClient.on('room_message', (roomName, message) => {
      this.displayMessage(roomName, message)
    })
  }
  
  private handleMessage(data: any) {
    switch (data.type) {
      case 'user_joined':
        this.showUserJoined(data.user)
        break
        
      case 'user_left':
        this.showUserLeft(data.user)
        break
        
      case 'typing_start':
        this.showTypingIndicator(data.user)
        break
        
      case 'typing_stop':
        this.hideTypingIndicator(data.user)
        break
    }
  }
  
  public sendMessage(roomName: string, message: string) {
    this.wsClient.send({
      type: 'chat_message',
      room: roomName,
      message,
      timestamp: Date.now()
    })
  }
  
  public startTyping(roomName: string) {
    this.wsClient.send({
      type: 'typing_start',
      room: roomName
    })
  }
  
  public stopTyping(roomName: string) {
    this.wsClient.send({
      type: 'typing_stop',
      room: roomName
    })
  }
  
  private displayMessage(roomName: string, message: any) {
    // 在 UI 中显示消息
    const messageElement = document.createElement('div')
    messageElement.textContent = `${message.user}: ${message.message}`
    document.getElementById(`room-${roomName}`)?.appendChild(messageElement)
  }
  
  private showUserJoined(user: any) {
    console.log(`${user.name} joined the chat`)
  }
  
  private showUserLeft(user: any) {
    console.log(`${user.name} left the chat`)
  }
  
  private showTypingIndicator(user: any) {
    console.log(`${user.name} is typing...`)
  }
  
  private hideTypingIndicator(user: any) {
    console.log(`${user.name} stopped typing`)
  }
}

// 使用聊天客户端
const chatClient = new ChatClient('ws://localhost:3000', 'user-token')

// 发送消息
document.getElementById('send-button')?.addEventListener('click', () => {
  const messageInput = document.getElementById('message-input') as HTMLInputElement
  const message = messageInput.value
  
  if (message.trim()) {
    chatClient.sendMessage('general', message)
    messageInput.value = ''
  }
})

// 输入指示器
let typingTimeout: NodeJS.Timeout
document.getElementById('message-input')?.addEventListener('input', () => {
  chatClient.startTyping('general')
  
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    chatClient.stopTyping('general')
  }, 1000)
})
```

## 📝 WebSocket 最佳实践

### 1. 连接管理
- 实现适当的重连策略
- 监控连接状态
- 处理连接错误

### 2. 消息处理
- 使用类型安全的消息格式
- 实现消息验证
- 处理消息队列

### 3. 性能优化
- 使用消息批处理
- 实现心跳机制
- 监控性能指标

### 4. 安全性
- 实现适当的认证
- 验证消息来源
- 加密敏感数据

### 5. 用户体验
- 显示连接状态
- 提供重连选项
- 实现优雅降级

## 🔗 相关链接

- [类型安全客户端概述](/api-client/treaty/overview) - 了解基本概念
- [配置选项](/api-client/treaty/config) - 学习 WebSocket 配置
- [参数处理](/api-client/treaty/parameters) - 了解消息参数
- [响应处理](/api-client/treaty/response) - 处理 WebSocket 响应
- [单元测试](/api-client/treaty/unit-test) - 测试 WebSocket 功能

## 📚 下一步

现在您已经了解了 Vafast 类型安全客户端的 WebSocket 支持，接下来可以：

1. **编写测试** - 验证 WebSocket 功能的正确性
2. **性能优化** - 优化 WebSocket 连接和消息处理
3. **安全加固** - 增强 WebSocket 安全性
4. **监控告警** - 实现 WebSocket 监控系统
5. **实际应用** - 在项目中使用 WebSocket 功能

如果您有任何问题或需要帮助，请查看我们的 [GitHub 仓库](https://github.com/vafast/vafast) 或 [社区页面](/community)。
