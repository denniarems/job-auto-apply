# Phase 2 Research: Resume Ingestion & AI Intelligence

## Research Summary

This phase enables PDF resume ingestion with AI-powered extraction and semantic memory conversion. Key components: PDF parsing, multi-provider AI switching, structured data extraction, and natural language question generation.

---

## 1. PDF Text Extraction

### Recommended: `pdf-parse` Library

**Package**: `pdf-parse` (v2/v3) - `@mehmet-kozan/pdf-parse`

**Why**: 
- Pure TypeScript, cross-platform
- Works in Node.js and browser
- Supports URLs and Buffer input
- Handles hyperlinks, metadata, page extraction

**Usage**:
```typescript
import { PDFParse } from 'pdf-parse';

const parser = new PDFParse({ url: 'path/to/resume.pdf' });
const result = await parser.getText();
// result.text - concatenated plain text
// result.pages[] - per-page text
// result.total - page count
await parser.destroy();
```

**Error Handling**: 
- `PasswordException` - encrypted PDFs
- `InvalidPDFException` - corrupted files
- Set 10MB file size limit in extension before upload

---

## 2. Multi-Provider AI Switching

### Current Setup (Already Installed)

From `apps/server/package.json`:
```json
"@ai-sdk/anthropic": "^3.0.47",
"@ai-sdk/google": "^3.0.31",
"@ai-sdk/openai": "^3.0.33"
```

### Provider Switching Approaches

**Option A: Direct Model String** (Simplest)
```typescript
import { generateObject } from 'ai';

// Claude
const result = await generateObject({
  model: 'anthropic/claude-sonnet-4-20250514',
  ...
});

// Gemini  
const result = await generateObject({
  model: 'google/gemini-2.5-flash',
  ...
});
```

**Option B: Provider Registry** (Advanced)
```typescript
import { createProviderRegistry } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

const registry = createProviderRegistry({
  anthropic,
  google,
});

const model = registry.languageModel('anthropic > fast');
```

### Implementation for Phase 2

1. Add provider selection to extension popup (already exists as dropdown - see `App.tsx:63-67`)
2. Store selected provider in extension storage (`chrome.storage.local`)
3. Pass provider to server API calls via header or body
4. Server routes API calls to selected AI provider

### API Keys Management

Currently in `packages/env/src/server.ts`:
- `ANTHROPIC_API_KEY` - Claude
- `OPENAI_API_KEY` - OpenAI (for embeddings)
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini

Need to add: Qwen API key support (likely via OpenAI-compatible endpoint or custom provider).

---

## 3. Structured Resume Data Extraction

### Use: `generateObject` with Zod Schema

```typescript
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const ResumeSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  workHistory: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    year: z.string(),
  })),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })).optional(),
});

const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: ResumeSchema,
  prompt: `Extract structured resume data from:\n\n${resumeText}`,
});
```

### Confidence Scores

AI models don't provide confidence scores directly. Options:
1. **Prompt-based extraction confidence**: Ask model to rate each field's confidence (low/medium/high)
2. **Field presence check**: Flag empty/optional fields as "low confidence"
3. **Multiple extraction passes**: Compare results for consistency

---

## 4. Natural Language Question Generation (FORM-04)

### Requirement

Generate questions for each extracted field to enable vector similarity matching.

### Implementation

```typescript
const FieldQuestionSchema = z.object({
  fieldName: z.string(),
  naturalQuestion: z.string(),
  category: z.enum(['personal', 'experience', 'education', 'skills', 'other']),
});

const questions = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: z.object({
    questions: z.array(FieldQuestionSchema),
  }),
  prompt: `Generate natural language questions for resume fields to enable semantic matching.
  
  Fields: name, email, phone, location, summary, skills, work history, education, certifications, languages, projects, links.
  
  Examples:
  - "What is your full name?"
  - "What is your email address?"
  - "What are your technical skills?"
  - "Tell me about your work experience"
  - "Where did you go to school?"
  `,
});
```

