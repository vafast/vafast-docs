---
title: Scaffolding Tool - Vafast
description: 'create-vafast-app: scaffold a ready-to-run Vafast project with TypeScript config, dev and build scripts, example routes and AI rules for Cursor, Copilot and Claude.'
---

# Scaffolding Tool

`create-vafast-app` is the official Vafast project scaffolding tool for quickly creating a ready-to-use Vafast project.

## Quick Start

```bash
npx create-vafast-app
```

Or use npm/pnpm/yarn:

```bash
npm create vafast-app
pnpm create vafast-app
yarn create vafast-app
```

Enter a project name when prompted, then:

```bash
cd my-vafast-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see "Hello Vafast!".

## Generated Project Structure

The scaffold generates a complete, ready-to-use Vafast project:

```
my-vafast-app/
├── .cursor/
│   └── rules/
│       ├── vafast.mdc        # Cursor AI rules
│       └── typescript.mdc    # TypeScript conventions
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot instructions
├── src/
│   └── index.ts              # app entry
├── AGENTS.md                 # AI development guide (OpenAI Codex)
├── CLAUDE.md                 # Claude project rules
├── package.json              # dependencies and scripts
└── tsconfig.json             # TypeScript config
```

## Core Features

### 1. Ready to Use

The generated project includes:

- ✅ **Complete TypeScript config** - a ready-to-use tsconfig.json
- ✅ **Dev script** - `npm run dev` starts the dev server
- ✅ **Build script** - `npm run build` builds for production
- ✅ **Example route** - a simple Hello World route

### 2. AI Development Support

The scaffold ships config files for several AI tools, so Cursor, GitHub Copilot, Claude and others understand Vafast better:

| File | Supported AI tool |
|------|---------------|
| `.cursor/rules/*.mdc` | Cursor |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `AGENTS.md` | OpenAI Codex, GitHub Copilot Agent |
| `CLAUDE.md` | Claude |

The AI will automatically learn:

- ✅ Vafast route definition patterns (`defineRoute` + `defineRoutes`)
- ✅ TypeBox schema usage
- ✅ Middleware conventions (`defineMiddleware`)
- ✅ SSE streaming (`sse: true`)
- ✅ Error handling best practices (the `err` helpers)
- ✅ API client usage (`@vafast/api-client`)

### 3. Zero Config

The generated project runs without any extra configuration:

```typescript
// src/index.ts
import { Server, defineRoute, defineRoutes, serve } from 'vafast'

const routes = defineRoutes([
  defineRoute({
    method: 'GET',
    path: '/',
    handler: () => 'Hello Vafast!'
  })
])

const server = new Server(routes)
serve({ fetch: server.fetch, port: 3000 }, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`)
})
```

### 4. Type Safety

The project is set up with full TypeScript support:

- ✅ Strict type checking
- ✅ Automatic type inference
- ✅ End-to-end type safety (with `@vafast/api-client`)

## Use Cases

### Rapid Prototyping

```bash
npx create-vafast-app my-prototype
cd my-prototype
npm run dev
```

### Learning Vafast

The generated project includes best-practice examples, making it a great starting point for learning Vafast.

### Team Collaboration

The built-in AI config files ensure team members get a consistent code style and best practices when using AI tools.

## Global Installation (Optional)

If you want to install it globally:

```bash
npm install -g create-vafast-app
```

Then run:

```bash
create-vafast-app
```

## Project Scripts

The generated project includes these scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "tsc",
    "serve": "node dist/index.js"
  }
}
```

- `npm run dev` - development mode with hot reload
- `npm start` - run in production mode
- `npm run build` - compile TypeScript
- `npm run serve` - run the compiled code

## Next Steps

After creating the project, you can:

1. **Add routes** - add more routes in `src/index.ts`
2. **Add middleware** - create middleware with `defineMiddleware`
3. **Add schema validation** - define validation rules with TypeBox
4. **Integrate a database** - see the [Prisma integration](/en/integrations/prisma) or the [Drizzle integration](/en/integrations/drizzle)
5. **Use the API client** - see the [API client docs](/en/api-client/overview)

## Related Links

- [Quick Start](/en/quick-start) - learn how to get started with Vafast
- [Routing Guide](/en/routing) - learn how to define routes
- [Middleware System](/en/middleware) - learn how middleware works
- [GitHub repository](https://github.com/vafast/create-vafast-app) - source code and issue tracker
