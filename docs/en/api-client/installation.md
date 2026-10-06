---
title: Installation - Vafast API Client
description: 'Install and set up @vafast/api-client: add the package, create a client, infer route types from the server with InferEden or sync them with the Vafast CLI.'
---

# Installation

## Install

::: code-group

```bash [npm]
npm install @vafast/api-client
```

```bash [pnpm]
pnpm add @vafast/api-client
```

```bash [yarn]
yarn add @vafast/api-client
```

```bash [bun]
bun add @vafast/api-client
```

:::

## Requirements

- Node.js 18+ / Bun 1+ / modern browsers (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- TypeScript 5+ (recommended)

## Quick Check

```typescript
import { createClient, eden } from '@vafast/api-client'

// In real projects, generate types with the CLI or define the contract yourself
type Api = {
  users: {
    get: { query?: { page?: number }; return: { users: string[] } }
  }
}

const api = eden<Api>(createClient('http://localhost:3000'))

const { data, error } = await api.users.get({ page: 1 })

if (error) {
  console.error(`${error.code}: ${error.message}`)
} else {
  console.log(data.users)
}
```

## Sync Types from the Server (Recommended)

When your backend is Vafast, generate a type-safe client with the CLI:

```bash
npx vafast sync --url http://localhost:3000 --out src/api.generated.ts
```

```typescript
import { createClient } from '@vafast/api-client'
import { createApiClient } from './api.generated'

const api = createApiClient(createClient({ baseURL: '/api', timeout: 30_000 }))

const { data, error } = await api.users.get()
if (error) return
console.log(data)
```

See [CLI Tool](/en/tools/cli) for details.

## Environment Variables

```typescript
import { createClient, eden } from '@vafast/api-client'

const client = createClient({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30_000),
})
```

## Next Steps

- [Basic Usage](/en/api-client/fetch) — chained calls, error handling, middleware
- [Advanced Usage](/en/api-client/advanced) — multi-tenancy, refresh queues, multiple services
- [Overview](/en/api-client/overview) — feature overview and SSE
- [Testing](/en/api-client/test) — test the client with `server.fetch` / mocks
