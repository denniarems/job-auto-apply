# Codebase Structure

**Analysis Date:** 2024-05-18

## Directory Layout

```
job-auto-apply/
├── apps/               # Deployable applications
│   ├── extension/      # Chrome Extension (WXT based)
│   └── server/         # Backend API Server (Hono)
├── packages/           # Shared monorepo packages
│   ├── config/         # Shared TypeScript configuration
│   └── env/            # Environment variables definition
├── bun.lock            # Bun package lockfile
├── package.json        # Root workspace configuration
└── tsconfig.json       # Root TypeScript project reference
```

## Directory Purposes

**`apps/`:**
- Purpose: Contains independent, executable application code.
- Contains: `server` (Hono API) and `extension` (Chrome WXT).
- Key files: `apps/server/src/index.ts`

**`packages/`:**
- Purpose: Contains reusable code, types, and configurations shared across the workspace.
- Contains: `config` (base TS configs) and `env` (Zod schemas).
- Key files: `packages/env/src/server.ts`, `packages/config/tsconfig.base.json`

## Key File Locations

**Entry Points:**
- `apps/server/src/index.ts`: The Hono API server starting point.

**Configuration:**
- `package.json`: Main workspace definitions and cross-project scripts (`dev`, `build`, `check`).
- `packages/config/tsconfig.base.json`: Base configuration that other TypeScript projects inherit.
- `apps/server/tsdown.config.ts`: Server build tool configuration using `tsdown`.
- `packages/env/src/server.ts`: Central schema for environment variables (`CORS_ORIGIN`, `NODE_ENV`).

**Core Logic:**
- `apps/server/src/index.ts`: Hono routes and middleware logic.

**Testing:**
- Not currently implemented (planned to use Bun test/Vitest based on PRD).

## Naming Conventions

**Workspaces:**
- `@job-auto-apply/[name]`: Used for internal monorepo dependencies (e.g., `@job-auto-apply/env`).

**Files:**
- lowercase, dash-separated if multi-word (e.g. `tsdown.config.ts`).
- `index.ts`: Primary module export or entry point.

**Directories:**
- lowercase, short single-word names (e.g., `server`, `extension`, `env`, `config`).

## Where to Add New Code

**New Feature (API Route):**
- Primary code: `apps/server/src/routes/[feature].ts` (suggested per PRD).
- Tests: Next to the feature file, e.g. `[feature].test.ts`.

**New Component/Module (Extension):**
- Implementation: Inside `apps/extension/` within specific directories like `components/`, `composables/`, `hooks/`.

**Utilities:**
- Shared helpers: Should be created as a new package under `packages/[name]/` if used by both apps, or inside an `apps/[app]/src/utils/` directory if app-specific.

## Special Directories

**`.planning/`:**
- Purpose: AI agent planning, architecture details, and codebase documentation.
- Generated: Partially by agents.
- Committed: Yes.

**`.gemini/`:**
- Purpose: Stores GSD setup, CLI definitions, tool configurations, and settings.
- Generated: Yes.
- Committed: Yes.

---

*Structure analysis: 2024-05-18*
