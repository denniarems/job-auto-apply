# Phase 3: Form Detection & Auto-Fill Interaction - Research

**Researched:** 2026-02-26
**Domain:** Chrome Extension form detection, AI classification, DOM manipulation, React/Vue event simulation
**Confidence:** HIGH

## Summary

This phase implements form detection and auto-fill functionality for a Chrome extension targeting ATS systems (Greenhouse, Lever, Workday). The implementation requires:

1. **Form Detection**: Content script scans DOM for forms, sends DOM data to backend AI for classification
2. **Field Extraction**: AI extracts and categorizes fields semantically (personal, salary, experience)
3. **Memory Mapping**: AI matches fields to semantic memories using vector similarity
4. **Auto-Fill**: Character-by-character typing simulation with full event chain (focus, input, change, blur) for React/Vue compatibility
5. **Preview UI**: Modal overlay showing field mappings with confidence scores before filling

**Primary recommendation:** Use MutationObserver in content script for dynamic form detection, dispatch all React/Vue-compatible events during fill, implement honeypot detection via hidden field patterns.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Form Detection Approach:**
- **Detection method**: AI classification running on backend
- **Trigger**: On-demand scan (when user initiates)
- **Content analysis**: Content-first (analyze full page content)
- **User notification**: Extension icon badge
- **AI provider**: Dedicated lightweight model (separate from memory AI)
- **Field extraction**: AI field extraction
- **Detection threshold**: Conservative (high threshold default, users can lower)
- **Field identification**: All combined (known names + patterns + AI inference)
- **Honeypot handling**: Log skipped fields
- **ATS patterns**: ATS-specific patterns after detection
- **Fill trigger**: Manual trigger only
- **Form scanning**: Continuous monitoring for dynamically loaded forms
- **Field matching**: AI matching for field-to-memory mapping
- **Schema caching**: Local caching with periodic refresh
- **Fill flow**: Preview then fill

**Field-to-Memory Mapping:**
- **Mapping start**: Manual (when user initiates from extension)
- **Matching method**: AI matching (AI interprets both field and memory)
- **Confidence format**: Percentage score (0-100)
- **Cardinality**: Many-to-one (multiple memories can fill one field)
- **Candidate display**: Show all candidates, let user pick best
- **Mapping UI**: Both extension popup and in-page overlay
- **Priority**: Meaning-first (semantic meaning over exact label match)
- **Unmapped fields**: Prompt user to provide value
- **Usage tracking**: Track all fills, update stats (usage count, last_used)
- **Preference learning**: Learn user preferences for field mappings
- **Matching provider**: Lightweight/fast provider for matching
- **Field attributes**: All attributes (label, name, id, placeholder, surrounding text)
- **Common fields**: AI-only (no presets, always use AI)
- **No match handling**: Create new memory on the spot
- **Tie-breaking**: Ask user to choose when equal confidence
- **Confidence display**: Always show confidence percentage
- **Stored mappings**: Hybrid (per-site and global)

**Auto-Fill Behavior:**
- **Fill method**: Simulate typing (character by character with delays)
- **Fill order**: Sequential (in DOM order)
- **Fill mode**: Fill all at once after confirmation
- **Visual feedback**: Show filling visually (focus on each field)
- **Status reporting**: Per-field status (success/fail after each field)
- **Visual indicators**: Color coding (green=filled, red=failed)
- **Existing values**: Skip if field has value
- **Completion notification**: Page toast (at top of page)

**User Control & Prompts:**
- **Trigger method**: Popup button (large button in extension popup)
- **Preview**: Show preview dialog before filling
- **Confirmation**: Explicit confirm (user must click Fill button)
- **Preview content**: Field-by-field with mapped values
- **Confidence in preview**: Both percentage and color-coded
- **Mapping changes**: Allow users to modify mappings in preview
- **Remember changes**: Per-site (permanent for that ATS)
- **Unmapped fields in preview**: Prompt to create new memory
- **Confirmation requirement**: Always confirm before any fill
- **Cancel during fill**: Cancel all button stops entire process
- **After-fill message**: Success message with toast
- **Undo**: No undo (fill is permanent)

