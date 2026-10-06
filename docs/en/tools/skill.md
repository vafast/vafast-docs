---
title: Claude Skill - Vafast
description: 'The Vafast Skill for the Claude CLI: install it so Claude understands Vafast routes, TypeBox schemas, middleware, SSE, error handling and the API client.'
---

# Claude Skill

Vafast Skill provides Vafast framework development rules for the Claude CLI, so the AI better understands how to write Vafast code and its best practices.

## What Is a Skill?

A Skill is the Claude CLI's extension mechanism. Once installed, the AI automatically understands the best practices of a specific framework or domain. With the Vafast Skill installed, Claude automatically understands:

- ✅ **Route definitions** - the `defineRoute` + `defineRoutes` pattern
- ✅ **Schema validation** - TypeBox type definitions
- ✅ **Middleware** - the type-safe `defineMiddleware` pattern
- ✅ **SSE** - `sse: true` streaming responses
- ✅ **Error handling** - `throw err.*` on the server; `{ data, error }` on the client
- ✅ **API client** - using `@vafast/api-client`

## Installation

### Option 1: Install from a File

```bash
# after downloading the vafast.skill file
codex skill install vafast.skill
```

### Option 2: Install from GitHub

```bash
# clone the repository
git clone https://github.com/vafast/vafast-skill.git

# install
codex skill install vafast-skill/vafast.skill
```

## Usage

After installing, just use `@vafast` in a Claude CLI conversation:

```
@vafast Help me create a user management API

@vafast How do I define an SSE streaming response?

@vafast Write a middleware with authentication
```

## Examples

### Creating Routes

```typescript
import { defineRoute, defineRoutes, Type } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/users',
    name: 'get_users',
    description: 'Get the user list',
    schema: {
      query: Type.Object({
        page: Type.Number(),
        limit: Type.Optional(Type.Number()),
      })
    },
    handler: ({ query }) => ({
      users: [],
      page: query.page,
    })
  })
])
```

### Middleware

```typescript
import { defineMiddleware } from 'vafast'

const authMiddleware = defineMiddleware<{ user: User }>(async (req, next) => {
  const user = await verifyToken(req)
  return next({ user })
})
```

### SSE Streaming

```typescript
import { defineRoute } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/stream',
  sse: true,
  handler: async function* () {
    yield { status: 'start' }
    yield { text: 'chunk' }
    yield { status: 'end' }
  },
})
```

### Error Handling

```typescript
import { err } from 'vafast'

defineRoute({
  method: 'GET',
  path: '/users/:id',
  handler: ({ params }) => {
    const user = findUser(params.id)
    if (!user) {
      throw err.notFound('User not found')
    }
    return user
  }
})
```

### API Client

```typescript
import { eden, InferEden } from '@vafast/api-client'
import type { AppRoutes } from './server'

type Api = InferEden<AppRoutes>
const api = eden<Api>('http://localhost:3000')

// type-safe calls
const { data, error } = await api.users.get({ page: 1 })
```

## Skill Contents

Once installed, the Claude CLI understands the following Vafast features:

### Route Definition Patterns

- Use `defineRoute` to define a single route
- Use `defineRoutes` to define an array of routes
- Supports nested route structures
- Supports extension fields (webhooks, permissions, billing, etc.)

### Schema Validation

- TypeBox type definitions
- Built-in format validators (email, uuid, phone, etc.)
- Runtime validation + compile-time type inference

### Middleware System

- `defineMiddleware` for type-safe middleware
- Type injection (`withContext`)
- Global and route-level middleware

### Error Handling

- Server: semantic errors such as `throw err.notFound(...)`
- Client (api-client): consume results as `{ data, error }`
- A unified error response format

### API Client

- `InferEden` infers types from route definitions automatically
- `eden` creates a type-safe client
- End-to-end type sync

## Files

```
vafast-skill/
├── SKILL.md              # main rules file (read by the Claude CLI)
├── references/
│   └── schema.md         # detailed TypeBox reference
├── vafast.skill          # packaged file (distributable)
└── README.md             # project readme
```

## Related Links

- [Vafast framework](https://github.com/vafast/vafast)
- [Vafast docs](https://vafast.dev)
- [@vafast/api-client](https://github.com/vafast/vafast-api-client)
- [create-vafast-app](https://github.com/vafast/create-vafast-app)
- [GitHub repository](https://github.com/vafast/vafast-skill)
