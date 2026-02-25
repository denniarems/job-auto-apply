---
phase: quick
plan: "1"
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/server/package.json
  - apps/server/src/db/lancedb.ts
  - apps/server/src/routes/memories.ts
  - apps/server/src/index.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "LanceDB is installed as dependency"
    - "Database initializes on server startup"
    - "Memories CRUD operations work with LanceDB"
    - "Vector search functionality works"
  artifacts:
    - path: "apps/server/src/db/lancedb.ts"
      provides: "LanceDB initialization and table management"
      min_lines: 50
    - path: "apps/server/src/routes/memories.ts"
      provides: "Memory CRUD with vector search"
      exports: ["POST /", "GET /search", "GET /all", "DELETE /:id", "PATCH /:id"]
  key_links:
    - from: "apps/server/src/index.ts"
      to: "apps/server/src/db/lancedb.ts"
      via: "import { initDb }"
    - from: "apps/server/src/routes/memories.ts"
      to: "apps/server/src/db/lancedb.ts"
      via: "import { memoriesTable }"
---

<objective>
Verify the zvec to LanceDB migration is complete and working.
</objective>

<context>
The project was originally planned to use Zvec for vector storage but has been migrated to LanceDB. Verify the implementation is complete.
</context>

<tasks>

<task type="auto">
  <name>Verify LanceDB integration</name>
  <files>apps/server/package.json</files>
  <action>
Verify that @lancedb/lancedb is listed in dependencies. Confirm version is specified.
  </action>
  <verify>grep '"@lancedb/lancedb"' apps/server/package.json returns version ^0.26.2</verify>
  <done>LanceDB dependency present in package.json</done>
</task>

<task type="auto">
  <name>Test server initialization</name>
  <files>apps/server/src/index.ts</files>
  <action>
Start the server to verify LanceDB initializes correctly without errors. Check the /health endpoint reports database as "connected".
  </action>
  <verify>curl http://localhost:3000/health returns {"status":"ok","database":"connected",...}</verify>
  <done>Server starts and database connection is successful</done>
</task>

<task type="auto">
  <name>Test memory CRUD operations</name>
  <files>apps/server/src/routes/memories.ts</files>
  <action>
Test creating a memory, searching for it via vector search, retrieving all memories, updating, and deleting.
  </action>
  <verify>
# Create memory
curl -X POST http://localhost:3000/api/memories -H "Content-Type: application/json" -d '{"question":"test","answer":"test","category":"test"}'
# Search memory  
curl "http://localhost:3000/api/memories/search?q=test"
# Returns success and found results
  </verify>
  <done>All CRUD operations work correctly with LanceDB</done>
</task>

</tasks>

<verification>
Run server and test the full memory workflow:
1. POST /api/memories - create new memory
2. GET /api/memories/search?q=... - vector search 
3. GET /api/memories/all - list all
4. DELETE /api/memories/:id - delete
</verification>

<success_criteria>
Server runs without errors, database initializes, and all memory CRUD operations work with LanceDB vector search.
</success_criteria>

<output>
After completion, create `.planning/quick/1-update-zvec-to-lancedb/1-PLAN-SUMMARY.md`
</output>