### Claude's Discretion
None - all aspects are locked by user decisions.

### Deferred Ideas (OUT OF SCOPE)
- Cover letter generation — Phase 4
- Application tracking/history — Phase 4

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FORM-01 | Detect job application forms with >80% confidence using AI analysis of DOM structure | Backend AI classification endpoint, content script DOM scanning |
| FORM-02 | Identify form fields semantically and map them to standard categories (personal, salary, experience, etc.) | AI field extraction with semantic categorization |
| FORM-03 | Support "Big Three" ATS systems: Greenhouse, Lever, and Workday | ATS-specific selector patterns, multi-step form handling |
| FILL-01 | Automatically fill identified fields with memory values using robust event simulation (focus, input, change, blur) for React/Vue compatibility | Full event chain dispatch, MutationObserver for dynamic fields |
| FILL-02 | Provide visual indicators (color-coded borders) showing the source of each filled value (Memory, Resume, Manual) | CSS border styling based on source enum |
| FILL-03 | Handle multi-step forms by maintaining state across page transitions | State persistence, form navigation detection |
| FILL-04 | Explicitly skip "Honeypot" fields (hidden fields) to avoid bot detection | Honeypot field detection patterns |
| UI-02 | Show real-time progress panels and status indicators during form analysis and filling | Progress UI in preview overlay |
| UI-03 | Display a user input dialog for fields with no high-confidence memory matches | Unmapped field input dialog |

</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Hono | ^4.8.2 | Backend API for AI classification | Already in project, lightweight |
| LanceDB | ^0.26.2 | Local vector DB for memories | Already in project |
| Vercel AI SDK | ^3.0.0 | Unified AI provider interface | Already in project |
| WXT | ^0.19.0 | Chrome extension framework | Already in project |
| React | ^18.0.0 | Extension UI | Standard for modern extensions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.x | Server state management | For API calls in React UI |
| zustand | ^5.x | Client state management | For extension state (form state, fill progress) |
| react-hot-toast | ^4.x | Toast notifications | For page-level success/error notifications |
| @dnd-kit/core | ^6.x | Drag and drop | For reordering field mappings in preview |

### ATS-Specific DOM Patterns
| ATS | Common Selectors | Notes |
|-----|-------------------|-------|
| Greenhouse | `[data-qa*="application"]`, `.application-form` | Single page, iframe possible |
| Lever | `.application-form`, `[data-modal*="application"]` | Multi-step with tabs |
| Workday | `.W(-)?[0-9]+`, complex shadow DOM | Shadow DOM handling needed |

**Installation:**
```bash
# Backend API routes will use existing dependencies
# Frontend extension - add to apps/extension/package.json:
npm install @tanstack/react-query zustand react-hot-toast @dnd-kit/core
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/
├── server/
│   └── src/
│       ├── routes/
│       │   ├── forms.ts          # NEW: Form detection & classification
│       │   ├── fields.ts         # NEW: Field extraction & mapping
│       │   └── mappings.ts       # NEW: Field-to-memory mappings
│       ├── lib/
│       │   ├── ats-detector.ts    # NEW: ATS-specific pattern detection
│       │   └── honeypot.ts        # NEW: Honeypot field detection
│       └── types/
│           └── forms.ts          # NEW: Type definitions
├── extension/
│   └── entrypoints/
│       ├── content.ts            # Form detection, fill execution
│       ├── components/
│       │   ├── PreviewDialog.tsx # NEW: Field mapping preview
│       │   ├── FieldCard.tsx     # NEW: Individual field display
│       │   ├── FillProgress.tsx  # NEW: Progress indicator
│       │   └── UnmappedInput.tsx # NEW: Input for unmapped fields
│       ├── hooks/
│       │   ├── useFormDetection.ts  # NEW: Form scanning logic
│       │   ├── useAutoFill.ts        # NEW: Fill execution
│       │   └── useFieldMapping.ts    # NEW: Memory matching
│       └── utils/
│           ├── dom.ts            # NEW: DOM utilities
│           ├── events.ts         # NEW: Event simulation
│           └── ats-patterns.ts   # NEW: ATS-specific selectors
```

