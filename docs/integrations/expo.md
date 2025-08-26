---
title: Expo 集成 - Vafast
head:
  - - meta
    - property: 'og:title'
      content: Expo 集成 - Vafast

  - - meta
    - name: 'description'
      content: 在 Expo React Native 应用中集成 Vafast 框架，实现跨平台移动应用开发。

  - - meta
    - property: 'og:description'
      content: 在 Expo React Native 应用中集成 Vafast 框架，实现跨平台移动应用开发。
---

# Expo 集成

Vafast 可以与 Expo React Native 应用无缝集成，为您提供强大的后端 API 和跨平台移动应用开发体验。

## 项目结构

```
my-vafast-expo-app/
├── app/                     # Expo Router 应用
├── src/
│   ├── components/          # React Native 组件
│   ├── screens/             # 应用屏幕
│   ├── api/                 # Vafast API 客户端
│   │   ├── client.ts        # API 客户端配置
│   │   ├── types.ts         # 类型定义
│   │   └── hooks.ts         # React Hooks
│   └── lib/                 # 共享库
├── package.json
├── app.json
└── tsconfig.json
```

## 安装依赖

```bash
bun add vafast @vafast/api-client
bun add -D @types/react @types/react-native
```

## 创建 Vafast API 客户端

```typescript
// src/api/client.ts
import { VafastApiClient } from '@vafast/api-client'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const apiClient = new VafastApiClient({
  baseURL: API_BASE_URL,
  timeout: 10000,
  retries: 3,
  
  // 请求拦截器
  interceptors: {
    request: (config) => {
      // 添加认证头
      const token = getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    
    response: (response) => {
      // 处理响应
      return response
    },
    
    error: (error) => {
      // 处理错误
      if (error.status === 401) {
        // 清除认证状态并重定向到登录
        clearAuthToken()
        // 重定向到登录页面
      }
      return Promise.reject(error)
    }
  }
})

// 认证 token 管理
function getAuthToken(): string | null {
  // 从 AsyncStorage 或其他存储中获取 token
  return null
}

function clearAuthToken() {
  // 清除存储的 token
}
```

## 类型定义

```typescript
// src/api/types.ts
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  author: User
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  title: string
  content: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
```

## API 服务函数

```typescript
// src/api/services.ts
import { apiClient } from './client'
import type { 
  User, 
  Post, 
  CreatePostRequest, 
  LoginRequest, 
  LoginResponse,
  ApiResponse 
} from './types'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    return response.data
  },
  
  async register(userData: Omit<User, 'id' | 'createdAt'>): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', userData)
    return response.data
  },
  
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },
  
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile')
    return response.data.data
  }
}

export const postService = {
  async getPosts(page = 1, limit = 10): Promise<Post[]> {
    const response = await apiClient.get<ApiResponse<Post[]>>('/posts', {
      page,
      limit
    })
    return response.data.data
  },
  
  async getPost(id: string): Promise<Post> {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`)
    return response.data.data
  },
  
  async createPost(postData: CreatePostRequest): Promise<Post> {
    const response = await apiClient.post<ApiResponse<Post>>('/posts', postData)
    return response.data.data
  },
  
  async updatePost(id: string, postData: Partial<CreatePostRequest>): Promise<Post> {
    const response = await apiClient.put<ApiResponse<Post>>(`/posts/${id}`, postData)
    return response.data.data
  },
  
  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/posts/${id}`)
  }
}

export const userService = {
  async getUsers(page = 1, limit = 20): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', {
      page,
      limit
    })
    return response.data.data
  },
  
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return response.data.data
  },
  
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/users/profile', userData)
    return response.data.data
  }
}
```

## React Hooks

