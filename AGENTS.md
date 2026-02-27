# AGENTS.md - Agent Coding Guidelines

This document provides guidelines for agents working in this repository.

## Project Overview

- **Runtime**: Bun (v1.3.9)
- **Language**: TypeScript
- **Framework**: Hono (server), WXT (browser extension), React (extension UI)
- **Database**: LanceDB
- **Linting/Formatting**: Oxlint + Oxfmt

## Available Commands

### Root Commands
```bash
bun run dev              # Start all applications in dev mode
bun run build            # Build all applications
bun run check-types      # TypeScript type checking across all apps
bun run check            # Run oxlint and oxfmt with auto-fix
```

### Server Commands (apps/server)
```bash
cd apps/server
bun run dev              # Start server with hot reload
bun run build            # Build with tsdown
bun run check-types      # TypeScript check (tsc -b)
bun run compile          # Compile to standalone binary
bun run start            # Start production server
```

### Extension Commands (apps/extension)
```bash
cd apps/extension
bun run dev              # Start extension dev server
bun run dev:firefox      # Dev with Firefox
bun run build            # Build extension
bun run build:firefox    # Build for Firefox
bun run zip              # Create zip bundle
bun run compile          # TypeScript check
```

## Project Structure

```
job-auto-apply/
├── apps/
│   ├── server/          # Backend API (Hono, port from env.PORT)
│   │   ├── src/
│   │   │   ├── db/      # Database (LanceDB)
│   │   │   ├── routes/  # API route handlers
│   │   │   ├── lib/     # Business logic
│   │   │   └── types/   # TypeScript types
│   │   └── package.json
│   └── extension/       # Browser extension (WXT + React)
│       ├── entrypoints/ # Extension entry points
│       ├── hooks/       # React hooks
│       └── package.json
├── packages/
│   ├── env/             # Environment validation (Zod)
│   └── config/          # Shared config
├── package.json         # Monorepo root
└── tsconfig.json
```

## Code Style Guidelines

### Imports
- Use explicit relative imports (e.g., `@job-auto-apply/env/server`)
- Group imports: external libs, then internal modules
- Use TypeScript path aliases defined in tsconfig

### Naming Conventions
- **Files**: kebab-case (e.g., `cover-letters.ts`, `lancedb.ts`)
- **Interfaces/Types**: PascalCase (e.g., `FieldMapping`, `DetectionResult`)
- **Variables/Functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **API Routes**: kebab-case for URL paths (e.g., `/api/cover-letters`)

### TypeScript
- Enable `strict: true` in tsconfig
- Use explicit types for function parameters and return types
- Use `zod` for runtime validation (via `@job-auto-apply/env`)
- Avoid `any` - use `unknown` if type is truly unknown
- Use BigInt for timestamp columns in database operations

### Error Handling
- Return proper HTTP status codes (200, 201, 400, 404, 500)
- Use try-catch blocks for async operations
- Log errors with contextual information
- Handle database initialization failures gracefully

### API Design (Hono)
- Use `c.req.json()` for request body parsing
- Use `c.req.param()` for path parameters
- Use `c.req.query()` for query parameters
- Return JSON responses with `c.json()`
- Use async handlers for database operations

### Extension Development (WXT)
- Use `defineContentScript()` for content scripts
- Use `browser.runtime.sendMessage()` for cross-context communication
- Handle shadow DOM in form detection
- Implement MutationObserver for dynamic forms

### React (Extension UI)
- Use functional components with hooks
- Follow React 19 patterns
- Use `clsx` and `tailwind-merge` for className composition

### Database (LanceDB)
- Use BigInt for timestamps
- Filter out `__init__` placeholder records
- Sort by date descending for lists

## Environment Variables

Server requires:
- `PORT` - Server port
- `CORS_ORIGIN` - Allowed CORS origin
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `QWEN_API_KEY` - AI providers

Use `@job-auto-apply/env/server` for validation:
```typescript
import { env } from "@job-auto-apply/env/server";
```

## Linting & Formatting

Run before committing:
```bash
bun run check
```

This runs:
- `oxlint` - Linting
- `oxfmt --write` - Auto-formatting

## Testing

No test framework is currently configured. Do not add tests unless explicitly requested.

## Important Notes

- This is a monorepo using Bun workspaces
- Use `workspace:*` for internal package dependencies
- The server uses Hono for REST API endpoints
- The extension detects job application forms and auto-fills them
- Forms are extracted including shadow DOM
- Honeypot field detection is implemented to avoid spam traps