### Pattern 1: Form Detection Flow

**What:** User-triggered form scanning with AI classification backend

**When to use:** When user clicks "Scan for Forms" in extension popup

**Architecture:**
1. Content script extracts DOM form data (not screenshots)
2. Send structured form data to backend `/api/forms/detect`
3. Backend runs AI classification
4. Returns confidence score + detected fields
5. Extension updates badge to show form found
6. User can trigger preview from popup

**Example:**
```typescript
// Content script - form detection trigger
async function detectForms(): Promise<FormDetectionResult> {
  const forms = Array.from(document.querySelectorAll('form'));
  const formData = forms.map(form => ({
    action: form.action,
    method: form.method,
    fields: extractFieldInfo(form),
    surroundingText: getSurroundingText(form),
  }));
  
  const response = await chrome.runtime.sendMessage({
    type: 'DETECT_FORMS',
    payload: formData,
  });
  
  return response;
}

function extractFieldInfo(form: HTMLFormElement): FieldInfo[] {
  const inputs = form.querySelectorAll('input, select, textarea');
  return Array.from(inputs).map(input => ({
    type: input.type,
    name: input.name,
    id: input.id,
    label: findLabel(input),
    placeholder: input.placeholder,
    required: input.required,
    autocomplete: input.autocomplete,
    cssHidden: isHidden(input),
  }));
}
```

### Pattern 2: Event Simulation for React/Vue

**What:** Full event chain dispatch ensuring framework reactivity

**When to use:** Before filling each form field

**Critical for:** React, Vue, Angular, Svelte - frameworks that track input via events, not just value property

**Example:**
```typescript
// Source: https://github.com/facebook/react/issues/19896 (React autofill issue)
async function fillField(element: HTMLElement, value: string): Promise<void> {
  // 1. Focus - triggers onFocus handlers
  element.focus();
  
  // 2. Clear existing value for input types
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = '';
  }
  
  // 3. Type character by character (simulates real typing)
  // This is slower but ensures React/Vue event handlers fire
  for (const char of value) {
    element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: char,
    }));
    
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value += char;
    }
    
    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: char,
    }));
    
    // Random delay between keystrokes (human-like)
    await sleep(20 + Math.random() * 50);
  }
  
  // 4. Trigger change (React tracks this for controlled components)
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // 5. Blur - some forms validate on blur
  element.blur();
}

// Alternative: For select dropdowns
async function selectOption(select: HTMLSelectElement, value: string): Promise<void> {
  select.focus();
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  select.dispatchEvent(new Event('blur', { bubbles: true }));
}
```

### Pattern 3: Honeypot Detection

**What:** Identify hidden fields that are honeypots and skip them

**When to use:** Before processing any form field

**Example:**
```typescript
// Source: https://css-tricks.com/building-a-honeypot-field-that-works/
function isHoneypotField(element: HTMLElement): boolean {
  // Skip hidden input types (common honeypot)
  if (element instanceof HTMLInputElement) {
    if (element.type === 'hidden') return true;
  }
  
  // Check CSS-based hiding
  const style = window.getComputedStyle(element);
  if (style.display === 'none') return true;
  if (style.visibility === 'hidden') return true;
  if (style.opacity === '0') return true;
  
  // Check for common honeypot field names
  const honeypotNames = [
    'website', 'url', 'homepage',
    'confirm_email', 'email_confirm',
    'spam_check', 'bot_check',
    'first_name', 'last_name' // when duplicated
  ];
  const name = (element.name || '').toLowerCase();
  if (honeypotNames.includes(name)) return true;
  
  // Check position off-screen
  const rect = element.getBoundingClientRect();
  if (rect.left < -1000 || rect.top < -1000) return true;
  
  // Check for honeypot-specific CSS classes
  if (element.classList.contains('honeypot')) return true;
  if (element.classList.contains('bot-field')) return true;
  
  return false;
}

// Log skipped honeypots for debugging
function logHoneypot(field: FieldInfo, reason: string): void {
  console.log('[Honeypot Skipped]', {
    name: field.name,
    id: field.id,
    type: field.type,
    reason,
    timestamp: Date.now(),
  });
}
```

