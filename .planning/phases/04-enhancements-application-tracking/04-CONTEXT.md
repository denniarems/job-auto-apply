# Phase 4: Enhancements & Application Tracking - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Add cover letter generation and basic application tracking to complete the core experience. Cover letters are generated using job description and resume context, stored locally. Application history tracks company, position, URL, date, and status.

</domain>

<decisions>
## Implementation Decisions

### Cover Letter Output Format
- Output as PDF
- Download to device (not clipboard or browser preview)
- Filename format: `CoverLetter_Company_Position_Date.pdf`

### Cover Letter Content & Generation
- Standard sections: greeting, intro paragraph, body, closing, signature
- Concise length (1-2 paragraphs, ~150-250 words)
- Summarize key points from job description rather than repeating full JD
- Include experience highlights from resume
- Minimal visual style (clean, black text on white, no logos/colors)
- Standard business format header (name/contact → date → company info)
- Dynamic closing based on company culture
- Full sections required (no skipping greeting)
- Auto-detect company name and position from job page
- If no JD available: generate generic letter user can edit
- Use currently selected AI provider from settings
- On generation failure: show error with retry option

### Cover Letter Workflow
- Preview then generate — user sees text before PDF
- Yes, editable preview — user can edit text before downloading
- Save generated letters to local history
- Link generated cover letters to tracked applications

### Application Tracking Data
- Basic fields: Company, Position, URL, Date, Status
- Status options: Applied, Interviewing, Offer, Rejected, Withdrawn
- Store in same LanceDB as memories (separate from other data)
- Auto-capture when user fills/submits an application
- Allow duplicate entries (track all attempts)
- JSON export for application history
- Keep all history forever (no auto-cleanup)

### History UI Presentation
- Card list view (not table or timeline)
- Sort by date, newest first
- Both status filter and text search
- Basic actions: view details, update status, delete

### Claude's Discretion
- Exact preview UI layout
- Specific color scheme for status indicators
- PDF library implementation choice
- How to handle PDF generation errors in detail
- Exact filter/search UI behavior

</decisions>

<specifics>
## Specific Ideas

- "I want to be able to find cover letters later in history"
- "Card list feels cleaner than a table"
- "Auto-capture makes sense — I don't want to manually track"

</specifics>

<deferred>
## Deferred Ideas

- Full customization of PDF styling (fonts, colors) — v2
- Custom status options — future phase
- Timeline view — future enhancement

</deferred>

---

*Phase: 04-enhancements-application-tracking*
*Context gathered: 2026-02-27*
