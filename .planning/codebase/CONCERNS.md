# Codebase Concerns

**Analysis Date:** 2025-01-15

## Tech Debt

**Project Scaffolding:**
- Issue: Project scaffolding is severely incomplete compared to the directory structure defined in the PRD. Most directories and files under `apps/extension`, `apps/server/src/(ai|db|routes|services)`, and `packages/config` are missing.
- Files: Entire workspace
- Impact: Blocks immediate implementation of features and requires upfront structuring.
- Fix approach: Scaffold the remaining missing directories and stub out the core components described in the PRD (like `apps/extension/entrypoints`, `apps/server/src/routes`).

## Known Bugs

**Not detected:**
- Symptoms: Not applicable (codebase is mostly unwritten).
- Files: `N/A`
- Trigger: Not applicable.
- Workaround: Not applicable.

## Security Considerations

**API Key Management:**
- Risk: AI provider API keys might inadvertently leak if `.env` management isn't strictly configured across the monorepo.
- Files: `apps/server/.env`, `packages/env/src/server.ts`
- Current mitigation: Basic `.env` configuration via `@t3-oss/env-core` and Zod present in `packages/env/src/server.ts`.
- Recommendations: Ensure `.gitignore` is correctly configured across all packages and apps to never commit `.env` files. Validate AI API keys exclusively on the backend (`apps/server`) and ensure the extension cannot access them directly.

## Performance Bottlenecks

**Not applicable:**
- Problem: Codebase currently consists only of a basic HTTP server stub.
- Files: `N/A`
- Cause: Not applicable.
- Improvement path: Not applicable.

## Fragile Areas

**Environment Validation:**
- Files: `packages/env/src/server.ts`
- Why fragile: Uses `process.env` validation but doesn't fully validate all required API keys and DB paths defined in `prd.md` (e.g., `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `ZVEC_DB_PATH`).
- Safe modification: Add the required keys defined in the PRD to the Zod schema before building dependent features to ensure type-safe environment access.
- Test coverage: No test coverage currently exists for environment validation.

## Scaling Limits

**Not applicable:**
- Current capacity: Not applicable.
- Limit: Not applicable.
- Scaling path: Not applicable.

## Dependencies at Risk

**Not detected:**
- Risk: Not applicable.
- Impact: Not applicable.
- Migration plan: Not applicable.

## Missing Critical Features

**Core PRD Implementation:**
- Problem: AI routing, Vector DB (Zvec), Extension Background/Popup/Options, Resume Parsing, and Memory Management are completely unimplemented.
- Blocks: The entirety of the "Job Auto-Apply Chrome Extension" feature set defined in `prd.md`.

## Test Coverage Gaps

**Complete Lack of Tests:**
- What's not tested: No testing framework (Bun test, Vitest) configuration or test files exist in the repository despite `prd.md` requiring >80% unit test coverage.
- Files: Entire workspace
- Risk: Any new implementation will lack regression protection.
- Priority: High

---

*Concerns audit: 2025-01-15*