### Pattern 4: Preview Dialog with In-Page Overlay

**What:** Modal overlay rendered in-page (not in extension popup) for field mapping preview

**When to use:** Before auto-fill execution

**Why in-page:** Popup has size limitations; in-page overlay provides more space for complex forms

**Example:**
```typescript
// Create overlay container in page
function createPreviewOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'job-auto-apply-preview';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  return dialog;
}

// Render field mappings
function renderFieldMappings(mappings: FieldMapping[]): void {
  const dialog = createPreviewOverlay();
  
  dialog.innerHTML = `
    <h2>Auto-Fill Preview</h2>
    <p>Review field mappings before filling</p>
    <div class="fields">
      ${mappings.map(m => `
        <div class="field-card ${getConfidenceClass(m.confidence)}">
          <div class="field-label">${m.fieldLabel}</div>
          <div class="field-value">${m.mappedValue || '(No match)'}</div>
          <div class="confidence">${Math.round(m.confidence * 100)}%</div>
        </div>
      `).join('')}
    </div>
    <div class="actions">
      <button class="cancel">Cancel</button>
      <button class="confirm">Fill Fields</button>
    </div>
  `;
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.8) return 'confidence-high';
  if (confidence >= 0.6) return 'confidence-medium';
  return 'confidence-low';
}
```

### Pattern 5: MutationObserver for Dynamic Forms

**What:** Watch for DOM changes to detect dynamically loaded forms

**When to use:** After initial page load to catch forms added via AJAX/SPA navigation

**Example:**
```typescript
function observeDynamicForms(onFormDetected: (form: HTMLFormElement) => void): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          // Check if added node is a form
          if (node.tagName === 'FORM') {
            onFormDetected(node);
          }
          // Check if form was added as child
          const forms = node.querySelectorAll('form');
          forms.forEach(onFormDetected);
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI classification | Build custom classifier | Use Vercel AI SDK with Claude/Gemini | DOM classification requires LLM reasoning, not simple rules |
| Field semantic mapping | Regex-based field matching | Vector similarity + AI interpretation | Too many variations in field names/labels |
| React/Vue event simulation | Just set .value | Dispatch full event chain | Modern frameworks ignore value property, only track events |
| ATS field detection | Hardcoded selectors only | AI + patterns combined | ATS sites change; AI adapts better |
| Toast notifications | Custom notification system | react-hot-toast | Battle-tested, accessible, easy to style |

**Key insight:** Form filling seems simple (set value, submit) but React/Vue and ATS complexity makes it deceptively hard. The event simulation pattern is critical—simply setting `.value` won't trigger React's state updates.

---

## Common Pitfalls

### Pitfall 1: React Controlled Component Not Updating
**What goes wrong:** Field shows filled value visually but form submission sends empty value
**Why it happens:** React controlled components only update state via event handlers, not via direct value manipulation
**How to avoid:** Always dispatch `input` and `change` events after setting value
**Warning signs:** Filled fields revert, validation fails, console shows "uncontrolled to controlled" warnings

### Pitfall 2: Honeypot Fields Being Filled
**What goes wrong:** Filling hidden/bot-detection fields causes form rejection or account flags
**Why it happens:** Not checking for hidden fields before filling
**How to avoid:** Run `isHoneypotField()` check on every field before filling
**Warning signs:** Forms reject submission, "bot detected" messages appear

### Pitfall 3: Shadow DOM Fields Not Detected
**What goes wrong:** Workday and some ATS use shadow DOM; standard querySelector misses them
**Why it happens:** `document.querySelectorAll` doesn't pierce shadow DOM
**How to avoid:** Use custom function to walk shadow roots: `querySelectorAllDeep()`
**Warning signs:** Forms exist but "no fields found" on specific ATS sites

### Pitfall 4: Multi-Step Form State Lost
**What goes wrong:** Fill works on step 1, but step 2 fields are empty when navigating
**Why it happens:** Each step may be separate form, or SPA navigation clears state
**How to avoid:** Detect step navigation, re-scan after each step, maintain mapping state across steps
**Warning signs:** Complex forms with "Next" buttons that don't submit

### Pitfall 5: Fill Order Race Conditions
**What goes wrong:** Multiple fields fill simultaneously, validation triggers on wrong field
**Why it happens:** Not awaiting each field fill sequentially
**How to avoid:** Always fill sequentially with `await`, not in parallel with `Promise.all()`
**Warning signs:** Validation errors, fields filled in wrong order, form won't submit

### Pitfall 6: ATS iframe Isolation
**What goes wrong:** Can't access form fields inside iframe (common in Greenhouse)
**Why it happens:** Cross-origin iframe blocked by browser security
**How to avoid:** Request iframe access permission, detect iframe forms and notify user
**Warning signs:** Forms visible but "no fields detected" on specific ATS

---

## Code Examples

### API Route: Form Detection

```typescript
// Source: Based on project patterns from apps/server/
import { Hono } from 'hono';
import { generateEmbedding } from '../lib/ai';

