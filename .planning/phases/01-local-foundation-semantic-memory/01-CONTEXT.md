# Phase 01: Local Foundation & Semantic Memory - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the core local-first infrastructure: a Hono backend server using LanceDB for persistent semantic memory, and a foundational Chrome extension popup that communicates with this backend.

</domain>

<decisions>
## Implementation Decisions

### LanceDB Persistence
- **Storage Location**: The LanceDB database file will be stored in the user's home directory under `~/.job-auto-apply` to ensure data persists across monorepo updates or cleanups.
- **Collection Structure**: Multiple collections will be used (e.g., `memories`, `form_templates`) to allow for cleaner separation as the project grows.
- **Initialization**: The backend will auto-create the directory and DB file on startup if they are missing.
- **Persistence**: Data will be written to disk immediately to ensure persistence.

### Memory Schema & Search
- **Primary Keys**: Use timestamp-based IDs for easy sorting and tracking.
- **Metadata**: Store full metadata including source (User Input, Resume), usage count, and last-used timestamps.
- **Conflict Handling**: Similar questions with different answers will be stored as new entries (Learning Mode), allowing vector search to return the most relevant or recent matches.
- **Search Threshold**: Use a hardcoded 85% confidence threshold for this phase.

### UI & UX
- **Backend Status**: The popup header will clearly indicate the connection status (Online/Offline) to the Hono backend.
- **Navigation**: Use a bottom tab bar for navigating between Main, Memories, Resumes, and Settings.
- **Primary Action**: The Main view will feature a large "Start Auto-Fill" button as the primary focal point.
- **AI Providers**: Present providers in a dropdown selector within the Main or Settings view.

### API Key Management
- **Configuration**: API keys (Anthropic, Google, OpenAI) are managed exclusively via the backend `.env` file. No UI will be provided in the extension for key input in this phase.

### Claude's Discretion
- **Styling**: Visual aesthetics of the popup and status indicators.
- **Internal API Contracts**: The exact shape of the local HTTP endpoints (unless specified in requirements).

</decisions>

<specifics>
## Specific Ideas
- "Start Auto-Fill" button should be visually prominent even if the underlying logic is built in later phases.
- Connection status should be reactive (polling or heartbeat) so the user knows if the backend is down immediately.
</specifics>

<deferred>
## Deferred Ideas
- **User-configurable Thresholds**: Deferring settings to adjust confidence percentages.
- **Popup-based Key Management**: Managing secrets via the extension UI.
- **Database Backups/Exports**: Exporting memories to JSON.
</deferred>

---

*Phase: 01-local-foundation-semantic-memory*
*Context gathered: 2026-02-25*