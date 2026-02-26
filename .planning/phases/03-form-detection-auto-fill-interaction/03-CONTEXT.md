# Phase 3: Form Detection & Auto-Fill Interaction - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Chrome extension feature that detects job application forms on ATS sites (Greenhouse, Lever, Workday) and fills them using semantic memories from the user's profile. This phase covers:
- Form detection with AI classification
- Field-to-memory mapping using semantic similarity
- Auto-fill behavior with user preview and confirmation
- Honeypot field detection and skipping

Cover letter generation and application tracking are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Form Detection Approach
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

### Field-to-Memory Mapping
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

### Auto-Fill Behavior
- **Fill method**: Simulate typing (character by character with delays)
- **Fill order**: Sequential (in DOM order)
- **Fill mode**: Fill all at once after confirmation
- **Visual feedback**: Show filling visually (focus on each field)
- **Status reporting**: Per-field status (success/fail after each field)
- **Visual indicators**: Color coding (green=filled, red=failed)
- **Existing values**: Skip if field has value
- **Completion notification**: Page toast (at top of page)

### User Control & Prompts
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

</decisions>

<specifics>
## Specific Ideas

- Extension should learn from successful detections and user preferences
- Honeypot fields should be logged but not filled
- Users should always see confidence scores for each mapping
- Preview dialog should be field-by-field with ability to modify mappings
- Form schemas should be cached locally for performance

</specifics>

<deferred>
## Deferred Ideas

- Cover letter generation — Phase 4
- Application tracking/history — Phase 4

</deferred>

---

*Phase: 03-form-detection-auto-fill-interaction*
*Context gathered: 2026-02-26*
