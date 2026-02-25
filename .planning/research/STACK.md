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
| **LanceDB** | latest | Vector DB | Embedded, fast vector database for local semantic memory. Works on Windows without compilation. |
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
| **Vector DB** | **LanceDB** | **ChromaDB** | LanceDB is embedded (no docker needed), works cross-platform, better Windows support. |
| **Backend** | **Hono** | **Express** | Hono is faster, smaller, and has better TypeScript support. |
| **Ext. Framework** | **WXT** | **Plasmo** | WXT is often faster and has better support for Bun-based workflows. |

## Installation

```bash
# Workspace root
bun install

# In apps/server
bun add hono @hono/node-server @lancedb/lancedb ai @ai-sdk/openai zod pdf-parse

# In apps/extension
bun add wxt react react-dom
```

## Sources

- [WXT Documentation](https://wxt.dev)
- [Hono Documentation](https://hono.dev)
- [LanceDB GitHub](https://github.com/lancedb/lancedb)
- [Vercel AI SDK](https://sdk.vercel.ai)
