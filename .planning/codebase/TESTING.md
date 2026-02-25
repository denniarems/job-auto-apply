# Testing Patterns

**Analysis Date:** 2025-01-20

## Test Framework

*(Note: Test files are not yet implemented in the codebase. The following patterns are derived from the foundational configuration and PRD specifications.)*

**Runner:**
- Unit Tests: `Bun test` and `Vitest`
- Integration Tests: `Supertest` (for Hono API endpoints)
- E2E Tests: `Playwright`

**Configuration:**
- Linting for `vitest` is pre-configured in `.oxlintrc.json` (`"vitest": { "typecheck": false }`).

**Run Commands (Planned):**
```bash
bun test              # Run all unit/integration tests via Bun
```

## Test File Organization

**Location:**
- Typically co-located with source files or inside a dedicated `tests/` or `__tests__/` directory.

**Naming:**
- Files: `*.test.ts` or `*.spec.ts`

## Coverage

**Requirements:**
- Unit Tests: Target >80% coverage.
- Integration Tests: Target >90% coverage.

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, and parsers.
- Framework: `Bun test` or `Vitest`.

**Integration Tests:**
- Scope: API endpoints in `apps/server`.
- Framework: `Supertest` (to test Hono routes).

**E2E Tests:**
- Scope: Full user flows (Extension -> Backend -> AI Provider -> DOM Manipulation).
- Framework: `Playwright`.

## Documented Test Cases (from PRD)

**Form Detection (FD):**
- Test detection of forms on supported platforms with confidence thresholds.
- Test multi-step forms and non-job forms.

**Memory System (MEM):**
- Test exact and semantic matches in the LanceDB vector database.
- Test CRUD operations on stored memories.

**Resume Parsing (RES):**
- Test PDF/DOCX extraction and structuring via AI.
- Test fallback handling for invalid files.

**Auto-Fill (AF):**
- Test DOM event triggers for React/Vue forms.
- Test visual indicators (green/blue/yellow highlighting).

**AI Providers (AI):**
- Test dynamic switching between Claude, Gemini, and Qwen without restarts.
- Test fallback behavior for invalid API keys or timeouts.

---

*Testing analysis: 2025-01-20*