const router = new Hono();

interface FormField {
  type: string;
  name: string;
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
}

interface FormData {
  action: string;
  method: string;
  fields: FormField[];
  url: string;
}

router.post('/detect', async (c) => {
  const forms: FormData[] = await c.req.json();
  const url = c.req.query('url') || '';
  
  // Build prompt for AI classification
  const prompt = `Analyze these form fields and determine if this is a job application form.
  
URL: ${url}
Forms: ${JSON.stringify(forms, null, 2)}
  
Respond with JSON:
{
  "isJobApplication": boolean,
  "confidence": number (0-1),
  "atsType": "greenhouse" | "lever" | "workday" | "other" | null,
  "detectedFields": [{ "category": string, "semanticName": string, "inputName": string }]
}`;

  // Use lightweight model for classification
  const response = await c.env.AI.generate(prompt, {
    model: 'claude-3-haiku',
    max_tokens: 500,
  });
  
  const result = JSON.parse(response.text);
  return c.json(result);
});

router.post('/extract-fields', async (c) => {
  const { fields, context } = await c.req.json();
  
  const prompt = `For each field, determine its semantic category and generate a natural language question for memory matching.
  
Fields: ${JSON.stringify(fields, null, 2)}
Context: ${context}
  
Respond with:
{
  "fields": [{
    "original": field,
    "category": "personal" | "contact" | "experience" | "education" | "salary" | "skills" | "other",
    "semanticQuestion": "What is your {semantic name}?",
    "memoryKeywords": ["keyword1", "keyword2"]
  }]
}`;

  const response = await c.env.AI.generate(prompt, {
    model: 'claude-3-haiku',
    max_tokens: 1000,
  });
  
  return c.json(JSON.parse(response.text));
});

export default router;
```

### Field-to-Memory Matching

```typescript
// Source: Based on existing memories.ts pattern
interface MemoryMatch {
  memoryId: string;
  question: string;
  answer: string;
  confidence: number;
  source: 'memory' | 'resume' | 'manual';
}

async function matchFieldToMemories(
  field: ExtractedField,
  memories: Memory[]
): Promise<MemoryMatch[]> {
  // Generate embedding for field's semantic question
  const fieldVector = await generateEmbedding(field.semanticQuestion);
  
  // Search memories by vector similarity
  const matches = await memoriesTable
    .vectorSearch(fieldVector)
    .limit(5)
    .toArray();
  
  // Score and rank matches
  const results: MemoryMatch[] = [];
  
  for (const memory of matches) {
    // Additional AI verification for borderline matches
    if (memory.score >= 0.85) {
      results.push({
        memoryId: memory.id,
        question: memory.question,
        answer: memory.answer,
        confidence: memory.score,
        source: memory.source,
      });
    } else if (memory.score >= 0.6) {
      // AI verify borderline matches
      const verified = await verifyMatch(field, memory);
      if (verified) {
        results.push({
          memoryId: memory.id,
          question: memory.question,
          answer: memory.answer,
          confidence: memory.score,
          source: memory.source,
        });
      }
    }
  }
  
  // Sort by confidence descending
  return results.sort((a, b) => b.confidence - a.confidence);
}
```

### Fill Execution with Visual Feedback

```typescript
// Source: Event simulation pattern research
interface FillProgress {
  total: number;
  completed: number;
  current: string;
  status: 'pending' | 'filling' | 'success' | 'failed';
}

