# Roadmap

## Summary Checklist

- [x] **Phase 1: Local Foundation & Semantic Memory** - Setup local Hono backend, LanceDB, and basic memory management UI.
- [x] **Phase 2: Resume Ingestion & AI Intelligence** - Implement PDF parsing, semantic mapping, and AI provider routing.
- [ ] **Phase 3: Form Detection & Auto-Fill Interaction** - AI-powered form detection and robust field filling for ATS systems.
- [ ] **Phase 4: Enhancements & Application Tracking** - Add cover letter generation and basic application history.

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Foundation & Semantic Memory | 4/4 | Complete | 2026-02-25 |
| 2. Resume Ingestion & AI Intelligence | 1/1 | Complete | 2026-02-25 |
| 3. Form Detection & Auto-Fill Interaction | 3/3 | Complete | 2026-02-26 |
| 4. Enhancements & Application Tracking | 1/6 | In Progress | 2026-02-27 |

## Phase Details

### Phase 1: Local Foundation & Semantic Memory
**Goal**: Establish the privacy-first local-first infrastructure and semantic storage capabilities.
**Depends on**: Nothing
**Requirements**: MEM-01, MEM-02, MEM-03, MEM-04, AI-03, UI-01
**Success Criteria**:
  1. Local Hono server and LanceDB are running and communicating over localhost.
  2. User can manually add a memory entry (question/answer pair) and see it persisted in the local vector DB.
  3. User can view, edit, and delete stored memories through the extension popup or a local dashboard.
  4. API keys are securely managed in a local `.env` file on the backend.
**Plans**: TBD

### Phase 2: Resume Ingestion & AI Intelligence
**Goal**: Enable the system to ingest user data and map it to semantic fields using AI.
**Depends on**: Phase 1
**Requirements**: RES-01, RES-02, RES-03, AI-01, AI-02, FORM-04
**Success Criteria**:
  1. User can upload a PDF resume and see extracted data (Name, Email, Skills, etc.) in a review panel.
  2. User can approve extracted resume data to be automatically converted into semantic memories in LanceDB.
  3. User can switch between Claude, Gemini, and Qwen providers in real-time within the extension settings.
  4. The system generates natural language questions for fields to facilitate vector similarity matching.
**Plans**: 1 plan
- [x] 02-01-PLAN.md — Resume upload, AI extraction, memory generation, provider switching

### Phase 3: Form Detection & Auto-Fill Interaction
**Goal**: Detect forms on live sites and fill them using the semantic memory with robust event simulation.
**Depends on**: Phase 2
**Requirements**: FORM-01, FORM-02, FORM-03, FILL-01, FILL-02, FILL-03, FILL-04, UI-02, UI-03
**Success Criteria**:
  1. Extension correctly identifies job application forms on Greenhouse, Lever, and Workday with >80% accuracy.
  2. Extension fills forms using stored memories, showing color-coded borders indicating the data source.
  3. User is prompted with a dialog when a field cannot be matched with high confidence (>85% threshold).
  4. Hidden "honeypot" fields are explicitly skipped to avoid bot detection.
5. Multi-step forms maintain state as the user progresses through the application.
**Plans**: 3 plans
- [x] 03-01-PLAN.md — Form detection API: Backend endpoints for AI classification, field extraction, memory mapping
- [x] 03-02-PLAN.md — Content script: DOM scanning, honeypot detection, event simulation, message routing
- [ ] 03-03-PLAN.md — Preview UI: Field mapping preview, auto-fill execution, visual feedback

### Phase 4: Enhancements & Application Tracking
**Goal**: Complete the core experience with tailored cover letters and tracking.
**Depends on**: Phase 3
**Requirements**: COVER-01, TRACK-01
**Success Criteria**:
  1. User can generate a tailored cover letter PDF based on their resume context and the current job description.
  2. User can view a basic history of applications they have interacted with using the extension (Company, Date, URL).
**Plans**: 6 plans
- [x] 04-01-PLAN.md — Database setup & PDFKit dependency
- [ ] 04-02-PLAN.md — Application CRUD API
- [ ] 04-03-PLAN.md — Cover letter generation & PDF libraries
- [ ] 04-04-PLAN.md — Cover letter API routes
- [ ] 04-05-PLAN.md — Frontend Application UI
- [ ] 04-06-PLAN.md — Frontend Cover Letter UI
