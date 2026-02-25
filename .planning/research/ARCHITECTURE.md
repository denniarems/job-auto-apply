# Architecture Patterns

**Domain:** Job Auto-Apply Chrome Extension
**Researched:** 2026-02-25
**Overall Confidence:** HIGH

## Recommended Architecture

The system follows a **local-first distributed architecture** spread across three main environments: the Browser DOM (Content Scripts), the Extension Background (Service Worker), and a Local Node Server (Hono).

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Content Script** | DOM scanning, form field detection, UI overlays, field injection. | Service Worker (Messaging) |
| **Extension UI (Popup/Overlay)** | AI provider selection, manual field entry, status display, memory management. | Service Worker, Hono Backend (HTTP) |
| **Service Worker** | State orchestration, message routing, API key management (extension-side). | Content Script, Extension UI, Hono Backend |
| **Hono Backend** | Form analysis logic, resume parsing, AI provider routing, memory retrieval. | Extension, LanceDB, AI Providers (External) |
| **LanceDB** | Embedded semantic memory storage. Persistent storage of embeddings. | Hono Backend |
| **Vercel AI SDK** | Unified interface for Claude, Gemini, and Qwen. | Hono Backend, External AI Providers |

### Data Flow

#### 1. Form Analysis & Filling
1. **Detection**: Content Script scans for forms on page load or DOM change.
2. **Schema Extraction**: Content Script builds a JSON schema of the form (labels, types, IDs) and sends it to the **Service Worker**.
3. **Enrichment**: Service Worker forwards the request to **Hono Backend** (`localhost:3000`).
4. **Semantic Search**: Hono Backend generates embeddings for form fields and queries **LanceDB** for matching "Memory" items.
5. **AI Inference**: Hono uses **Vercel AI SDK** to map the user's profile/resume and semantic memory to the specific form schema.
6. **Injection**: Hono returns a mapping object. Content Script iterates and injects values into the DOM, triggering native input events.

#### 2. Continuous Learning (Memory)
1. **Capture**: User corrects an auto-filled field or fills a missing one.
2. **Submission**: User clicks "Save to Memory" in the extension overlay.
3. **Storage**: Hono Backend generates an embedding for the field label/context and stores it + the value in **LanceDB**.

## Patterns to Follow

### Pattern 1: Shadow DOM UI Overlays
**What:** Use Shadow DOM to inject visual indicators (e.g., small icons next to fields indicating the data source: Memory, Resume, or AI).
**When:** Displaying metadata or controls directly on the job application page.
**Example:**
```typescript
const shadowRoot = hostElement.attachShadow({ mode: 'closed' });
const indicator = document.createElement('div');
indicator.textContent = '🤖'; // AI sourced
shadowRoot.appendChild(indicator);
```

### Pattern 2: Local-First Semantic Retrieval
**What:** Use LanceDB for fast, local vector search.
**When:** Matching a form field (e.g., "Tell us about a time you failed") to a stored memory chunk.
**Why:** Maintains privacy by keeping sensitive personal history local while providing "smarter than keyword" matching.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct AI Calls from Extension
**What:** Calling OpenAI/Anthropic APIs directly from the content script or service worker.
**Why bad:** Exposes API keys in the extension source (even if obfuscated) and bypasses the structured processing/local memory layer.
**Instead:** Always route through the Hono Backend.

### Anti-Pattern 2: Global CSS Injection
**What:** Injecting a standard `<style>` tag into the host page.
**Why bad:** Job boards (LinkedIn, Indeed) have complex CSS that will conflict with your UI, or your UI will break their layout.
**Instead:** Use Shadow DOM or Iframes for all injected UI.

## Scalability & Performance Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Latency** | Sub-100ms local calls. | Stable (Local-first). | Stable (Local-first). |
| **LanceDB Search** | Instant (<1ms). | Instant (<5ms). | Fast (<20ms) due to embedded nature. |
| **Privacy** | Zero data leak. | Zero data leak. | Zero data leak. |

## Suggested Build Order

1. **Phase 1: Local Foundation** (Hono + LanceDB): Ensure data can be stored and retrieved semantically on localhost.
2. **Phase 2: Extension Plumbing** (WXT + Content Script): Establish the communication bridge between the browser page and the local server.
3. **Phase 3: Semantic Engine**: Implement the Vercel AI SDK mapping logic and resume parsing.
4. **Phase 4: UI/UX Overlay**: Add the Shadow DOM indicators and user correction dialogs.

## Sources

- [Chrome Extension Documentation - Architecture](https://developer.chrome.com/docs/extensions/mv3/architecture-overview/)
- [LanceDB Documentation](https://lancedb.com)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Hono Web Framework](https://hono.dev)
- [WXT Framework](https://wxt.dev)