### Memory Storage Format

For each resume field, store:
```typescript
{
  question: "What is your full name?",  // Generated question
  answer: extractedValue,                  // From resume
  category: "personal",
  source: "resume_2026-02-26",             // Tag with upload date
}
```

---

## 5. Extension-Server Communication

### Current Architecture

- Extension (`apps/extension`) uses React + WXT
- Server (`apps/server`) uses Hono + LanceDB
- Communication via HTTP REST API

### New Endpoints Needed

```typescript
// POST /api/resumes/upload
// Accepts: multipart/form-data with PDF file
// Returns: { uploadId, extractedData, confidence }

// POST /api/resumes/:id/approve
// Accepts: { approvedFields, editedFields }
// Returns: { memoriesCreated: number }

// GET /api/providers
// Returns: { available: ['anthropic', 'google'], configured: {...} }

// PATCH /api/providers/default
// Body: { provider: 'anthropic' | 'google' | 'qwen' }
```

### Extension UI Updates

1. **Resume Tab** (`resumes`):
   - Drag & drop zone + upload button
   - Progress spinner during extraction
   - Structured form view for extracted data
   - Edit fields before approval
   - "Save All to Memory" bulk approval button

2. **Settings Tab**:
   - Show API key status (checkmark/X) per provider
   - Provider dropdown with immediate switching
   - Default provider selection

---

## 6. Key Technical Decisions

| Decision | Recommendation |
|----------|----------------|
| PDF Library | `pdf-parse` (pure TS, widely used) |
| AI Extraction | `generateObject` with Zod schema |
| Provider Switching | Model string prefix (`provider/model`) |
| Qwen Support | OpenAI-compatible endpoint or custom provider |
| Question Generation | Separate LLM call after extraction |
| Memory Format | question + answer + category + source tag |

---

## 7. Dependencies to Add

### Server (`apps/server/package.json`)
```json
"pdf-parse": "^2.0.0"
```

### Existing (Already Available)
- `@ai-sdk/anthropic` - Claude
- `@ai-sdk/google` - Gemini  
- `@ai-sdk/openai` - GPT/Embedding
- `zod` - Schema validation (catalog)

---

## 8. Risk Areas

1. **PDF Parsing Failures**: Some PDFs are scanned images (OCR needed) or heavily formatted
   - Mitigation: Error message with retry option, document as limitation

2. **API Key Management**: Qwen may need custom OpenAI-compatible setup
   - Mitigation: Add to env package, use generic provider pattern

3. **Extraction Accuracy**: Complex layouts may confuse extraction
   - Mitigation: Show confidence indicators, allow manual edits

4. **Duplicate Memories**: Re-uploading resume should handle existing memories
   - Mitigation: Skip duplicates logic, overwrite with confirmation

---

## 9. File Structure Changes

```
apps/server/src/
├── routes/
│   ├── resumes.ts      (NEW - upload, extract, approve)
│   └── providers.ts   (NEW - list, switch)
├── lib/
│   ├── pdf.ts         (NEW - PDF parsing logic)
│   ├── extraction.ts  (NEW - AI extraction prompts)
│   └── questions.ts   (NEW - question generation)
└── index.ts           (register new routes)

apps/extension/entrypoints/sidepanel/
├── ResumeUpload.tsx   (NEW - drag/drop UI)
├── ResumeReview.tsx   (NEW - extracted data form)
└── App.tsx            (UPDATE - connect resume tab)
```

---

## 10. Success Criteria Mapping

| Criterion | Implementation |
|-----------|----------------|
| User uploads PDF, sees extracted data | POST /api/resumes/upload → structured form display |
| User approves, data converts to memories | POST /api/resumes/:id/approve → memory creation |
| Real-time provider switching | Dropdown → chrome.storage → server header |
| Natural language questions | GenerateObject with question schema → vector search |

---

*Research completed: 2026-02-26*
