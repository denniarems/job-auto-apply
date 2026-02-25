# Job Auto-Apply Extension

## What This Is

A personal Chrome extension that automates job application form filling using AI-powered form detection, semantic memory storage, and resume parsing. It acts as a smart assistant that learns from user inputs over time, significantly reducing manual data entry for job seekers while ensuring privacy and maintaining manual submission control.

## Core Value

Reduce job application time by 80% through intelligent, local-first, semantic form auto-filling that learns continuously while keeping all user data entirely private.

## Requirements

### Validated

- ✓ Local development environment setup (Bun workspaces, Hono, WXT) — inferred

### Active

- [ ] AI form detection and semantic field mapping
- [ ] Zvec vector DB integration for semantic memory storage
- [ ] Auto-fill fields with visual source indicators (memory/resume/manual)
- [ ] User input dialog for missing fields and memory saving
- [ ] Resume upload and AI-powered text/data extraction
- [ ] Extension popup UI (Start button, AI provider selection, status panel)
- [ ] Backend AI provider router (Claude, Gemini, Qwen via Vercel AI SDK)
- [ ] Cover letter generation from resume and job description
- [ ] Cover letter PDF export
- [ ] Basic application tracking
- [ ] Memory management UI (view, edit, delete)

### Out of Scope

- [Cloud Storage / Cloud Sync] — Privacy first, local Zvec DB only to prevent data leaks.
- [Auto-Submit Automation] — To avoid ToS violations on job boards, users must manually submit.
- [Authentication] — Designed for personal use on localhost only.
- [Firefox/Safari/Edge Support] — Chrome extension scope for V1.
- [Multi-Language Support] — English job sites only for MVP.

## Context

- The project relies heavily on the Vercel AI SDK to abstract interactions with Claude, Gemini, and Qwen, using them for form analysis, data extraction, and cover letter generation.
- The system adopts a strict local-first architecture using a local node server (Hono) and an in-process vector DB (Zvec) for embedding storage and semantic search.
- The UI is built using React in WXT for the Chrome extension, with all data passing between the extension and local backend over HTTP.
- To maintain flexibility, users can swap AI providers dynamically, requiring secure, local management of API keys in a backend `.env`.

## Constraints

- **Tech Stack**: Bun Runtime, Hono Backend, WXT Extension, React UI, Zvec DB, Vercel AI SDK. — Required architecture to balance speed, local processing, and flexibility.
- **Privacy**: All data MUST be stored locally (no cloud syncing) — Core user expectation for sensitive job search data.
- **Safety**: Forms MUST NOT be auto-submitted — Ensures compliance with job board Terms of Service.
- **Deployment**: Extension and Backend run independently but must communicate over `localhost:3000`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Zvec for memory | Provides fast, local vector search for semantic field matching without cloud reliance. | — Pending |
| Adopt Vercel AI SDK | Enables easy switching between Claude, Gemini, and Qwen without massive code changes. | — Pending |
| Manual Submit Only | Keeps the tool compliant with job board policies while still delivering 80% time savings. | — Pending |
| Chrome Manifest V3 | Required for modern Chrome extensions, using Service Worker and Content Scripts to manipulate DOM. | — Pending |

---
*Last updated: 2026-02-25 after initialization*