# Requirements

## v1 Requirements

### Form Detection & Analysis (FORM)
- [ ] **FORM-01**: Detect job application forms with >80% confidence using AI analysis of DOM structure.
- [ ] **FORM-02**: Identify form fields semantically and map them to standard categories (personal, salary, experience, etc.).
- [ ] **FORM-03**: Support "Big Three" ATS systems: Greenhouse, Lever, and Workday.
- [x] **FORM-04**: Generate natural language questions for each identified field to facilitate memory matching.

### Memory Management (MEM)
- [ ] **MEM-01**: Store and retrieve user answers using semantic similarity (LanceDB vector DB) with an 85% confidence threshold.
- [x] **MEM-02**: Support manual editing and deletion of stored memories via a dedicated UI.
- [ ] **MEM-03**: Track memory usage and last-used timestamps to prioritize relevant answers.
- [ ] **MEM-04**: Securely store all memories locally on the user's machine (privacy-first).

### Resume Processing (RES)
- [x] **RES-01**: Support PDF resume uploads and extract text using AI-powered parsing.
- [x] **RES-02**: Automatically generate memories from extracted resume data (Name, Email, Phone, Skills, Experience).
- [x] **RES-03**: Allow users to review and edit extracted data before saving it as memories.

### Auto-Fill Execution (FILL)
- [ ] **FILL-01**: Automatically fill identified fields with memory values using robust event simulation (focus, input, change, blur) for React/Vue compatibility.
- [ ] **FILL-02**: Provide visual indicators (color-coded borders) showing the source of each filled value (Memory, Resume, Manual).
- [ ] **FILL-03**: Handle multi-step forms by maintaining state across page transitions.
- [ ] **FILL-04**: Explicitly skip "Honeypot" fields (hidden fields) to avoid bot detection.

### AI Provider Management (AI)
- [x] **AI-01**: Support Claude, Gemini, and Qwen providers via Vercel AI SDK.
- [x] **AI-02**: Allow real-time switching between AI providers in the extension settings.
- [ ] **AI-03**: Securely manage API keys in a local backend `.env` file.

### UI & UX (UI)
- [x] **UI-01**: Provide a Chrome extension popup with a "Start Auto-Fill" button and provider selector.
- [ ] **UI-02**: Show real-time progress panels and status indicators during form analysis and filling.
- [ ] **UI-03**: Display a user input dialog for fields with no high-confidence memory matches.

### Secondary Features (v1.1)
- [ ] **COVER-01**: Generate tailored cover letters using Job Description and Resume context.
- [ ] **TRACK-01**: Track basic application history (Company, Position, URL, Date).

## v2 Requirements (Deferred)
- [ ] **OPT-01**: Support DOCX resume uploads.
- [ ] **OPT-02**: Export/Import memories to JSON for backup.
- [ ] **OPT-03**: Multi-language support (Non-English job sites).
- [ ] **OPT-04**: Local LLM support (Ollama integration).

## Out of Scope
- **Cloud Sync**: To maintain strict privacy, data will not be synced to any cloud provider.
- **Auto-Submit**: To avoid Terms of Service violations and ensure quality, users must manually submit applications.
- **Authentication**: The tool is for personal local use; no login system is required.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | Phase 3 | Pending |
| FORM-02 | Phase 3 | Pending |
| FORM-03 | Phase 3 | Pending |
| FORM-04 | Phase 2 | Complete |
| MEM-01 | Phase 1 | Pending |
| MEM-02 | Phase 1 | Complete |
| MEM-03 | Phase 1 | Pending |
| MEM-04 | Phase 1 | Pending |
| RES-01 | Phase 2 | Complete |
| RES-02 | Phase 2 | Complete |
| RES-03 | Phase 2 | Complete |
| FILL-01 | Phase 3 | Pending |
| FILL-02 | Phase 3 | Pending |
| FILL-03 | Phase 3 | Pending |
| FILL-04 | Phase 3 | Pending |
| AI-01 | Phase 2 | Complete |
| AI-02 | Phase 2 | Complete |
| AI-03 | Phase 1 | Pending |
| UI-01 | Phase 1 | Complete |
| UI-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| COVER-01 | Phase 4 | Pending |
| TRACK-01 | Phase 4 | Pending |

---
*Last updated: 2026-02-25 after initialization*