import { Hono } from "hono";
import { generateEmbedding } from "../lib/ai";
import { memoriesTable } from "../db/db";
import { v4 as uuidv4 } from "uuid";

const router = new Hono();

router.post("/", async (c) => {
  const { question, answer, category, source } = await c.req.json();
  
  const vector = await generateEmbedding(question);
  const now = Date.now();
  
  await memoriesTable.add([
    {
      id: uuidv4(),
      question,
      answer,
      category,
      source,
      usage_count: 0,
      last_used: now,
      created_at: now,
      vector,
    },
  ]);
  
  return c.json({ success: true }, 201);
});

router.get("/search", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.json({ error: "Query required" }, 400);
  
  const vector = await generateEmbedding(query);
  
  // Search with 85% threshold (0.85 cosine similarity)
  // LanceDB default distance is L2, but we can use cosine if we normalize or use .distanceType('cosine')
  const results = await memoriesTable
    .search(vector)
    // @ts-expect-error - distanceType is only on VectorQuery but search() returns Query | VectorQuery
    .distanceType("cosine")
    .limit(1)
    .toArray();
    
  if (results.length > 0 && results[0]._distance > 0.85) {
    const memory = results[0];
    
    // Update usage
    await memoriesTable.update({
      where: `id = '${memory.id}'`,
      values: {
        usage_count: Number(memory.usage_count) + 1,
        last_used: Date.now()
      }
    });
    
    return c.json({ found: true, ...memory });
  }
  
  return c.json({ found: false });
});

router.get("/all", async (c) => {
  const results = await memoriesTable.query().limit(100).toArray();
  return c.json(results);
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await memoriesTable.delete(`id = '${id}'`);
  return c.json({ success: true });
});

export default router;
