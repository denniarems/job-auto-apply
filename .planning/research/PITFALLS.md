# Pitfalls Research: Job Auto-Apply Extension

**Domain:** Job Application Automation / Chrome Extensions
**Researched:** 2025-02-25
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Workday/ATS React State Sync Failure

**What goes wrong:**
The extension fills a form field (e.g., `input.value = "John Doe"`), but when the user clicks "Next" or "Submit," the data disappears or triggers a "Required Field" error.

**Why it happens:**
Modern ATS platforms like Workday use older, heavily customized React versions that do not sync internal state with standard DOM `value` updates. They listen for a specific sequence of keyboard events to update their underlying data model.

**How to avoid:**
Dispatch a full event sequence for every field: `focus` -> `keydown` -> `keypress` -> `input` -> `keyup` -> `change` -> `blur`. Ensure the `input` event has `{ bubbles: true }`.

**Warning signs:**
Fields appearing filled visually but showing red validation errors upon submission or page transition.

**Phase to address:**
Phase 1 (Core Extension / Form Filling logic)

---

### Pitfall 2: Honeypot Detection (Shadow Bans)

**What goes wrong:**
The application is submitted successfully, but the candidate never hears back, or the account is silently flagged as a "bot."

**Why it happens:**
ATS platforms (Greenhouse, Lever) include "trap" fields hidden via CSS (`display: none`), off-screen positioning (`left: -9999px`), or `tabindex="-1"`. If these are filled, it's a definitive signal of non-human automation.

**How to avoid:**
Implement a strict visibility check before filling any element: verify `element.offsetParent !== null`, check computed styles for `visibility: hidden` or `opacity: 0`, and respect `tabindex="-1"`.

**Warning signs:**
Immediate "rejection" emails (within seconds) or a total lack of response from platforms that usually acknowledge receipt.

**Phase to address:**
Phase 1 (Form Detection) & Phase 3 (ATS Specific Support)

---

### Pitfall 3: AI Hallucinations in Required Fields

**What goes wrong:**
The AI fills a required field (e.g., "Reason for leaving previous job") with plausible but fake information because the data wasn't in the user's resume or memory.

**Why it happens:**
LLMs are optimized to be helpful and complete tasks. Without strict negative constraints, they will "hallucinate" an answer to satisfy a "required" field mapping.

**How to avoid:**
Use strict prompt engineering: "If the information is not present in the provided context, return 'NOT_FOUND' or ask the user." Implement a "Visual Source Indicator" so users can see which fields were "guessed" vs. "extracted."

**Warning signs:**
Inaccurate or generic-sounding answers in filled forms that the user didn't explicitly provide.

**Phase to address:**
Phase 2 (AI Form Detection & Mapping)

---

### Pitfall 4: Manifest V3 Service Worker Termination

**What goes wrong:**
The extension stops working mid-process (e.g., while analyzing a large form or waiting for an AI response), or the popup state is lost.

**Why it happens:**
Chrome Manifest V3 service workers are ephemeral. They terminate after 30 seconds of inactivity or a 5-minute hard limit. Global variables are wiped on termination.

**How to avoid:**
Use the `browser.storage` (via WXT Storage) for all state. Use `browser.alarms` for periodic tasks. For long-running AI calls, use a "Keep-Alive" ping or an Offscreen Document to prevent the worker from idling.

**Warning signs:**
"Extension context invalidated" errors in the console or the extension "freezing" during long tasks.

**Phase to address:**
Phase 1 (Core Architecture)

---

### Pitfall 5: CORS/CSP Blocking Localhost Communication

**What goes wrong:**
The extension content script fails to send form data to `http://localhost:3000` or receive a response.

**Why it happens:**
Many job boards (LinkedIn, Workday) have strict Content Security Policies (CSP) that block requests to any origin not explicitly whitelisted, including `localhost`.

**How to avoid:**
Never make network requests directly from the **Content Script**. Always send a message to the **Background Service Worker** (`browser.runtime.sendMessage`), which has elevated permissions and is not restricted by the host site's CSP.

**Warning signs:**
"Refused to connect to 'http://localhost:3000' because it violates the following Content Security Policy directive" errors in the dev tools.

