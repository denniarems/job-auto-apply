# External Integrations

**Analysis Date:** 2025-02-18

## APIs & External Services

**AI Providers (Defined in PRD):**
- Claude (Anthropic) - Form analysis, resume parsing, cover letter generation
  - SDK/Client: Vercel AI SDK (`@ai-sdk/anthropic`)
  - Auth: `ANTHROPIC_API_KEY`
- Gemini (Google) - Form analysis, resume parsing
  - SDK/Client: Vercel AI SDK (`@ai-sdk/google`)
  - Auth: `GEMINI_API_KEY`
- Qwen (Alibaba) - Alternative AI provider
  - SDK/Client: Vercel AI SDK (`@ai-sdk/openai`)
  - Auth: `OPENAI_API_KEY`

## Data Storage

**Databases:**
- LanceDB (Local Vector DB)
  - Connection: Local file path `~/.job-auto-apply`
  - Client: Custom DB client/wrapper for vector storage

**File Storage:**
- Local filesystem only
  - Resumes and generated PDFs stored locally in `UPLOAD_DIR` (`./uploads/`)

**Caching:**
- None detected

## Authentication & Identity

**Auth Provider:**
- Custom / None
  - Implementation: Localhost-only access, designed for single personal use without cloud authentication.

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Hono Logger middleware (`hono/logger`) in `apps/server/src/index.ts`

## CI/CD & Deployment

**Hosting:**
- Local execution only (Bun + Chrome Extension)

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- `CORS_ORIGIN` - Allowed origins for extension (configured in `packages/env/src/server.ts`)
- `NODE_ENV` - Environment mode (configured in `packages/env/src/server.ts`)
- *Planned API Keys from PRD:* `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ZVEC_DB_PATH`, `UPLOAD_DIR`

**Secrets location:**
- Stored locally in `.env` files (e.g., `apps/server/.env`). Never synced to cloud.

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2025-02-18*