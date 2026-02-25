# Phase 2: Resume Ingestion & AI Intelligence - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable the system to ingest user PDF resumes and convert extracted data into semantic memories. Includes AI provider routing for extraction and switching. User can upload, review, edit, and approve extracted data to be stored as memories in LanceDB. Form detection and auto-fill are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Resume Upload UI
- Drag & Drop + Button for upload (not file picker only)
- Structured Form View for displaying extracted data (not raw JSON)
- Fully Editable fields before saving to memory
- Immediate Extraction on upload (not two-step)
- Error + Retry on corrupted/unreadable PDFs
- Overwrite with Confirm when re-uploading
- Spinner + Text for progress indication
- 10MB file size limit

### Memory Generation Flow
- Bulk Approval: review all fields, click "Save All" to convert
- Immediate Save: memories searchable right after save
- Auto-generate natural language questions for vector matching
- Skip Duplicates: don't overwrite existing memories
- Full Extraction: extract all detectable fields
- Show Percentage: confidence score per field
- Show Partial + Retry: if some fields fail, show what worked
- Allow Custom: users can add fields beyond extracted data
- Source Tagging: tag memories as "resume" with upload date
- Badge Icon: visual indicator in memory list for resume-derived memories
- Export JSON: option to export before saving to memory
- Side Panel: show existing memories for reference during review

### AI Provider Switching
- Dropdown in Popup: switch providers from popup header
- Immediate Switch: next operation uses new provider
- Visual Status: show checkmark/X for API key configuration
- User Selects: user chooses default provider in settings

### Field Extraction Scope
- Full Schema: extract all fields (name, email, phone, address, summary, work history, education, skills, certifications, languages, projects, links)
- Expandable Items: work history/education as separate expandable items
- Tag Input: skills as comma-separated tags
- Clickable Links: LinkedIn, GitHub, portfolio as clickable with favicon

### Claude's Discretion
- Exact extraction algorithm choice
- Specific confidence threshold for highlighting
- UI color palette and exact styling
- Memory deletion behavior after resume overwrite

</decisions>

<specifics>
## Specific Ideas

- Resume memories should be visually distinguishable in the memory list (badge icon)
- Side panel shows existing memories for reference while reviewing extracted data
- Users can export extracted data as JSON before committing to memory storage
- Confidence percentages shown per field - user can see reliability of each extraction

</specifics>

<deferred>
## Deferred Ideas

- DOCX resume support — Phase 2.1 or v2
- Multi-language resume support — future phase

</deferred>

---

*Phase: 02-resume-ingestion-ai-intelligence*
*Context gathered: 2026-02-26*
