import { Hono } from "hono";
import { generateEmbedding } from "../lib/ai";
import { memoriesTable } from "../db/lancedb";
import { v4 as uuidv4 } from "uuid";

const router = new Hono();

router.post("/", async (c) => {
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
});

router.get("/search", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.json({ error: "Query required" }, 400);

  const vector = await generateEmbedding(query);

  const results = await memoriesTable
    .vectorSearch(vector)
    .limit(1)
    .toArray();

  if (results.length > 0) {
    const memory = results[0];
    if (memory.score > 0.85) {
      await memoriesTable.update({
        where: `id = '${memory.id}'`,
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
});

router.get("/all", async (c) => {
  const results = await memoriesTable.query().limit(100).toArray();
  return c.json(
    results.map((r) => ({
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
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await memoriesTable.delete(`id = '${id}'`);
  return c.json({ success: true });
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const { question, answer, category, source } = await c.req.json();

  const existing = await memoriesTable.query().where(`id = '${id}'`).toArray();

  if (existing.length === 0) {
    return c.json({ error: "Memory not found" }, 404);
  }

  const existingMemory = existing[0];
  const updates: Record<string, any> = {};

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
      where: `id = '${id}'`,
      values: updates,
    });
  }

  return c.json({ success: true, id });
});

export default router;