**Phase to address:**
Phase 1 (Backend Integration)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Instant Fill | Easier to code. | High detection risk (bot-like). | Never (even in MVP). |
| Hardcoded Selectors | Fast initial support for 1 site. | Breaks immediately when site updates CSS. | Only for extremely stable platforms (Lever). |
| Global Variables in SW | Simpler state management. | State disappears when worker idles. | Never in Manifest V3. |
| Skipping "Unsure" Checks | Higher "Success" rate in demos. | Low quality/hallucinated applications. | Only for non-required fields in MVP. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Vercel AI SDK** | Naming collision with Hono's `streamText`. | Import Vercel's as `streamText` and use `toDataStreamResponse()`. |
| **Bun Runtime** | Streaming responses hanging in production. | Use `toTextStreamResponse()` or ensure Bun 1.1+; test in prod environment. |
| **Greenhouse** | Ignoring "Real Talent" AI detection. | Vary phrasing in AI-generated cover letters; avoid identical mass-templates. |
| **LanceDB** | Not handling concurrent writes from multiple tabs. | Use the Hono backend as the single source of truth for DB writes. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Semantic Memory Bloat | Slow search latency; high memory usage. | Implement memory pruning or vector clustering; limit context size. | > 1,000 memory entries. |
| Recursive DOM Traversal | Browser lag on large Workday forms. | Use `TreeWalker` and limit depth; cache found elements. | Forms with > 500 inputs. |
| Large PDF Parsing | Extension crash or timeout. | Parse PDFs in the Hono backend, not the Extension service worker. | > 5MB Resumes. |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| API Keys in Extension | User's keys exposed in `local.storage`. | Keep keys in the backend `.env` on `localhost`; extension never sees them. |
| Exposing localhost to Web | Malicious sites probing `localhost:3000`. | Bind Hono to `127.0.0.1` only; implement a simple shared secret/token. |
| Data Leakage via AI | Sending PII (SSN, etc.) to AI providers. | Sanitize/Scrub sensitive PII before sending to LLM for form mapping. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Overwriting Edits | Frustration when AI overwrites a user's manual correction. | Only fill empty fields; use "Visual Indicators" for AI-filled values. |
| No Progress Feedback | User thinks extension is broken during 10s AI analysis. | Show "Analyzing Form..." status in the content script overlay/badge. |
| Missing Required Fields | Submission fails after user thought they were done. | Explicitly flag missing required fields in a "Review Dialog." |

## "Looks Done But Isn't" Checklist

- [ ] **Form Filling:** Often missing **Searchable Dropdowns** — verify simulation of click-search-select sequence.
- [ ] **Workday Support:** Often missing **iframe traversal** — verify content scripts are injected into all frames.
- [ ] **Resume Parsing:** Often missing **multi-column handling** — verify text extraction order for standard PDF layouts.
- [ ] **Memory Storage:** Often missing **Stale Data Updates** — verify that updating a field in a form updates the vector DB.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Shadow Ban** | HIGH | Change browser profile, use a VPN/Proxy, and slow down application frequency. |
| **State Loss (MV3)** | MEDIUM | Implement robust `browser.storage` persistence for all "In-Progress" applications. |
| **Incorrect Memory Fill** | LOW | User corrects the field; extension captures the correction and updates LanceDB. |
| **CORS Block** | MEDIUM | Refactor all network calls to use the Background Service Worker as a proxy. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| React State Sync | Phase 1 | Test on a Workday demo site; verify data persists after "Next". |
| Honeypot Filling | Phase 1 | Audit form detection logs to ensure `display:none` elements are ignored. |
| LLM Hallucinations | Phase 2 | Run evaluation prompts with "Missing Data" scenarios; check for "NOT_FOUND". |
| Service Worker Timeout | Phase 1 | Stress test background tasks > 30s; verify no state loss on manual SW kill. |
| CSP/CORS Blocking | Phase 1 | Attempt a fetch from `content_script` to `localhost`; ensure it fails/proxies. |

## Sources

- [Chromium Documentation: Manifest V3 Migration](https://developer.chrome.com/docs/extensions/develop/migrate/service-workers)
- [WXT Documentation: Background Entrypoints](https://wxt.dev/guide/entrypoints/background.html)
- [Vercel AI SDK Docs: Streaming with Hono](https://sdk.vercel.ai/docs/getting-started/hono)
- [Community Discussion: Automating Workday Forms](https://news.ycombinator.com/item?id=38456210)
- [IvyForms Engineering Blog: Detecting Auto-fill Bots](https://ivyforms.com/blog/detection)

---
*Pitfalls research for: Job Auto-Apply Extension*
*Researched: 2025-02-25*