async function executeAutoFill(
  mappings: FieldMapping[],
  onProgress: (progress: FillProgress) => void
): Promise<FillResult[]> {
  const results: FillResult[] = [];
  
  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    const element = mapping.element;
    
    // Skip if already has value
    if (element instanceof HTMLInputElement && element.value.trim()) {
      results.push({ field: mapping, success: true, skipped: true });
      continue;
    }
    
    // Report filling status
    onProgress({
      total: mappings.length,
      completed: i,
      current: mapping.fieldLabel,
      status: 'filling',
    });
    
    try {
      // Add visual indicator - focusing
      element.style.outline = '2px solid #3b82f6';
      element.style.borderColor = '#3b82f6';
      
      // Execute fill with event simulation
      await fillField(element, mapping.mappedValue);
      
      // Mark success
      element.style.outline = '2px solid #22c55e';
      element.style.borderColor = '#22c55e';
      
      results.push({ field: mapping, success: true });
    } catch (error) {
      // Mark failed
      element.style.outline = '2px solid #ef4444';
      element.style.borderColor = '#ef4444';
      
      results.push({ field: mapping, success: false, error: String(error) });
    }
    
    // Brief pause between fields
    await sleep(200);
  }
  
  // Final status
  onProgress({
    total: mappings.length,
    completed: mappings.length,
    current: '',
    status: 'success',
  });
  
  return results;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct value assignment | Event simulation chain | React 16+ | Value-only doesn't trigger state |
| Screenshot-based AI | DOM-first + AI analysis | 2024 | Faster, cheaper, more reliable |
| Exact field name matching | Vector + AI semantic matching | 2023 | Handles field variations |
| Popup-based preview | In-page overlay | WXT成熟 | More screen space for mappings |
| Manual ATS selectors | AI + patterns hybrid | Current | Adapts to ATS changes |

**Deprecated/outdated:**
- `input.value = text` without events - Won't work with React/Vue controlled components
- Hardcoded ATS selectors only - Site changes break frequently
- Screenshot sending to AI - Expensive, slow, overkill for form detection

---

## Open Questions

1. **ATS iframe handling**
   - What we know: Greenhouse often uses iframes for application forms
   - What's unclear: How to detect and handle cross-origin iframes gracefully
   - Recommendation: Detect iframe forms, show user instruction to fill manually, or request expanded permissions

2. **Shadow DOM field detection**
   - What we know: Workday uses shadow DOM extensively
   - What's unclear: Performance impact of walking all shadow roots on complex pages
   - Recommendation: Implement `querySelectorAllDeep()` but throttle to avoid performance issues

3. **Fill reliability vs speed**
   - What we know: Character-by-character is most reliable but slowest
   - What's unclear: Optimal delay per character balance
   - Recommendation: Default to 30-50ms, make configurable, test on target ATS

---

## Validation Architecture

> Skipped - workflow.nyquist_validation is false in .planning/config.json

---

## Sources

### Primary (HIGH confidence)
- Hono framework docs - API route patterns
- React GitHub Issue #19896 - onBlur events not called when autofilled
- CSS-Tricks: Building a Honeypot Field That Works - Honeypot detection
- WXT Framework - Extension architecture

### Secondary (MEDIUM confidence)
- WebSearch: Chrome extension form detection patterns
- WebSearch: MutationObserver for dynamic form detection
- WebSearch: React Vue form autofill event simulation

### Tertiary (LOW confidence)
- WebSearch: ATS-specific selector patterns (limited public documentation)
- WebSearch: Chrome extension modal overlay implementations

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing project dependencies, verified versions
- Architecture: HIGH - Based on project patterns, React/Vue event patterns verified
- Pitfalls: HIGH - Common issues well-documented in React community
- ATS patterns: MEDIUM - Some patterns verified, some require testing

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (30 days - stable domain)
