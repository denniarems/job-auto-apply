import { Hono } from "hono";
import { generateEmbedding } from "../lib/ai";
import { memoriesTable } from "../db/lancedb";
import type { DetectedField, FieldMapping, MemoryMatch, FormField } from "../types/forms";

const router = new Hono();

// Confidence thresholds
const HIGH_CONFIDENCE = 85;
const LOW_CONFIDENCE = 60;

/**
 * Escape single quotes in user-supplied IDs to prevent SQL injection
 * in LanceDB where-clause string predicates.
 */
function sanitizeId(id: string): string {
  return id.replace(/'/g, "''");
}

/**
 * Match detected fields to memories using vector similarity.
 * The _url parameter is reserved for future per-site mapping preferences.
 */
async function matchFieldsToMemories(
  fields: DetectedField[],
  _url?: string,
): Promise<FieldMapping[]> {
  const mappings: FieldMapping[] = [];

  for (const detected of fields) {
    const mapping = await matchSingleField(detected);
    mappings.push(mapping);
  }

  return mappings;
}

/**
 * Match a single detected field to memories
 */
async function matchSingleField(detected: DetectedField): Promise<FieldMapping> {
  // Generate embedding for the memory question
  const question = detected.memoryQuestion || detected.semanticName;
  const vector = await generateEmbedding(question);

  // Search memories table
  const results = await memoriesTable
    .vectorSearch(vector)
    .limit(5)
    .toArray();

  // Filter out the __init__ sentinel record and convert to MemoryMatch format.
  // LanceDB returns cosine _distance — lower values mean better matches.
  // Convert distance to a 0–100 confidence score: confidence = (1 - distance) * 100.
  const matches: MemoryMatch[] = results
    .filter((memory) => memory.question !== "__init__")
    .map((memory) => {
      const distance = typeof memory._distance === "number" ? memory._distance : 1;
      const confidence = Math.round(Math.max(0, 1 - distance) * 100);
      const source = (memory.source as "memory" | "resume" | "manual") || "memory";

      return {
        memoryId: memory.id as string,
        question: memory.question as string,
        answer: memory.answer as string,
        confidence,
        source,
      };
    });

  // Determine status based on best match confidence
  let status: FieldMapping["status"] = "unmapped";
  let selectedMatch: MemoryMatch | undefined;

  const bestMatch = matches[0];
  if (bestMatch) {
    if (bestMatch.confidence >= HIGH_CONFIDENCE) {
      // High confidence - auto-select
      status = "mapped";
      selectedMatch = bestMatch;
    } else if (bestMatch.confidence >= LOW_CONFIDENCE) {
      // Borderline - include for review but don't auto-select
      status = "pending";
    } else {
      // Low confidence - skip
      status = "unmapped";
    }
  }

  // Create minimal FormField for the mapping
  const field: FormField = {
    type: "text",
    name: detected.inputName,
    id: "",
    label: detected.semanticName,
    placeholder: "",
    required: false,
    autocomplete: "",
    cssHidden: false,
  };

  return {
    field,
    detected,
    matches,
    selectedMatch,
    status,
    source: selectedMatch?.source,
  };
}

/**
 * Update memory usage when a match is selected
 */
async function updateMemoryUsage(memoryId: string): Promise<void> {
  const safeId = sanitizeId(memoryId);
  const existing = await memoriesTable
    .query()
    .where(`id = '${safeId}'`)
    .limit(1)
    .toArray();

  if (existing.length > 0) {
    const memory = existing[0];
    await memoriesTable.update({
      where: `id = '${safeId}'`,
      values: {
        usage_count: Number(memory.usage_count) + 1,
        last_used: Date.now(),
      },
    });
  }
}

// POST /api/mappings/match
router.post("/match", async (c) => {
  try {
    const body = await c.req.json();
    const { fields, url } = body as { fields: DetectedField[]; url?: string };

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return c.json({ error: "fields array is required" }, 400);
    }

    const mappings = await matchFieldsToMemories(fields, url);

    return c.json({ mappings });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Matching failed";
    return c.json({ error: message }, 500);
  }
});

// POST /api/mappings/select
router.post("/select", async (c) => {
  try {
    const body = await c.req.json();
    const { mappingId, memoryId } = body as {
      mappingId: string;
      memoryId: string;
    };

    if (!mappingId || !memoryId) {
      return c.json({ error: "mappingId and memoryId are required" }, 400);
    }

    // Update memory usage
    await updateMemoryUsage(memoryId);

    // In a full implementation, we would also store this mapping preference
    // for future use (per-site or global based on user preference)

    return c.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to select mapping";
    return c.json({ error: message }, 500);
  }
});

// GET /api/mappings/usage/:memoryId
router.get("/usage/:memoryId", async (c) => {
  try {
    const memoryId = c.req.param("memoryId");

    const results = await memoriesTable
      .query()
      .where(`id = '${sanitizeId(memoryId)}'`)
      .limit(1)
      .toArray();

    if (results.length === 0) {
      return c.json({ error: "Memory not found" }, 404);
    }

    const memory = results[0];
    return c.json({
      memoryId: memory.id,
      usage_count: Number(memory.usage_count),
      last_used: Number(memory.last_used),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch usage";
    return c.json({ error: message }, 500);
  }
});

export default router;
