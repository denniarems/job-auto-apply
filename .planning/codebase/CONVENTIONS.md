# Coding Conventions

**Analysis Date:** 2025-01-20

## Naming Patterns

**Files:**
- TypeScript modules: `kebab-case.ts` or `kebab-case/index.ts` (e.g., `packages/env/src/server.ts`)
- Entry points: `index.ts` (e.g., `apps/server/src/index.ts`)

**Directories:**
- Directories: `kebab-case` (e.g., `job-auto-apply`, `apps/server`, `apps/extension`, `packages/env`)

## Code Style

**Formatting:**
- Tool: `oxfmt`
- Configured in: `.`oxfmtrc.json`
- Command: `bun run check` (runs `oxfmt --write`)

**Linting:**
- Tool: `oxlint`
- Configured in: `.oxlintrc.json`
- Settings include React and Vitest environment configurations.
- Command: `bun run check` (runs `oxlint`)

## Monorepo & Dependencies

**Structure:**
- Monorepo using Bun Workspaces.
- Packages organized into `apps/*` and `packages/*`.
- Root configuration in `package.json` utilizing Bun's `catalog:` feature for shared dependency versions (e.g., `zod`, `typescript`, `dotenv`).

## Import Organization

**Patterns:**
- External packages first (e.g., `import { Hono } from "hono";`).
- Internal monorepo packages using workspace aliases (e.g., `import { env } from "@job-auto-apply/env/server";`).
- Environment variables are centralized and loaded via `@t3-oss/env-core` rather than raw `process.env`.

## Error Handling & Validation

**Patterns:**
- Environment validation is strictly enforced at startup using Zod and `@t3-oss/env-core`.
- Defined in: `packages/env/src/server.ts`
- Variables must be declared in the schema or the application will fail to start.

## Logging

**Framework:** `hono/logger`

**Patterns:**
- Server uses Hono's built-in logger middleware: `app.use(logger());` in `apps/server/src/index.ts`.

## Module Design

**Configuration Exports:**
- Environment definitions are cleanly exported from shared packages to be consumed by apps. Example: `export const env = createEnv({...});` in `packages/env/src/server.ts`.

---

*Convention analysis: 2025-01-20*