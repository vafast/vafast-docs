---
title: Expo Integration - Vafast
description: 'Guide to integrating Vafast with Expo React Native: create a type-safe Vafast API client, API service functions and React hooks to back cross-platform mobile apps.'
---

# Expo Integration

Vafast integrates seamlessly with Expo React Native apps, giving you a powerful backend API and a cross-platform mobile development experience.

## Project Structure

```
my-vafast-expo-app/
├── app/                     # Expo Router app
├── src/
│   ├── components/          # React Native components
│   ├── screens/             # app screens
│   ├── api/                 # Vafast API client
│   │   ├── client.ts        # API client config
│   │   ├── types.ts         # type definitions
│   │   └── hooks.ts         # React Hooks
│   └── lib/                 # shared libraries
├── package.json
├── app.json
└── tsconfig.json
```

## Installing Dependencies

```bash
npm install vafast @vafast/api-client
npm install -D @types/react @types/react-native
```

## Creating the Vafast API Client

```typescript
// src/api/client.ts
import { VafastApiClient } from '@vafast/api-client'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const apiClient = new VafastApiClient({
  baseURL: API_BASE_URL,
  timeout: 10000,
  retries: 3,
  
  // request interceptor
  interceptors: {
    request: (config) => {
      // add the auth header
      const token = getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    
    response: (response) => {
      // handle the response
      return response
    },
    
    error: (error) => {
      // handle errors
      if (error.status === 401) {
        // clear auth state and redirect to login
        clearAuthToken()
        // redirect to the login page
      }
      return Promise.reject(error)
    }
  }
})

// auth token management
function getAuthToken(): string | null {
  // read the token from AsyncStorage or another store
  return null
}

function clearAuthToken() {
  // clear the stored token
}
```

## Type Definitions

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

## API Service Functions

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

// auth hook
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
      // save the token to storage
      return response
    } catch (err: any) {
      setError(err.message || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      setUser(null)
      // clear the stored token
    } catch (err) {
      console.error('Logout failed:', err)
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

// post list hook
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
      setError(err.message || 'Failed to fetch posts')
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

// single post hook
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
      setError(err.message || 'Failed to fetch post')
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

## Using It in Components

### Login Screen

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
      Alert.alert('Error', 'Please enter your email and password')
      return
    }

    try {
      await login({ email, password })
      // navigate to the main screen after logging in
    } catch (err: any) {
      Alert.alert('Login failed', err.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
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
          {loading ? 'Logging in...' : 'Log In'}
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

### Post List Screen

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
          <Text style={styles.retryButtonText}>Retry</Text>
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
              <Text>Loading more...</Text>
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

## Environment Configuration

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

## Error Handling

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
  let message = 'An unknown error occurred'
  let statusCode = 500

  if (error instanceof ApiError) {
    message = error.message
    statusCode = error.statusCode
  } else if (error.response) {
    message = error.response.data?.message || 'Request failed'
    statusCode = error.response.status
  } else if (error.request) {
    message = 'Network connection failed, please check your network settings'
  } else if (error.message) {
    message = error.message
  }

  if (showAlert) {
    Alert.alert('Error', message)
  }

  return new ApiError(statusCode, message, error)
}
```

## Best Practices

1. **Type safety**: use TypeScript to keep frontend and backend types consistent
2. **Error handling**: implement a unified error handling mechanism
3. **State management**: manage API state with React hooks
4. **Caching**: implement appropriate caching and offline support
5. **Network status**: handle changes in network connectivity
6. **Performance**: use FlatList to optimize long lists
7. **User experience**: provide loading states and error feedback

## Related Links

- [Vafast docs](/en/quick-start) - quick start guide
- [Expo docs](https://docs.expo.dev) - official Expo documentation
- [React Native docs](https://reactnative.dev) - official React Native documentation
- [API client](/en/api-client/overview) - Vafast API client guide
- [Type validation](/en/patterns/type) - learn about the type validation system
