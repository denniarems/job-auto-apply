# Feature Landscape

**Domain:** Job Auto-Apply Extension
**Researched:** 2026-02-25
**Overall Confidence:** HIGH

## Table Stakes

Features users expect in a modern job application assistant.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Resume Extraction** | Foundation for all auto-filling. | Medium | Needs to handle various PDF formats. |
| **Basic Form Filling** | Name, Email, Phone, Address. | Low | Standard browser autofill level. |
| **History Auto-fill** | Work experience and Education mapping. | High | Requires semantic matching of different labels. |
| **AI Selection** | Choice between providers (Claude/Gemini/Qwen). | Medium | Core differentiator in privacy/quality. |
| **Manual Correction** | Ability to fix AI mistakes. | Medium | Crucial for user trust. |

## Differentiators

Features that set this product apart.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Semantic Memory (LanceDB)** | Learns from corrections; remembers "weird" fields across different sites. | High | Local-first vector search is unique. |
| **Visual Source Indicators** | Shows *why* a field was filled (from Resume, Memory, or AI guess). | Medium | High transparency and trust. |
| **Cover Letter Generation** | Tailors content to JD + Resume instantly. | Medium | Uses LLM to reduce drafting time. |
| **Shadow DOM Overlay** | Integrated UI that doesn't break site layout. | Medium | Better UX than standard popups. |

## Anti-Features

Features to explicitly NOT build to maintain safety and compliance.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-Submit** | Risk of ToS violations and incorrect data submission. | Provide a prominent "Submit" button for the user to click. |
| **Cloud Sync** | Violates "Local-First" privacy promise. | Support local backups (JSON export). |
| **Bot Detection Bypassing** | Escalates arms race with job boards. | Act as a "human assistant" rather than a "bot." |

## Feature Dependencies

```
Resume Parsing → Basic Auto-fill
Basic Auto-fill → Semantic Memory (LanceDB)
AI Mapping → Cover Letter Generation
LanceDB Integration → Contextual Memory Management
```

## MVP Recommendation

Prioritize:
1. **Resume Parsing & Extraction**: Core data source.
2. **AI-Powered Form Mapping**: Using Vercel AI SDK to match fields.
3. **Basic Memory (Local)**: Saving corrections to LanceDB.
4. **Chrome Popup UI**: AI provider selection and status.

Defer: **Cover Letter PDF Export**, **Advanced Application Tracking**.

## Sources

- [Common Job Board Patterns (LinkedIn, Indeed, Greenhouse, Lever)](https://www.google.com/search?q=common+job+application+form+fields)
- [Competitor Analysis (Simplify, Teal, Loop)](https://www.google.com/search?q=simplify+vs+teal+vs+loop+extension+features)