```typescript
// src/api/hooks.ts
import { useState, useEffect, useCallback } from 'react'
import { authService, postService, userService } from './services'
import type { User, Post, CreatePostRequest, LoginRequest } from './types'

// 认证 Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setLoading(true)
      setError(null)
      const response = await authService.login(credentials)
      setUser(response.user)
      // 保存 token 到存储
      return response
    } catch (err: any) {
      setError(err.message || '登录失败')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      setUser(null)
      // 清除存储的 token
    } catch (err) {
      console.error('登出失败:', err)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      const profile = await authService.getProfile()
      setUser(profile)
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user
  }
}

// 文章列表 Hook
export const usePosts = (page = 1, limit = 10) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = useCallback(async (pageNum = page) => {
    try {
      setLoading(true)
      setError(null)
      const newPosts = await postService.getPosts(pageNum, limit)
      
      if (pageNum === 1) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      
      setHasMore(newPosts.length === limit)
    } catch (err: any) {
      setError(err.message || '获取文章失败')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  const refresh = useCallback(() => {
    fetchPosts(1)
  }, [fetchPosts])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(Math.floor(posts.length / limit) + 1)
    }
  }, [loading, hasMore, posts.length, limit, fetchPosts])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  return {
    posts,
    loading,
    error,
    hasMore,
    refresh,
    loadMore
  }
}

// 单个文章 Hook
export const usePost = (id: string) => {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const postData = await postService.getPost(id)
      setPost(postData)
    } catch (err: any) {
      setError(err.message || '获取文章失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id, fetchPost])

  return {
    post,
    loading,
    error,
    refresh: fetchPost
  }
}
```

## 在组件中使用

### 登录屏幕

```typescript
// src/screens/LoginScreen.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native'
import { useAuth } from '../api/hooks'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请填写邮箱和密码')
      return
    }

    try {
      await login({ email, password })
      // 登录成功后导航到主页面
    } catch (err: any) {
      Alert.alert('登录失败', err.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>登录</Text>
      
      <TextInput
        style={styles.input}
        placeholder="邮箱"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? '登录中...' : '登录'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15
  }
})
```

### 文章列表屏幕

```typescript
// src/screens/PostsScreen.tsx
import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native'
import { usePosts } from '../api/hooks'
import type { Post } from '../api/types'

export default function PostsScreen({ navigation }: any) {
  const { posts, loading, error, hasMore, refresh, loadMore } = usePosts()

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetail', { id: item.id })}
    >
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.postMeta}>
        <Text style={styles.author}>by {item.author.name}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadingMore}>
              <Text>加载更多...</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  postCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  author: {
    fontSize: 12,
    color: '#999'
  },
  date: {
    fontSize: 12,
    color: '#999'
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center'
  }
})
```

## 环境配置

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vafast Expo App',
  slug: 'vafast-expo-app',
  
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
  },
  
  plugins: [
    'expo-router'
  ]
})
```

## 错误处理

```typescript
// src/api/errorHandler.ts
import { Alert } from 'react-native'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const handleApiError = (error: any, showAlert = true) => {
  let message = '发生未知错误'
  let statusCode = 500

  if (error instanceof ApiError) {
    message = error.message
    statusCode = error.statusCode
  } else if (error.response) {
    message = error.response.data?.message || '请求失败'
    statusCode = error.response.status
  } else if (error.request) {
    message = '网络连接失败，请检查网络设置'
  } else if (error.message) {
    message = error.message
  }

  if (showAlert) {
    Alert.alert('错误', message)
  }

  return new ApiError(statusCode, message, error)
}
```

## 最佳实践

1. **类型安全**：使用 TypeScript 确保前后端类型一致
2. **错误处理**：实现统一的错误处理机制
3. **状态管理**：使用 React Hooks 管理 API 状态
4. **缓存策略**：实现适当的缓存和离线支持
5. **网络状态**：处理网络连接状态变化
6. **性能优化**：使用 FlatList 优化长列表性能
7. **用户体验**：提供加载状态和错误反馈

## 相关链接

- [Vafast 文档](/getting-started/quickstart) - 快速开始指南
- [Expo 文档](https://docs.expo.dev) - Expo 官方文档
- [React Native 文档](https://reactnative.dev) - React Native 官方文档
- [API 客户端](/api-client/overview) - Vafast API 客户端指南
- [类型验证](/patterns/type) - 了解类型验证系统
