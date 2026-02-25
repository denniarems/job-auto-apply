# Technology Stack

**Analysis Date:** 2025-02-18

## Languages

**Primary:**
- TypeScript `^5.0.0` - Used across the monorepo (`apps/server`, `packages/*`, and planned extension)
- JavaScript - DOM Manipulation / Scripting

## Runtime

**Environment:**
- Bun `^1.3.9`

**Package Manager:**
- Bun Workspaces
- Lockfile: present (`bun.lock`)

## Frameworks

**Core:**
- Hono `^4.8.2` - Lightweight API server framework used in `apps/server/src/index.ts`
- WXT `^0.19.0` - Chrome extension development framework (Planned per `prd.md`)
- React `^18.0.0` - Extension UI (Planned per `prd.md`)

**Testing:**
- Bun Test / Vitest - Test runners (Planned per `prd.md`)

**Build/Dev:**
- tsdown `^0.16.5` - Build tool for the Hono server (`apps/server/tsdown.config.ts`)
- oxlint `^1.41.0` - Fast TypeScript/JavaScript linter (`.oxlintrc.json`)
- oxfmt `^0.26.0` - Code formatting (`.oxfmtrc.json`)

## Key Dependencies

**Critical:**
- @t3-oss/env-core `^0.13.1` - Environment variable validation (`packages/env/src/server.ts`)
- zod `^4.1.13` - Schema validation for environment variables
- dotenv `^17.2.2` - Environment variable loading

**Infrastructure:**
- Zvec `^0.1.0` - Local vector storage (Planned per `prd.md`)
- Vercel AI SDK `^3.0.0` - Unified AI provider interface (Planned per `prd.md`)

## Configuration

**Environment:**
- Managed via `@job-auto-apply/env` package using `@t3-oss/env-core` and `zod`.
- Requires `CORS_ORIGIN` and `NODE_ENV` configuration (`packages/env/src/server.ts`).

**Build:**
- Root `package.json` manages workspaces for `apps/*` and `packages/*`.
- `tsdown.config.ts` used for backend builds.
- Base TypeScript configuration provided via `@job-auto-apply/config` workspace package.

## Platform Requirements

**Development:**
- Bun runtime
- Chrome Browser (for extension testing)

**Production:**
- Local Node.js / Bun execution for backend server
- Chrome Extension (Manifest V3) for frontend

---

*Stack analysis: 2025-02-18*