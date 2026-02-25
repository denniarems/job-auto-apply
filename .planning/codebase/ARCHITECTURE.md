# Architecture

**Analysis Date:** 2024-05-18

## Pattern Overview

**Overall:** Monorepo / Client-Server

**Key Characteristics:**
- Bun Workspaces monorepo dividing code into `apps` (deployable units) and `packages` (shared logic).
- Backend API built with the lightweight Hono framework running on Bun.
- Type-safe environment configuration extracted into a shared package using Zod and `@t3-oss/env-core`.
- Extension client scaffolding structure using WXT (Web Extension Toolkit).

## Layers

**Environment Variables Validation:**
- Purpose: Ensures all required environment variables are present and typed correctly at application startup.
- Location: `packages/env`
- Contains: Zod schemas (`src/server.ts`).
- Depends on: `zod`, `@t3-oss/env-core`, `dotenv`.
- Used by: `apps/server`.

**Backend Server:**
- Purpose: Provides the core API endpoints for the extension, utilizing Hono.
- Location: `apps/server`
- Contains: Hono app configuration, CORS setup, and route handlers.
- Depends on: `hono`, `@job-auto-apply/env`.
- Used by: Browser Extension (Client).

**Extension Client:**
- Purpose: Chrome Extension handling user interaction and DOM manipulation (planned).
- Location: `apps/extension`
- Contains: Initial WXT project scaffolding.
- Depends on: Shared configurations.
- Used by: End users in the browser.

## Data Flow

**Bootstrapping the Server:**
1. Bun process starts `apps/server/src/index.ts`.
2. Server imports environment variables from `@job-auto-apply/env/server`.
3. The `@t3-oss/env-core` library reads process variables and parses them against Zod schemas.
4. If validation passes, typed `env` variables are available; otherwise, the boot process throws an error.
5. Hono app instance is created using validated `env.CORS_ORIGIN`.

**State Management:**
- Not currently implemented in the codebase (planned use of LanceDB for state/memories).

## Key Abstractions

**Environment Config:**
- Purpose: Strongly-typed access to process variables.
- Examples: `packages/env/src/server.ts`
- Pattern: Schema validation on module load, throwing early if misconfigured.

## Entry Points

**Backend API Entry:**
- Location: `apps/server/src/index.ts`
- Triggers: Bun script runner (`bun run dev`).
- Responsibilities: Initializes Hono framework, applies global middlewares (Logger, CORS), and registers base routes.

## Error Handling

**Strategy:** Fail-fast on startup

**Patterns:**
- Environment schemas enforce strict constraints (e.g. `z.url()`) and will throw validation errors during startup to prevent undefined runtime states.

## Cross-Cutting Concerns

**Logging:** Uses Hono's built-in global logger middleware (`app.use(logger())`).
**Validation:** Centralized schema-based validation using Zod for environmental dependencies.
**Authentication:** Not implemented (intended for local-only use as per PRD).

---

*Architecture analysis: 2024-05-18*