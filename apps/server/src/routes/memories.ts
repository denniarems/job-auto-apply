import { Hono } from "hono";
import { generateEmbedding } from "../lib/ai";
import { collection } from "../db/db";
import { v4 as uuidv4 } from "uuid";
import * as zvec from "@zvec/zvec";

const router = new Hono();

router.post("/", async (c) => {
  const { question, answer, category, source } = await c.req.json();

  const vector = await generateEmbedding(question);
  const now = Date.now();

  const doc: zvec.ZVecDocInput = {
    id: uuidv4(),
    vectors: { "embedding": new Float32Array(vector) },
    fields: {
      question,
      answer,
      category,
      source,
      usage_count: 0,
      last_used: now,
      created_at: now,
    },
  };

  collection.insertSync(doc);

  return c.json({ success: true }, 201);
});

router.get("/search", async (c) => {
  const query = c.req.query("q");
  if (!query) return c.json({ error: "Query required" }, 400);

  const vector = await generateEmbedding(query);
  const queryVector = new Float32Array(vector);

  // Search with 85% threshold (0.85 similarity)
  const results = collection.querySync({
    fieldName: "embedding",
    vector: queryVector,
    topk: 1
  });

  if (results.length > 0) {
    const memory = results[0];
    if (memory && memory.score > 0.85) {
      // Update usage
      const updatedFields = { ...memory.fields };
      updatedFields.usage_count = (Number(updatedFields.usage_count) || 0) + 1;
      updatedFields.last_used = Date.now();

      collection.updateSync({
        id: memory.id,
        fields: updatedFields
      });

      return c.json({ found: true, id: memory.id, ...memory.fields });
    }
  }

  return c.json({ found: false });
});

router.get("/all", async (c) => {
  // Query with a zero vector to get some results if no easy 'all' exists
  const results = collection.querySync({
    fieldName: "embedding",
    vector: new Float32Array(1536).fill(0),
    topk: 100
  });

  return c.json(results.map(r => ({ id: r.id, ...r.fields })));
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  collection.deleteSync(id);
  return c.json({ success: true });
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const { question, answer, category, source } = await c.req.json();

  // Get existing memory
  const results = collection.querySync({
    fieldName: "embedding",
    vector: new Float32Array(1536).fill(0),
    topk: 100
  });

  const existing = results.find(r => r.id === id);
  if (!existing) {
    return c.json({ error: "Memory not found" }, 404);
  }

  // Update fields
  const updatedFields = { ...existing.fields };
  let newEmbedding: Float32Array | undefined;

  // If question is updated, regenerate embedding
  if (question && question !== existing.fields.question) {
    const vector = await generateEmbedding(question);
    newEmbedding = new Float32Array(vector);
    updatedFields.question = question;
  }

  if (answer !== undefined) {
    updatedFields.answer = answer;
  }
  if (category !== undefined) {
    updatedFields.category = category;
  }
  if (source !== undefined) {
    updatedFields.source = source;
  }

  // Update the document
  collection.updateSync({
    id,
    vectors: newEmbedding ? { embedding: newEmbedding } : undefined,
    fields: updatedFields
  });

  return c.json({ success: true, id, ...updatedFields });
});

export default router;
