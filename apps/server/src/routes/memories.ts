import { Hono } from "hono";
import { generateEmbedding } from "../lib/ai";
import { memoriesTable } from "../db/lancedb";
import { v4 as uuidv4 } from "uuid";

const router = new Hono();

/**
 * Escape single quotes in user-supplied IDs to prevent SQL injection
 * in LanceDB where-clause string predicates.
 */
function sanitizeId(id: string): string {
  return id.replace(/'/g, "''");
}

router.post("/", async (c) => {
  try {
    const { question, answer, category, source } = await c.req.json();

    const vector = await generateEmbedding(question);
    const now = Date.now();

    const id = uuidv4();

    await memoriesTable.add([
      {
        id,
        question,
        answer,
        category: category || "",
        source: source || "",
        usage_count: BigInt(0),
        last_used: BigInt(now),
        created_at: BigInt(now),
        vector,
      },
    ]);

    return c.json({ success: true, id }, 201);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create memory";
    return c.json({ error: message }, 500);
  }
});

router.get("/search", async (c) => {
  try {
    const query = c.req.query("q");
    if (!query) return c.json({ error: "Query required" }, 400);

    const vector = await generateEmbedding(query);

    const results = await memoriesTable
      .vectorSearch(vector)
      .limit(1)
      .toArray();

    if (results.length > 0) {
      const memory = results[0];
      // LanceDB returns cosine _distance — lower values mean better matches.
      // Skip the __init__ sentinel record and require distance < 0.3.
      if (
        memory.question !== "__init__" &&
        memory._distance !== undefined &&
        memory._distance < 0.3
      ) {
        const safeId = sanitizeId(memory.id as string);
        await memoriesTable.update({
          where: `id = '${safeId}'`,
          values: {
            usage_count: Number(memory.usage_count) + 1,
            last_used: Date.now(),
          },
        });

        return c.json({
          found: true,
          id: memory.id,
          question: memory.question,
          answer: memory.answer,
          category: memory.category,
          source: memory.source,
          usage_count: Number(memory.usage_count) + 1,
          last_used: Date.now(),
          created_at: Number(memory.created_at),
        });
      }
    }

    return c.json({ found: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Search failed";
    return c.json({ error: message }, 500);
  }
});

router.get("/all", async (c) => {
  try {
    // NOTE: limit(100) is intentional — this is a single-user tool and
    // an unbounded scan would be too slow for large datasets.
    const results = await memoriesTable.query().limit(100).toArray();
    return c.json(
      results
        .filter((r) => r.question !== "__init__")
        .map((r) => ({
          id: r.id,
          question: r.question,
          answer: r.answer,
          category: r.category,
          source: r.source,
          usage_count: Number(r.usage_count),
          last_used: Number(r.last_used),
          created_at: Number(r.created_at),
        }))
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch memories";
    return c.json({ error: message }, 500);
  }
});

router.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await memoriesTable.delete(`id = '${sanitizeId(id)}'`);
    return c.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to delete memory";
    return c.json({ error: message }, 500);
  }
});

router.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { question, answer, category, source } = await c.req.json();

    const existing = await memoriesTable
      .query()
      .where(`id = '${sanitizeId(id)}'`)
      .toArray();

    if (existing.length === 0) {
      return c.json({ error: "Memory not found" }, 404);
    }

    const existingMemory = existing[0];
    const updates: Record<string, string | number | bigint | boolean | number[]> = {};

    if (question && question !== existingMemory.question) {
      const newVector = await generateEmbedding(question);
      updates.vector = newVector;
      updates.question = question;
    }
    if (answer !== undefined) {
      updates.answer = answer;
    }
    if (category !== undefined) {
      updates.category = category;
    }
    if (source !== undefined) {
      updates.source = source;
    }

    if (Object.keys(updates).length > 0) {
      await memoriesTable.update({
        where: `id = '${sanitizeId(id)}'`,
        values: updates,
      });
    }

    return c.json({ success: true, id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update memory";
    return c.json({ error: message }, 500);
  }
});

export default router;
