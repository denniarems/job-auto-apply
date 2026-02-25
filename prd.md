# 📄 Product Requirements Document (PRD)
## Job Auto-Apply Chrome Extension

| Document Info | Details |
|---------------|---------|
| **Project Name** | Job Auto-Apply Extension |
| **Version** | 1.0.0 |
| **Status** | Draft |
| **Last Updated** | 2025-01-15 |
| **Author** | Development Team |

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Target Users](#4-target-users)
5. [Technical Architecture](#5-technical-architecture)
6. [Project Structure](#6-project-structure)
7. [Features & Requirements](#7-features--requirements)
8. [User Flows](#8-user-flows)
9. [Data Models](#9-data-models)
10. [API Specifications](#10-api-specifications)
11. [UI/UX Requirements](#11-uiux-requirements)
12. [Security & Privacy](#12-security--privacy)
13. [Performance Requirements](#13-performance-requirements)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & Setup](#15-deployment--setup)
16. [Timeline & Milestones](#16-timeline--milestones)
17. [Risk Assessment](#17-risk-assessment)
18. [Success Metrics](#18-success-metrics)
19. [Future Considerations](#19-future-considerations)

---

## 1. Executive Summary

### 1.1 Project Vision
Build a **personal Chrome extension** that automates job application form filling using AI-powered form detection, semantic memory storage, and resume parsing. The system learns from user inputs over time, reducing manual data entry by 80%+ while maintaining user control and ToS compliance.

### 1.2 Key Value Propositions
| Benefit | Description |
|---------|-------------|
| **Time Savings** | Reduce application time from 15-20 min to 2-3 min per job |
| **Learning System** | Gets smarter with each application (semantic memory) |
| **Privacy First** | All data stored locally, no cloud syncing |
| **Provider Flexibility** | Switch between Claude/Gemini/Qwen without code changes |
| **ToS Safe** | User manually submits (no auto-submit automation) |

### 1.3 Scope
- **Platform**: Chrome Extension (Manifest V3)
- **Backend**: Local Node.js server (Hono)
- **Database**: Zvec Vector DB (local file)
- **AI**: Vercel AI SDK (switchable providers)
- **Auth**: None (personal use, localhost only)
- **Runtime**: Bun
- **Monorepo**: Turborepo-style structure

---

## 2. Problem Statement

### 2.1 Current Pain Points
| Problem | Impact | Frequency |
|---------|--------|-----------|
| Repetitive form filling across job portals | 15-20 min per application | Every job application |
| Same information entered multiple times | Frustration, errors | Every application |
| No centralized memory of past inputs | Re-typing same data | Every new site |
| Resume data not auto-extracted | Manual copy-paste | Every application |
| Cover letter writing from scratch | 30+ min per letter | When required |
| No tracking of applications | Lost opportunities | Ongoing |

### 2.2 Current Solutions & Gaps
| Solution | Limitations |
|----------|-------------|
| Browser autofill | Only basic fields, no semantic understanding |
| Password managers | Not designed for job forms |
| Existing auto-apply extensions | Cloud-based, privacy concerns, subscription costs |
| Manual entry | Time-consuming, error-prone |

### 2.3 Opportunity
Build a **local-first, AI-powered, privacy-focused** solution that:
- Understands form context semantically (not just field names)
- Learns from user behavior over time
- Integrates resume data automatically
- Generates cover letters on-demand
- Remains fully under user control

---

## 3. Solution Overview

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CHROME EXTENSION (WXT)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Content    │  │   Background │  │    Popup     │  │   Settings   │    │
│  │   Script     │  │   Service    │  │     UI       │  │     UI       │    │
│  │   (DOM)      │  │   Worker     │  │   (React)    │  │   (React)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │ fetch() http://localhost:3000
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Hono + Bun)                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      API Routes (Hono)                                │   │
│  │  /api/ai/*  │  /api/memories/*  │  /api/resumes/*  │  /api/config/*  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│              ┌─────────────────────┼─────────────────────┐                  │
│              ▼                     ▼                     ▼                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  Vercel AI SDK   │  │    Zvec DB       │  │   File System    │          │
│  │  (Claude/Gemini/ │  │  (Vector Store)  │  │  (Resumes/PDFs)  │          │
│  │     Qwen)        │  │  ./data/memory   │  │  ./uploads/*     │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Components

| Component | Technology | Responsibility |
|-----------|------------|----------------|
| **Extension Framework** | WXT | Chrome extension scaffolding, build, hot-reload |
| **Extension UI** | React + TypeScript | Popup, settings, dialogs |
| **DOM Manipulation** | Vanilla JS (Content Script) | Form detection, field filling |
| **Backend Server** | Hono + Bun | API endpoints, orchestration |
| **AI Integration** | Vercel AI SDK | Unified provider interface |
| **AI Providers** | Claude / Gemini / Qwen | Form analysis, resume parsing, cover letters |
| **Vector Database** | Zvec | Semantic memory storage |
| **Resume Parsing** | pdf-parse + AI extraction | PDF/DOCX text extraction |
| **PDF Generation** | pdfkit | Cover letter PDF creation |
| **Runtime** | Bun | Fast JavaScript runtime for backend |
| **Monorepo** | Bun Workspaces | Package management across apps |

### 3.3 Key Workflows

#### 3.3.1 Form Auto-Fill Flow
```
User Clicks Start → AI Analyzes Form → Search Memory → Fill Fields → User Reviews → Manual Submit
```

#### 3.3.2 Resume Upload Flow
```
Upload Resume → AI Extracts Data → Auto-Generate Memories → User Reviews → Store in Zvec
```

#### 3.3.3 Memory Learning Flow
```
Field Not Found → Ask User → User Enters Value → Save Option → Store in Zvec with Embedding
```

---

## 4. Target Users

### 4.1 Primary User Persona
| Attribute | Description |
|-----------|-------------|
| **Profile** | Job seeker (active or passive) |
| **Technical Skill** | Basic (can install extension, configure API keys) |
| **Job Application Volume** | 10-50 applications per month |
| **Pain Point** | Time-consuming repetitive form filling |
| **Privacy Concern** | High (prefers local storage over cloud) |

### 4.2 User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-01 | Job seeker | Click one button to auto-fill forms | I save time on each application | P0 |
| US-02 | Job seeker | Upload my resume once | All my data is auto-extracted and remembered | P0 |
| US-03 | Job seeker | Switch AI providers easily | I can use my preferred/cost-effective AI | P1 |
| US-04 | Job seeker | Generate cover letters on-demand | I don't write from scratch each time | P1 |
| US-05 | Job seeker | Track all my applications | I know my application status | P2 |
| US-06 | Job seeker | Edit stored memories | I can update changed information | P2 |
| US-07 | Job seeker | Export/import my memories | I can backup and restore my data | P3 |

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Monorepo** | Bun Workspaces | ^1.0.0 | Package management |
| **Extension Framework** | WXT | ^0.19.0 | Chrome extension development |
| **Extension UI** | React | ^18.0.0 | Popup and settings UI |
| **Extension Language** | TypeScript | ^5.0.0 | Type-safe code |
| **Backend Framework** | Hono | ^4.0.0 | Lightweight API server |
| **Backend Runtime** | Bun | ^1.0.0 | Fast JavaScript runtime |
| **Backend Bundler** | tsdown | ^0.0.0 | Build tool for server |
| **AI SDK** | Vercel AI SDK | ^3.0.0 | Unified AI provider interface |
| **AI Providers** | @ai-sdk/anthropic, @ai-sdk/google, @ai-sdk/openai | Latest | Claude, Gemini, Qwen |
| **Vector Database** | Zvec | ^0.1.0 | Local vector storage |
| **PDF Parsing** | pdf-parse | ^1.1.1 | Extract text from PDF resumes |
| **PDF Generation** | pdfkit | ^0.15.0 | Generate cover letter PDFs |
| **Validation** | Zod | ^3.22.0 | Schema validation |
| **Linting** | Oxlint | Latest | Fast TypeScript linting |
| **Formatting** | Oxfmt | Latest | Code formatting |

### 5.2 System Components

#### 5.2.1 Monorepo Structure
```
job-auto-apply/
├── .gitignore                    # Global git ignore
├── .mcp.json                     # MCP configuration
├── .oxfmtrc.json                 # Code formatter config
├── .oxlintrc.json                # Oxlint configuration
├── bun.lockc                     # Bun lock file
├── opencode.json                 # OpenCode configuration
├── package.json                  # Root package (workspaces)
├── README.md                     # Project documentation
├── skills-lock.json              # AI skills lock file
├── tsconfig.json                 # Root TypeScript config
├── .gemini/
│   └── settings.json             # Gemini AI settings
├── packages/                     # Shared packages
│   ├── env/                      # Environment management
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── server.ts         # Environment variables schema
│   └── config/                   # Shared configurations
│       ├── package.json
│       └── tsconfig.base.json    # Base TypeScript config
├── apps/                         # Applications
│   ├── server/                   # Hono backend
│   │   ├── .env                  # Environment variables
│   │   ├── .gitignore
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsdown.config.ts      # tsdown build config
│   │   └── src/
│   │       └── index.ts          # Hono app entry
│   └── extension/                # WXT Chrome extension
│       ├── .output/              # Build output
│       ├── .wxt/                 # WXT cache
│       ├── assets/               # Static assets
│       ├── components/           # React components
│       ├── composables/          # Vue-style composables
│       ├── entrypoints/          # WXT entry points
│       ├── hooks/                # Custom hooks
│       ├── modules/              # WXT modules
│       ├── public/               # Public assets
│       ├── utils/                # Utility functions
│       ├── .env                  # Extension env
│       ├── .env.publish          # Publish env
│       ├── app.config.ts         # App configuration
│       ├── package.json
│       ├── tsconfig.json
│       ├── web-ext.config.ts     # Web-ext config
│       └── wxt.config.ts         # WXT configuration
└── .agents/                      # AI Agent configurations
    └── skills/
        └── hono/
            └── SKILL.md          # Hono AI skill definition
```

#### 5.2.2 Extension Structure (WXT)
```
apps/extension/
├── entrypoints/
│   ├── background/
│   │   └── index.ts              # Service worker (API orchestration)
│   ├── content/
│   │   └── index.ts              # Content script (DOM manipulation)
│   ├── popup/
│   │   └── index.tsx             # Main popup UI
│   └── options/
│       └── index.tsx             # Options page (settings)
├── components/
│   ├── StartButton.tsx           # Start auto-fill button
│   ├── ProviderSelector.tsx      # AI provider dropdown
│   ├── UserInputDialog.tsx       # User input dialog
│   ├── StatusPanel.tsx           # Fill status indicator
│   ├── ResumeUpload.tsx          # Resume upload component
│   ├── MemoryList.tsx            # Memory list view
│   └── ui/                       # Reusable UI components
├── composables/
│   ├── useApi.ts                 # API client composable
│   ├── useMemory.ts              # Memory operations composable
│   ├── useResume.ts              # Resume operations composable
│   └── useProvider.ts            # AI provider composable
├── hooks/
│   ├── useFormDetection.ts       # Form detection hook
│   ├── useAutoFill.ts            # Auto-fill logic hook
│   └── useStorage.ts             # Chrome storage hook
├── modules/
│   └── analytics.ts              # Custom WXT modules
├── utils/
│   ├── api.ts                    # Backend API client
│   ├── types.ts                  # Shared TypeScript types
│   ├── dom-utils.ts              # DOM helper functions
│   └── constants.ts              # App constants
├── assets/
│   ├── icon.png                  # Extension icon
│   └── styles.css                # Global styles
├── public/
│   └── _locales/                 # Internationalization
├── .env                          # Development environment
├── .env.publish                  # Publish environment
├── app.config.ts                 # App-level configuration
├── wxt.config.ts                 # WXT configuration
├── web-ext.config.ts             # Web-ext configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

#### 5.2.3 Backend Structure (Hono)
```
apps/server/
├── src/
│   ├── index.ts                  # Hono app entry point
│   ├── routes/
│   │   ├── ai.ts                 # AI analysis endpoints
│   │   ├── memories.ts           # Memory CRUD operations
│   │   ├── resumes.ts            # Resume upload & parsing
│   │   ├── config.ts             # AI provider configuration
│   │   └── applications.ts       # Application tracking
│   ├── ai/
│   │   ├── providers.ts          # Vercel AI SDK provider setup
│   │   ├── prompts.ts            # All AI prompt templates
│   │   └── router.ts             # Provider switching logic
│   ├── db/
│   │   └── zvec.ts               # Zvec database client
│   ├── services/
│   │   ├── resume-parser.ts      # PDF parsing service
│   │   ├── pdf-generator.ts      # Cover letter PDF generation
│   │   └── memory-manager.ts     # Memory operations
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── data/                         # Zvec database files
│   └── memory.db
├── uploads/                      # Uploaded resumes & PDFs
├── .env                          # Environment variables
├── .gitignore
├── tsdown.config.ts              # tsdown build configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

#### 5.2.4 Shared Packages
```
packages/
├── env/                          # Environment management
│   ├── src/
│   │   └── server.ts             # Environment schema (Zod)
│   ├── package.json
│   └── tsconfig.json
└── config/                       # Shared configurations
    ├── tsconfig.base.json        # Base TypeScript config
    └── package.json
```

### 5.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User Action (Extension)
        │
        ▼
Content Script (DOM Access)
        │
        ▼ chrome.runtime.sendMessage
Background Service Worker
        │
        ▼ fetch() http://localhost:3000
Hono Backend API
        │
        ├─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
   Vercel AI SDK   Zvec DB    File System    Bun Runtime
   (AI Providers)  (Vectors)   (Resumes)     (Execution)
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                              │
                              ▼
                      Response to Extension
                              │
                              ▼
                      Update UI / Fill DOM
```

### 5.4 AI Provider Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI PROVIDER ROUTER (Vercel AI SDK)                     │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────┐
                    │   Extension Request          │
                    │   { provider: "claude" }     │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │   AI Router (src/ai/router)  │
                    │   - Load active provider     │
                    │   - Initialize model         │
                    └──────────────┬───────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │   Claude    │         │   Gemini    │         │    Qwen     │
    │  @ai-sdk/   │         │  @ai-sdk/   │         │  @ai-sdk/   │
    │  anthropic  │         │   google    │         │   openai    │
    └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
           │                       │                       │
           ▼                       ▼                       ▼
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │  API Key:   │         │  API Key:   │         │  API Key:   │
    │  ANTHROPIC  │         │   GEMINI    │         │   QWEN      │
    │  _API_KEY   │         │  _API_KEY   │         │  _API_KEY   │
    └─────────────┘         └─────────────┘         └─────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │   Unified Response Format    │
                    │   (Consistent JSON schema)   │
                    └──────────────────────────────┘
```

---

## 6. Project Structure

### 6.1 Root Configuration Files

| File | Purpose |
|------|---------|
| `.gitignore` | Global git ignore rules |
| `.mcp.json` | Model Context Protocol configuration |
| `.oxfmtrc.json` | Code formatter configuration |
| `.oxlintrc.json` | Oxlint configuration |
| `bun.lockc` | Bun package lock file |
| `opencode.json` | OpenCode AI configuration |
| `package.json` | Root package with workspaces definition |
| `README.md` | Project documentation and setup guide |
| `skills-lock.json` | AI skills version lock |
| `tsconfig.json` | Root TypeScript configuration |
| `.gemini/settings.json` | Gemini AI assistant settings |

### 6.2 Packages Directory

| Package | Purpose |
|---------|---------|
| `packages/env/` | Environment variable schemas and validation |
| `packages/config/` | Shared TypeScript and build configurations |

### 6.3 Apps Directory

| App | Purpose |
|-----|---------|
| `apps/server/` | Hono backend API server |
| `apps/extension/` | WXT Chrome extension |

### 6.4 Agents Directory

| Path | Purpose |
|------|---------|
| `.agents/skills/hono/` | AI agent skills for Hono development |

### 6.5 Workspace Dependencies

```json
// Root package.json
{
  "name": "job-auto-apply",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:server": "bun run --filter server dev",
    "dev:extension": "bun run --filter extension dev",
    "build": "bun run --filter '*' build",
    "lint": "oxlint .",
    "format": "oxfmt ."
  }
}
```

---

## 7. Features & Requirements

### 7.1 Feature Priority Matrix

| Feature | Priority | Effort | Impact | Phase |
|---------|----------|--------|--------|-------|
| Manual trigger (Start button) | P0 | Low | High | 1 |
| AI form detection | P0 | High | High | 1 |
| Field semantic mapping | P0 | High | High | 1 |
| Memory search (Zvec) | P0 | Medium | High | 1 |
| Auto-fill fields | P0 | Medium | High | 1 |
| User input dialog | P0 | Medium | High | 1 |
| Memory storage | P0 | Medium | High | 1 |
| Resume upload | P0 | Medium | High | 2 |
| Resume parsing (AI) | P0 | High | High | 2 |
| Auto-store resume data as memories | P0 | Medium | High | 2 |
| AI provider switching | P1 | Low | Medium | 1 |
| Cover letter generation | P1 | Medium | Medium | 3 |
| Cover letter PDF export | P2 | Medium | Low | 3 |
| Application tracking | P2 | Low | Medium | 3 |
| Memory management UI | P2 | Medium | Medium | 2 |
| Export/import memories | P3 | Low | Low | 4 |

### 7.2 Functional Requirements

#### 7.2.1 Form Detection & Analysis (FR-01)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01.1 | System shall detect job application forms using AI | AI returns `isJobForm: true` with confidence > 0.80 |
| FR-01.2 | System shall identify all form fields with semantic meaning | Each field mapped to category (personal, salary, experience, etc.) |
| FR-01.3 | System shall generate natural language questions for each field | Question format: "What is your [field]?" |
| FR-01.4 | System shall cache successful form templates per domain | Subsequent visits to same domain use cached template |

#### 7.2.2 Memory Management (FR-02)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-02.1 | System shall search memories using semantic similarity | Confidence threshold: 85% for auto-fill |
| FR-02.2 | System shall store new memories with embeddings | Embedding generated via AI SDK |
| FR-02.3 | System shall track memory source (user_input/resume_extracted) | Source field stored with each memory |
| FR-02.4 | System shall track memory usage count | Increment on each successful use |
| FR-02.5 | System shall allow users to view/edit/delete memories | UI provided in popup settings |

#### 7.2.3 Resume Processing (FR-03)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-03.1 | System shall accept PDF and DOCX resume uploads | File upload via popup UI |
| FR-03.2 | System shall extract text from resumes | pdf-parse for PDF, mammoth for DOCX |
| FR-03.3 | System shall parse structured data using AI | Fields: name, email, phone, experience, skills, education |
| FR-03.4 | System shall auto-generate memories from resume data | One memory per extracted field |
| FR-03.5 | System shall allow user review before saving memories | Preview UI with edit capability |
| FR-03.6 | System shall support multiple resumes | User can set default resume |

#### 7.2.4 Auto-Fill Execution (FR-04)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-04.1 | System shall fill fields with memory values | Value inserted into correct field |
| FR-04.2 | System shall trigger proper events for React/Vue forms | input, change, blur events dispatched |
| FR-04.3 | System shall visually indicate fill source | Green (user memory), Blue (resume), Yellow (manual) |
| FR-04.4 | System shall NOT auto-submit forms | User must manually click submit |
| FR-04.5 | System shall handle multi-step forms | Track progress across steps |

#### 7.2.5 Cover Letter Generation (FR-05)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-05.1 | System shall generate cover letters from job description | AI generates 150-200 word letter |
| FR-05.2 | System shall incorporate resume data in cover letter | Skills/experience referenced |
| FR-05.3 | System shall export cover letter as PDF | pdfkit generates downloadable PDF |
| FR-05.4 | System shall allow user edit before download | Editable text area before export |

#### 7.2.6 AI Provider Management (FR-06)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-06.1 | System shall support Claude, Gemini, Qwen providers | All three providers functional |
| FR-06.2 | System shall allow provider switching without restart | Change takes effect immediately |
| FR-06.3 | System shall store API keys securely (local .env) | Keys never exposed in extension |
| FR-06.4 | System shall handle provider failures gracefully | Fallback to another provider or error message |

#### 7.2.7 Application Tracking (FR-07)
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-07.1 | System shall track submitted applications | Record created after user submits |
| FR-07.2 | System shall store company, position, URL, date | All fields captured |
| FR-07.3 | System shall allow status updates | User can mark: applied/interview/rejected/offered |
| FR-07.4 | System shall link applications to resumes/cover letters | Reference stored in application record |

### 7.3 Non-Functional Requirements

#### 7.3.1 Performance (NFR-01)
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01.1 | Form detection time | < 5 seconds |
| NFR-01.2 | Memory search latency | < 2 seconds |
| NFR-01.3 | Field auto-fill completion | < 10 seconds (all fields) |
| NFR-01.4 | Resume parsing time | < 30 seconds (per resume) |
| NFR-01.5 | Cover letter generation | < 15 seconds |
| NFR-01.6 | Extension load time | < 2 seconds |
| NFR-01.7 | Backend startup time | < 3 seconds (Bun) |

#### 7.3.2 Security & Privacy (NFR-02)
| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-02.1 | All data stored locally | Zvec DB on user's machine |
| NFR-02.2 | No cloud syncing | No external database connections |
| NFR-02.3 | API keys stored in backend .env | Never in extension code |
| NFR-02.4 | HTML sanitized before AI processing | Field values removed, structure only |
| NFR-02.5 | No authentication required | Localhost-only access |
| NFR-02.6 | CORS restricted to extension | Only chrome-extension://* allowed |

#### 7.3.3 Reliability (NFR-03)
| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-03.1 | Handle AI provider downtime | Switch to alternative provider |
| NFR-03.2 | Handle backend unavailability | Show user notification |
| NFR-03.3 | Handle form structure changes | Re-analyze with AI, update cache |
| NFR-03.4 | Handle network errors | Retry logic with exponential backoff |
| NFR-03.5 | Data backup capability | Export memories to JSON |

#### 7.3.4 Usability (NFR-04)
| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-04.1 | Setup time < 30 minutes | Clear documentation |
| NFR-04.2 | No coding knowledge required | GUI for all configurations |
| NFR-04.3 | Clear visual feedback | Color-coded fill indicators |
| NFR-04.4 | Error messages user-friendly | Plain language, actionable steps |
| NFR-04.5 | Keyboard shortcuts supported | Quick access to common actions |

---

## 8. User Flows

### 8.1 Initial Setup Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  INITIAL SETUP FLOW                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

1. Clone Repository
   $ git clone <repo-url>
   $ cd job-auto-apply

2. Install Dependencies (Root)
   $ bun install

3. Setup Backend
   $ cd apps/server
   $ cp .env.example .env
   $ # Edit .env with AI API keys
   $ bun run dev

4. Setup Extension
   $ cd apps/extension
   $ bun run dev
   → Chrome opens with extension loaded

5. Configure AI Provider
   → Click extension icon
   → Go to Settings
   → Select preferred AI provider
   → Verify API key status

6. Upload Resume (Optional but Recommended)
   → Click extension icon
   → Go to Resumes
   → Upload PDF/DOCX
   → Review extracted memories
   → Save to Zvec

7. Test on Job Site
   → Navigate to job application page
   → Click extension icon
   → Click "Start Auto-Fill"
   → Review filled fields
   → Submit manually
```

### 8.2 Job Application Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  JOB APPLICATION FLOW                                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  User navigates │
│  to job page    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Extension icon │
│  shows: ● Ready │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User clicks    │
│  extension icon │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Popup opens    │
│  Shows:         │
│  - Page URL     │
│  - AI Provider  │
│  - Start Button │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User clicks    │
│  "Start Auto-   │
│  Fill"          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Content Script │
│  extracts DOM   │
│  context        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Background →   │
│  Backend:       │
│  /api/ai/       │
│  analyze-form   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI analyzes    │
│  form, returns  │
│  field mappings │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  For each field │
│  → Search Zvec  │
│  Memory         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Found  │ │ Not    │
│ >85%   │ │ Found  │
└───┬────┘ └───┬────┘
    │         │
    │         ▼
    │   ┌─────────────────┐
    │   │ Ask User via    │
    │   │ Popup Dialog    │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ User enters     │
    │   │ value + Save?   │
    │   └────────┬────────┘
    │            │
    │            ▼
    │   ┌─────────────────┐
    │   │ Store in Zvec   │
    │   │ (if save)       │
    │   └────────┬────────┘
    │            │
    └────────────┘
         │
         ▼
┌─────────────────┐
│  All fields     │
│  filled         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Visual         │
│  indicators     │
│  shown          │
│  (🟢🔵🟡)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User reviews   │
│  and edits if   │
│  needed         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User manually  │
│  clicks Submit  │
│  (ToS safe)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Application    │
│  tracked in     │
│  Zvec           │
└─────────────────┘
```

### 8.3 Resume Upload Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RESUME UPLOAD FLOW                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  User opens     │
│  Popup →        │
│  Resumes tab    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clicks         │
│  "Upload        │
│  Resume"        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Selects        │
│  PDF/DOCX file  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File sent to   │
│  Backend:       │
│  /api/resumes/  │
│  upload         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend        │
│  extracts text  │
│  (pdf-parse)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI parses      │
│  structured     │
│  data           │
│  (Vercel SDK)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto-generate  │
│  memory         │
│  questions      │
│  for each field │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show user      │
│  preview UI     │
│  (12 memories   │
│  extracted)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Edit   │ │ Save   │
│ Some   │ │ All    │
└───┬────┘ └───┬────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│  Store memories │
│  in Zvec with   │
│  embeddings     │
│  source:        │
│  resume_extract │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Link memories  │
│  to resume ID   │
│  in Zvec        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show success   │
│  message        │
│  "12 memories   │
│  saved"         │
└─────────────────┘
```

---

## 9. Data Models

### 9.1 Zvec Collections

#### 9.1.1 user_memories
```typescript
interface UserMemory {
  id: string;                    // mem_timestamp_random
  question: string;              // Natural language question
  answer: string;                // User's answer
  category: MemoryCategory;      // personal|salary|experience|preference|education|custom
  embedding: number[];           // 768-dim vector
  usage_count: number;           // Times used
  source: MemorySource;          // user_input|resume_extracted|ai_suggested
  resume_id?: string;            // Link to source resume (if from resume)
  last_used: string;             // ISO timestamp
  created_at: string;            // ISO timestamp
  confidence_override?: number;  // Manual confidence adjustment
}

type MemoryCategory = 'personal' | 'salary' | 'experience' | 'preference' | 'education' | 'custom';
type MemorySource = 'user_input' | 'resume_extracted' | 'ai_suggested';
```

#### 9.1.2 resumes
```typescript
interface Resume {
  id: string;                    // res_timestamp_random
  name: string;                  // Filename
  content: string;               // Extracted text
  embedding: number[];           // 768-dim vector
  parsed_data: ParsedResumeData; // Structured data from AI
  memory_ids: string[];          // Links to created memories
  file_path: string;             // Local file path
  is_default: boolean;           // Default resume flag
  created_at: string;            // ISO timestamp
}

interface ParsedResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  totalExperience?: string;
  currentCompany?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  education?: Education[];
}

interface Education {
  degree: string;
  institution: string;
  year?: string;
}
```

#### 9.1.3 form_templates
```typescript
interface FormTemplate {
  id: string;                    // tmpl_timestamp_random
  domain: string;                // e.g., linkedin.com
  url_pattern: string;           // Regex pattern
  form_selector: string;         // CSS selector
  field_mappings: FieldMapping[];// AI-learned mappings
  ai_provider: string;           // Which AI created this
  usage_count: number;           // Times used
  last_successful: string;       // ISO timestamp
  confidence: number;            // Overall confidence 0-1
}

interface FieldMapping {
  selector: string;
  semanticMeaning: string;
  suggestedQuestion: string;
  category: MemoryCategory;
  confidence: number;
}
```

#### 9.1.4 applications
```typescript
interface Application {
  id: string;                    // app_timestamp_random
  company: string;               // Company name
  position: string;              // Job title
  url: string;                   // Job posting URL
  date: string;                  // Application date (ISO)
  status: ApplicationStatus;     // applied|interview|rejected|offered
  fields_from_memory: number;    // Count
  fields_from_resume: number;    // Count
  fields_manual: number;         // Count
  ai_provider: string;           // Which AI was used
  resume_id?: string;            // Linked resume
  cover_letter?: string;         // Generated cover letter
  notes?: string;                // User notes
  created_at: string;            // ISO timestamp
}

type ApplicationStatus = 'applied' | 'interview' | 'rejected' | 'offered';
```

#### 9.1.5 ai_config
```typescript
interface AIConfig {
  id: string;                    // config
  active_provider: AIProvider;   // claude|gemini|qwen
  api_keys: {
    anthropic?: string;
    google?: string;
    openai?: string;
  };
  model_names: {
    claude?: string;
    gemini?: string;
    qwen?: string;
  };
  last_updated: string;          // ISO timestamp
}

type AIProvider = 'claude' | 'gemini' | 'qwen';
```

### 9.2 Data Relationships

```
┌─────────────────┐         ┌─────────────────┐
│    resumes      │         │  user_memories  │
│  ─────────────  │         │  ─────────────  │
│  id (PK)        │◄────────│  resume_id (FK) │
│  name           │  1:N    │  source         │
│  parsed_data    │         │  answer         │
│  memory_ids[]   │────────►│  id (PK)        │
└─────────────────┘         └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│    resumes      │         │   applications  │
│  ─────────────  │         │  ─────────────  │
│  id (PK)        │◄────────│  resume_id (FK) │
│  name           │  1:N    │  company        │
│  parsed_data    │         │  position       │
└─────────────────┘         └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│ form_templates  │         │  user_memories  │
│  ─────────────  │         │  ─────────────  │
│  domain         │         │  question       │
│  field_mappings │────────►│  answer         │
│  confidence     │  Uses   │  embedding      │
└─────────────────┘         └─────────────────┘
```

---

## 10. API Specifications

### 10.1 Base Configuration

| Property | Value |
|----------|-------|
| **Base URL** | `http://localhost:3000` |
| **Content Type** | `application/json` |
| **CORS** | `chrome-extension://*`, `http://localhost:5173` |
| **Runtime** | Bun |
| **Framework** | Hono |

### 10.2 API Endpoints

#### 10.2.1 AI Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/ai/analyze-form` | Analyze form with AI | `{ html, url, provider }` | `{ isJobForm, confidence, fields[] }` |
| `POST` | `/api/ai/embed` | Generate embedding | `{ text }` | `{ embedding: number[] }` |
| `POST` | `/api/ai/cover-letter` | Generate cover letter | `{ jobDescription, resumeInfo }` | `{ coverLetter, wordCount }` |

#### 10.2.2 Memory Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/memories/search` | Search memory | `{ question, category }` | `{ found, answer, confidence, memory_id }` |
| `POST` | `/api/memories/store` | Store memory | `{ question, answer, category, source }` | `{ success, memory_id }` |
| `GET` | `/api/memories/all` | Get all memories | - | `{ memories: UserMemory[] }` |
| `GET` | `/api/memories/by-source/:source` | Filter by source | - | `{ memories: UserMemory[] }` |
| `PUT` | `/api/memories/:id` | Update memory | `{ answer?, confidence_override? }` | `{ success }` |
| `DELETE` | `/api/memories/:id` | Delete memory | - | `{ success }` |
| `DELETE` | `/api/memories/clear` | Clear all memories | - | `{ success, deleted_count }` |

#### 10.2.3 Resume Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/resumes/upload` | Upload resume | `FormData: file` | `{ success, resume_id, memories_created }` |
| `POST` | `/api/resumes/preview` | Preview extraction | `{ file }` | `{ parsed_data, memories_preview[] }` |
| `GET` | `/api/resumes` | List resumes | - | `{ resumes: Resume[] }` |
| `GET` | `/api/resumes/:id` | Get resume details | - | `{ resume, memories[] }` |
| `PUT` | `/api/resumes/:id/default` | Set as default | - | `{ success }` |
| `DELETE` | `/api/resumes/:id` | Delete resume | - | `{ success, memories_deleted }` |
| `POST` | `/api/resumes/:id/memories` | Create memories | `{ memory_ids[] }` | `{ success }` |
| `DELETE` | `/api/resumes/:id/memories` | Remove memories | - | `{ success, deleted_count }` |

#### 10.2.4 Config Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/api/config` | Get config | - | `{ active_provider, api_keys_status }` |
| `POST` | `/api/config/provider` | Set provider | `{ provider }` | `{ success }` |
| `POST` | `/api/config/api-key` | Update API key | `{ provider, api_key }` | `{ success }` |

#### 10.2.5 Application Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/applications` | Track application | `{ company, position, url, ... }` | `{ success, application_id }` |
| `GET` | `/api/applications` | List applications | - | `{ applications: Application[] }` |
| `PUT` | `/api/applications/:id/status` | Update status | `{ status }` | `{ success }` |
| `DELETE` | `/api/applications/:id` | Delete application | - | `{ success }` |

#### 10.2.6 Health Endpoint

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | Health check | `{ status: "healthy", timestamp, version }` |

### 10.3 Request/Response Examples

#### 10.3.1 Analyze Form

**Request:**
```json
POST /api/ai/analyze-form
{
  "html": "<form><input id='email' placeholder='Email'/><input id='ctc' placeholder='Expected CTC'/></form>",
  "url": "https://linkedin.com/jobs/apply/123",
  "provider": "claude"
}
```

**Response:**
```json
{
  "isJobForm": true,
  "confidence": 0.94,
  "fields": [
    {
      "selector": "#email",
      "semanticMeaning": "email",
      "suggestedQuestion": "What is your email address?",
      "category": "personal",
      "confidence": 0.95
    },
    {
      "selector": "#ctc",
      "semanticMeaning": "expected_ctc",
      "suggestedQuestion": "What is your expected CTC?",
      "category": "salary",
      "confidence": 0.92
    }
  ]
}
```

#### 10.3.2 Search Memory

**Request:**
```json
POST /api/memories/search
{
  "question": "What is your email address?",
  "category": "personal"
}
```

**Response:**
```json
{
  "found": true,
  "answer": "john@email.com",
  "confidence": 0.94,
  "memory_id": "mem_1705312345678_abc123",
  "source": "resume_extracted"
}
```

#### 10.3.3 Store Memory

**Request:**
```json
POST /api/memories/store
{
  "question": "What is your expected CTC?",
  "answer": "18 LPA",
  "category": "salary",
  "source": "user_input"
}
```

**Response:**
```json
{
  "success": true,
  "memory_id": "mem_1705312345679_def456"
}
```

#### 10.3.4 Upload Resume

**Request:**
```
POST /api/resumes/upload
Content-Type: multipart/form-data

file: resume.pdf
```

**Response:**
```json
{
  "success": true,
  "resume_id": "res_1705312345680_ghi789",
  "memories_created": 12,
  "parsed_data": {
    "fullName": "John Doe",
    "email": "john@email.com",
    "totalExperience": "5 years"
  }
}
```

---

## 11. UI/UX Requirements

### 11.1 Extension Popup

#### 11.1.1 Main View
```
┌─────────────────────────────────────────┐
│  🤖 Job Auto-Apply                      │
│  ─────────────────────────────────────  │
│                                         │
│  📍 linkedin.com/jobs/apply/123         │
│  Status: ● Ready to Start               │
│                                         │
│  AI Provider: [Claude ▼]                │
│  (Claude / Gemini / Qwen)               │
│                                         │
│         [ 🚀 START AUTO-FILL ]          │
│                                         │
│  ─────────────────────────────────────  │
│  📄 Resumes  │  📊 Memories  │  ⚙️ Settings  │
│                                         │
└─────────────────────────────────────────┘
```

#### 11.1.2 Auto-Fill In Progress
```
┌─────────────────────────────────────────┐
│  🤖 Job Auto-Apply                      │
│  ─────────────────────────────────────  │
│                                         │
│  ⏳ Analyzing Form...                   │
│                                         │
│  [████████░░] 80%                       │
│                                         │
│  ✓ Form detected                        │
│  ✓ 8 fields identified                  │
│  ⏳ Searching memories...               │
│                                         │
│         [ Cancel ]                      │
│                                         │
└─────────────────────────────────────────┘
```

#### 11.1.3 Auto-Fill Complete
```
┌─────────────────────────────────────────┐
│  🤖 Job Auto-Apply                      │
│  ─────────────────────────────────────  │
│                                         │
│  ✅ Auto-Fill Complete!                 │
│                                         │
│  🟢 5 fields from memory                │
│  🔵 2 fields from resume                │
│  🟡 1 field needs input                 │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🟡 LinkedIn URL                    ││
│  │  [Enter value...]           [Save]  ││
│  └─────────────────────────────────────┘│
│                                         │
│         [ Review on Page ]              │
│                                         │
└─────────────────────────────────────────┘
```

### 11.2 Settings View

```
┌─────────────────────────────────────────┐
│  ⚙️  Settings                           │
│  ─────────────────────────────────────  │
│                                         │
│  AI Provider                            │
│  ┌─────────────────────────────────────┐│
│  │  [●] Claude (Anthropic)             ││
│  │  [ ] Gemini (Google)                ││
│  │  [ ] Qwen (Alibaba)                 ││
│  └─────────────────────────────────────┘│
│                                         │
│  API Keys                               │
│  ┌─────────────────────────────────────┐│
│  │  Claude:  •••••••••••••••• [Edit]   ││
│  │  Gemini:  ✓ Configured       [Edit] ││
│  │  Qwen:    [Not set]          [Set]  ││
│  └─────────────────────────────────────┘│
│                                         │
│  Auto-Save Memories                     │
│  ☑ Save user inputs for future use      │
│                                         │
│  Confidence Threshold                   │
│  [━━━━━━●━━━━━━━━] 85%                  │
│                                         │
│  [Save Settings]  [Cancel]              │
│                                         │
└─────────────────────────────────────────┘
```

### 11.3 Resume Management View

```
┌─────────────────────────────────────────┐
│  📄 Manage Resumes                      │
│  ─────────────────────────────────────  │
│                                         │
│  Current Default: resume_john_2025.pdf  │
│                                         │
│  [📤 Upload New Resume]                 │
│                                         │
│  Uploaded Resumes:                      │
│  ┌─────────────────────────────────────┐│
│  │ ✓ resume_john_2025.pdf              ││
│  │   12 memories extracted             ││
│  │   Created: Jan 10, 2025             ││
│  │   [Set Default] [View] [Delete]     ││
│  ├─────────────────────────────────────┤│
│  │   resume_old_2024.pdf               ││
│  │   8 memories extracted              ││
│  │   Created: Dec 15, 2024             ││
│  │   [Set Default] [View] [Delete]     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Close]                                │
│                                         │
└─────────────────────────────────────────┘
```

### 11.4 Memory List View

```
┌─────────────────────────────────────────┐
│  📊 Your Memories (24 total)            │
│  ─────────────────────────────────────  │
│                                         │
│  Filter: [All ▼] [User Input] [Resume]  │
│  Search: [🔍 Search memories...]        │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🟢 What is your email?              ││
│  │    john@email.com                   ││
│  │    Source: Resume (resume_2025.pdf) ││
│  │    Used 15 times                    ││
│  │    [Edit] [Delete]                  ││
│  ├─────────────────────────────────────┤│
│  │ 🟢 What is your expected CTC?       ││
│  │    18 LPA                           ││
│  │    Source: Manual Input             ││
│  │    Used 8 times                     ││
│  │    [Edit] [Delete]                  ││
│  ├─────────────────────────────────────┤│
│  │ 🟢 How many years experience?       ││
│  │    5 years                          ││
│  │    Source: Resume (resume_2025.pdf) ││
│  │    Used 12 times                    ││
│  │    [Edit] [Delete]                  ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Export]  [Import]  [Close]            │
│                                         │
└─────────────────────────────────────────┘
```

### 11.5 Content Script Overlays

#### 11.5.1 Form Detection Indicator
```
Top-right corner of page:

┌─────────────────────────────────┐
│  🤖 Job Auto-Apply              │
│  ─────────────────────────────  │
│  ✓ Job form detected            │
│  8 fields identified            │
│                                 │
│  [Start Auto-Fill] [Dismiss]    │
└─────────────────────────────────┘
```

#### 11.5.2 Fill Status Indicator
```
Top-right corner of page (during fill):

┌─────────────────────────────────┐
│  🤖 Auto-Filling...             │
│  ─────────────────────────────  │
│  [████████░░] 80%               │
│                                 │
│  🟢 5 from memory               │
│  🔵 2 from resume               │
│  🟡 1 needs input               │
└─────────────────────────────────┘
```

#### 11.5.3 Field Highlighting
```
On form fields:

Name:          [John Doe      ] 🟢  ← Green border = user memory
Email:       [john@email.com  ] 🔵  ← Blue border = resume extracted
Phone:       [+91 98765xxxxx  ] 🔵
Expected CTC: [18 LPA         ] 🟢
LinkedIn:     [                ] 🟡  ← Yellow border = needs input
```

---

## 12. Security & Privacy

### 12.1 Data Storage

| Data Type | Storage Location | Encryption | Access |
|-----------|-----------------|------------|--------|
| User Memories | Zvec DB (./apps/server/data/) | None (local only) | Local process only |
| Resumes | File System (./apps/server/uploads/) | None (local only) | Local process only |
| API Keys | Backend .env file | None (local only) | Backend process only |
| Extension Settings | Chrome Storage Local | None | Extension only |
| Form Templates | Zvec DB | None (local only) | Local process only |

### 12.2 Data Transmission

| Transmission | Encryption | Destination |
|--------------|------------|-------------|
| Extension → Backend | HTTP (localhost) | localhost:3000 |
| Backend → AI Provider | HTTPS | Claude/Gemini/Qwen APIs |
| Extension → Chrome Storage | N/A (local) | Browser storage |

### 12.3 Security Measures

| Measure | Implementation |
|---------|----------------|
| **No Cloud Storage** | All data stays on user's machine |
| **Localhost Only** | Backend not accessible externally |
| **CORS Restriction** | Only chrome-extension://* allowed |
| **API Key Protection** | Keys in backend .env, never in extension |
| **HTML Sanitization** | Field values removed before AI processing |
| **No Authentication** | Not needed (single user, localhost) |
| **No Analytics** | No tracking or telemetry |

### 12.4 Privacy Guarantees

| Guarantee | Implementation |
|-----------|----------------|
| **Data Ownership** | User owns all data, can export/delete anytime |
| **No Third-Party Sharing** | No data sent to third parties except AI providers |
| **AI Provider Privacy** | Only form structure sent (no field values) |
| **Local Processing** | Embeddings, searches run locally |
| **User Control** | User decides what to save, what to delete |

---

## 13. Performance Requirements

### 13.1 Latency Targets

| Operation | Target | Maximum | Measurement |
|-----------|--------|---------|-------------|
| Extension load | < 1s | 2s | Time to popup ready |
| Form detection | < 3s | 5s | Page load to detection |
| AI form analysis | < 5s | 10s | Request to response |
| Memory search | < 1s | 2s | Query to result |
| Field auto-fill | < 5s | 10s | All fields filled |
| Resume upload & parse | < 30s | 60s | Upload to memories saved |
| Cover letter generation | < 15s | 30s | Request to PDF ready |
| Backend startup | < 2s | 5s | Bun process start |

### 13.2 Resource Usage

| Resource | Target | Maximum |
|----------|--------|---------|
| Extension RAM | < 50MB | 100MB |
| Backend RAM | < 200MB | 500MB |
| Zvec DB Size | < 100MB | 500MB |
| CPU Usage (idle) | < 1% | 5% |
| CPU Usage (active) | < 30% | 80% |

### 13.3 Scalability

| Metric | Target |
|--------|--------|
| Memories supported | 10,000+ |
| Resumes supported | 100+ |
| Applications tracked | 1,000+ |
| Form templates cached | 500+ domains |
| Daily AI API calls | 100-500 (user-dependent) |

---

## 14. Testing Strategy

### 14.1 Testing Levels

| Level | Scope | Tools | Coverage Target |
|-------|-------|-------|-----------------|
| **Unit Tests** | Individual functions | Bun test, Vitest | 80%+ |
| **Integration Tests** | API endpoints | Supertest | 90%+ |
| **E2E Tests** | Full user flows | Playwright | Critical paths |
| **Manual Tests** | UI/UX, edge cases | Human tester | All features |

### 14.2 Test Cases

#### 14.2.1 Form Detection Tests
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| FD-01 | Detect LinkedIn job form | isJobForm: true, confidence > 0.80 |
| FD-02 | Detect Indeed job form | isJobForm: true, confidence > 0.80 |
| FD-03 | Non-job form (contact) | isJobForm: false |
| FD-04 | Form with no labels | Fields detected with low confidence |
| FD-05 | Multi-step form | Each step detected separately |

#### 14.2.2 Memory Tests
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| MEM-01 | Search exact match | found: true, confidence > 0.95 |
| MEM-02 | Search semantic match | found: true, confidence > 0.85 |
| MEM-03 | Search no match | found: false |
| MEM-04 | Store new memory | success: true, memory_id returned |
| MEM-05 | Update memory | answer updated, usage_count preserved |
| MEM-06 | Delete memory | Memory removed from Zvec |

#### 14.2.3 Resume Tests
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| RES-01 | Upload PDF resume | success: true, memories created |
| RES-02 | Upload DOCX resume | success: true, memories created |
| RES-03 | Upload invalid file | Error message shown |
| RES-04 | Parse resume with AI | All fields extracted correctly |
| RES-05 | Set default resume | is_default updated in Zvec |
| RES-06 | Delete resume | Resume + linked memories deleted |

#### 14.2.4 Auto-Fill Tests
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| AF-01 | Fill all fields from memory | All fields filled, green indicators |
| AF-02 | Fill some fields from memory | Filled fields green, others yellow |
| AF-03 | Fill from resume | Fields blue, correct values |
| AF-04 | React form compatibility | Events triggered, values persist |
| AF-05 | Multi-step form | Progress tracked across steps |
| AF-06 | Field not found | Skip field, log warning |

#### 14.2.5 AI Provider Tests
| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| AI-01 | Claude provider | Analysis successful |
| AI-02 | Gemini provider | Analysis successful |
| AI-03 | Qwen provider | Analysis successful |
| AI-04 | Switch provider | Change takes effect immediately |
| AI-05 | Invalid API key | Error message shown |
| AI-06 | Provider timeout | Fallback or error handled |

### 14.3 Test Environment

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| **Development** | Local testing | localhost:3000, localhost:5173 |
| **Staging** | Pre-release testing | Same as prod, test API keys |
| **Production** | User environment | User's local machine |

---

## 15. Deployment & Setup

### 15.1 Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Bun | ^1.0.0 | Runtime & Package Manager |
| Chrome Browser | ^120.0 | Extension host |
| AI API Keys | - | Claude/Gemini/Qwen |
| Git | ^2.0.0 | Version control |

### 15.2 Installation Steps

```bash
# 1. Clone Repository
git clone <repo-url>
cd job-auto-apply

# 2. Install All Dependencies (Root)
bun install

# 3. Setup Backend
cd apps/server
cp .env.example .env
# Edit .env with AI API keys
bun run dev

# 4. Setup Extension
cd apps/extension
bun run dev
# Chrome opens with extension loaded

# 5. Configure Extension
# Click extension icon → Settings
# Select AI provider
# Verify API key status

# 6. Upload Resume (Optional)
# Click extension icon → Resumes
# Upload PDF/DOCX
# Review and save memories

# 7. Test on Job Site
# Navigate to job application page
# Click extension icon → Start Auto-Fill
```

### 15.3 Environment Variables

```env
# apps/server/.env

# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...  # For Qwen via OpenAI-compatible endpoint

# Default AI Provider
DEFAULT_AI_PROVIDER=claude

# Model Names (optional, uses defaults if not set)
CLAUDE_MODEL=claude-sonnet-4-20250514
GEMINI_MODEL=gemini-2.0-flash
QWEN_MODEL=qwen-max

# Server Configuration
PORT=3000
HOST=localhost

# Zvec Database Path
ZVEC_DB_PATH=./data/memory.db

# Upload Directory
UPLOAD_DIR=./uploads
```

### 15.4 Build & Distribution

| Target | Command | Output |
|--------|---------|--------|
| **Backend Build** | `cd apps/server && bun run build` | `./apps/server/dist/` |
| **Extension Build** | `cd apps/extension && bun run build` | `./apps/extension/.output/` |
| **Extension ZIP** | `cd apps/extension && bun run zip` | `extension.zip` |

### 15.5 Update Process

```bash
# Pull latest changes
git pull origin main

# Update dependencies
bun install

# Restart backend
cd apps/server
bun run dev  # Restart

# Extension hot-reloads automatically
cd apps/extension
bun run dev
```

---

## 16. Timeline & Milestones

### 16.1 Development Phases

| Phase | Duration | Deliverables | Success Criteria |
|-------|----------|--------------|------------------|
| **Phase 1: Foundation** | Week 1-2 | Monorepo setup, WXT + Hono + Zvec integration | All components running locally |
| **Phase 2: Core AI** | Week 3-4 | Form detection, field mapping, memory search | 80%+ form detection accuracy |
| **Phase 3: Auto-Fill** | Week 5-6 | DOM manipulation, event triggering, visual indicators | Forms filled correctly on 5+ job sites |
| **Phase 4: Resume** | Week 7-8 | Resume upload, parsing, memory auto-generation | Resume data extracted and stored |
| **Phase 5: Polish** | Week 9-10 | UI improvements, error handling, testing | All test cases passing |
| **Phase 6: Cover Letter** | Week 11-12 | Cover letter generation, PDF export | PDF generated successfully |

### 16.2 Milestone Dates

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| M1: Project Setup Complete | Week 2 | Planned |
| M2: AI Form Detection Working | Week 4 | Planned |
| M3: Auto-Fill MVP | Week 6 | Planned |
| M4: Resume Integration | Week 8 | Planned |
| M5: Beta Release | Week 10 | Planned |
| M6: Full Release | Week 12 | Planned |

### 16.3 Sprint Breakdown

| Sprint | Duration | Focus |
|--------|----------|-------|
| Sprint 1 | 2 weeks | Foundation (Monorepo, WXT, Hono, Zvec) |
| Sprint 2 | 2 weeks | AI Integration (Vercel SDK, providers) |
| Sprint 3 | 2 weeks | Form Detection & Mapping |
| Sprint 4 | 2 weeks | Memory System (search, store) |
| Sprint 5 | 2 weeks | Auto-Fill Execution |
| Sprint 6 | 2 weeks | Resume Upload & Parsing |
| Sprint 7 | 2 weeks | UI Polish & Testing |
| Sprint 8 | 2 weeks | Cover Letter & PDF |

---

## 17. Risk Assessment

### 17.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI API rate limits | Medium | High | Cache form templates, reduce API calls |
| Zvec DB corruption | Low | High | Regular exports, backup mechanism |
| Form structure changes | High | Medium | Re-analyze with AI, update cache |
| Extension API changes | Low | High | Follow Chrome extension updates |
| Bun runtime instability | Low | Medium | Fallback to Node.js if needed |
| Vercel AI SDK breaking changes | Low | Medium | Pin versions, monitor changelog |

### 17.2 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API key exposure | Low | High | Store in backend .env only |
| Local data breach | Low | Medium | User education, local-only storage |
| Malicious form injection | Low | Medium | HTML sanitization before AI |
| CORS misconfiguration | Low | Medium | Strict origin validation |

### 17.3 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Setup complexity | Medium | High | Clear documentation, setup wizard |
| AI accuracy issues | Medium | Medium | Confidence thresholds, user override |
| Performance issues | Low | Medium | Performance monitoring, optimization |
| ToS violations | Medium | High | Manual submit only, user education |

### 17.4 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI provider pricing changes | Medium | Medium | Support multiple providers, switch easily |
| Job boards block automation | Medium | High | Manual submit, respect ToS |
| Competitor features | Low | Low | Focus on privacy, local-first advantage |

---

## 18. Success Metrics

### 18.1 Key Performance Indicators (KPIs)

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Time Saved per Application** | 80% reduction | 15 min → 3 min average |
| **Auto-Fill Accuracy** | > 85% | Fields correctly filled / total fields |
| **Memory Hit Rate** | > 75% | Fields found in memory / total fields |
| **User Satisfaction** | > 4.5/5 | Post-application survey |
| **Setup Completion Rate** | > 90% | Users who complete setup |
| **Daily Active Users** | User-dependent | Extension usage tracking (local) |
| **Applications per User/Month** | 10-50 | Application tracking data |

### 18.2 Technical Metrics

| Metric | Target | Monitoring |
|--------|--------|------------|
| **API Response Time** | < 2s average | Backend logs |
| **Error Rate** | < 1% | Error tracking |
| **Memory Search Accuracy** | > 85% confidence | Zvec query results |
| **Form Detection Accuracy** | > 80% | AI analysis results |
| **Extension Load Time** | < 2s | Performance API |

### 18.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Test Coverage** | > 80% | Coverage reports |
| **Bug Resolution Time** | < 48 hours | Issue tracking |
| **Code Review Coverage** | 100% | PR process |
| **Documentation Completeness** | 100% | Doc review checklist |

---

## 19. Future Considerations

### 19.1 Phase 2 Features (Post-MVP)

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Application Analytics** | P2 | Medium | Dashboard with application stats |
| **Email Templates** | P2 | Low | Auto-generate follow-up emails |
| **Interview Prep** | P3 | High | AI-generated interview questions |
| **Salary Negotiation** | P3 | Medium | AI-powered negotiation tips |
| **Multi-Language Support** | P3 | High | Support non-English job sites |
| **Browser Sync** | P3 | Medium | Sync memories across devices (encrypted) |
| **Team Mode** | P3 | High | Share memories within team (opt-in) |

### 19.2 Technical Improvements

| Improvement | Priority | Description |
|-------------|----------|-------------|
| **Local AI (Ollama)** | P2 | Run AI models locally, no API costs |
| **Encrypted Storage** | P2 | Encrypt Zvec DB at rest |
| **Incremental Backups** | P2 | Auto-backup memories to user's cloud |
| **Performance Optimization** | P2 | Optimize embedding search, caching |
| **Mobile Companion App** | P3 | View/edit memories on mobile |
| **Browser Expansion** | P3 | Firefox, Safari, Edge support |

### 19.3 Monetization Options (If Applicable)

| Model | Description | Viability |
|-------|-------------|-----------|
| **Open Source (Free)** | Community-driven, donations | High (personal project) |
| **Premium Features** | Advanced analytics, cloud sync | Medium |
| **Enterprise** | Team features, admin dashboard | Low (personal focus) |
| **Affiliate** | Job board partnerships | Low (conflict of interest) |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **WXT** | Web Extension Toolkit - Chrome extension development framework |
| **Hono** | Lightweight, fast web framework for Bun/Node.js |
| **Zvec** | In-process vector database (like SQLite for vectors) |
| **Vercel AI SDK** | Unified interface for multiple AI providers |
| **Semantic Search** | Search by meaning, not exact keywords |
| **Embedding** | Vector representation of text for semantic search |
| **Content Script** | Extension code that runs in web page context |
| **Service Worker** | Extension background process (Manifest V3) |
| **ToS** | Terms of Service (of job boards) |
| **Bun** | Fast JavaScript runtime and package manager |
| **tsdown** | Build tool for TypeScript projects |
| **Oxlint** | Fast TypeScript/JavaScript linter |
| **MCP** | Model Context Protocol - AI assistant configuration |

---

## Appendix B: References

| Resource | URL |
|----------|-----|
| WXT Documentation | https://wxt.dev |
| Hono Documentation | https://hono.dev |
| Zvec Documentation | https://github.com/alibaba/zvec |
| Vercel AI SDK | https://sdk.vercel.ai |
| Chrome Extension Docs | https://developer.chrome.com/docs/extensions |
| Bun Documentation | https://bun.sh |
| tsdown Documentation | https://github.com/egoist/tsdown |

---

## Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-15 | Development Team | Initial PRD with updated monorepo structure |
| | | | |

---

## ✅ Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| Development Lead | | | |

---

**END OF DOCUMENT**