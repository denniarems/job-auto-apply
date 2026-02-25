# Technology Stack

**Project:** Job Auto-Apply Extension
**Researched:** 2026-02-25
**Overall Confidence:** HIGH

## Recommended Stack

### Core Frameworks
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Bun** | latest | Runtime | Faster startup, integrated test runner, and workspace support. |
| **Hono** | latest | Backend API | Extremely fast, lightweight, and runs perfectly on Bun. |
| **WXT** | latest | Extension Framework | Modern DX for Chrome extensions, Vite-based, handles Manifest V3 complexity. |
| **React** | 18+ | Extension UI | Robust component model for Popup and Overlays. |

### AI & Data
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vercel AI SDK** | latest | AI Routing | Simple abstraction for Claude, Gemini, and Qwen; supports streaming. |
| **Zvec** | latest | Vector DB | In-process, SQLite-like vector database for local semantic memory. |
| **Zod** | latest | Validation | Schema validation for form data and API responses. |

### Infrastructure (Local-Only)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **HTTP/Localhost** | N/A | Communication | Private-by-design; data never leaves the local machine except to AI providers. |
| **Dotenv** | latest | Secret Management | Manage AI API keys securely in a local `.env` on the server. |

## Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **pdf-parse** | latest | Resume Parsing | Extracting text from PDF resumes. |
| **Puppeteer/Cheerio** | latest | Headless Scraping | (Optional) For complex form extraction if DOM scanning is insufficient. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Vector DB** | **Zvec** | **ChromaDB** | Zvec is in-process (lighter), Chroma usually requires a separate docker container/service. |
| **Backend** | **Hono** | **Express** | Hono is faster, smaller, and has better TypeScript support. |
| **Ext. Framework** | **WXT** | **Plasmo** | WXT is often faster and has better support for Bun-based workflows. |

## Installation

```bash
# Workspace root
bun install

# In apps/server
bun add hono @hono/node-server @zvec/zvec ai @ai-sdk/openai zod pdf-parse

# In apps/extension
bun add wxt react react-dom
```

## Sources

- [WXT Documentation](https://wxt.dev)
- [Hono Documentation](https://hono.dev)
- [Zvec GitHub](https://github.com/alibaba/zvec)
- [Vercel AI SDK](https://sdk.vercel.ai)
