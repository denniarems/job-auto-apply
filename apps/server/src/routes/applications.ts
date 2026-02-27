import { Hono } from "hono";
import { applicationsTable } from "../db/lancedb";
import { v4 as uuidv4 } from "uuid";

const router = new Hono();

// Sanitize user-supplied IDs to prevent SQL injection in LanceDB where clauses.
// Only allow alphanumeric characters and hyphens (UUID format).
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-]/g, "");
}

router.post("/", async (c) => {
  const { company, position, url, status, applied_date } = await c.req.json();

  if (!company || !position) {
    return c.json({ error: "Company and position are required" }, 400);
  }

  const now = Date.now();
  const id = uuidv4();

  try {
    await applicationsTable.add([
      {
        id,
        company,
        position,
        url: url || "",
        status: status || "Applied",
        applied_date: BigInt(applied_date || now),
        created_at: BigInt(now),
      },
    ]);
  } catch (e: unknown) {
    console.error("Failed to create application:", e);
    return c.json({ error: "Failed to create application" }, 500);
  }

  return c.json({ success: true, id }, 201);
});

router.get("/", async (c) => {
  let results: Awaited<ReturnType<typeof applicationsTable.query>["toArray"]>;
  try {
    results = await applicationsTable.query().limit(100).toArray();
  } catch (e: unknown) {
    console.error("Failed to fetch applications:", e);
    return c.json({ error: "Failed to fetch applications" }, 500);
  }

  // Filter out the __init__ placeholder and sort by date desc
  // LanceDB does not expose a stable cross-version .orderBy() API, so we sort in JS.
  const applications = results
    .filter((r) => r.id !== "__init__")
    .sort((a, b) => Number(b.applied_date) - Number(a.applied_date))
    .map((r) => ({
      id: r.id,
      company: r.company,
      position: r.position,
      url: r.url,
      status: r.status,
      applied_date: Number(r.applied_date),
      created_at: Number(r.created_at),
    }));

  return c.json(applications);
});

router.get("/:id", async (c) => {
  const id = sanitizeId(c.req.param("id"));

  let results: Awaited<ReturnType<typeof applicationsTable.query>["toArray"]>;
  try {
    results = await applicationsTable
      .query()
      .where(`id = '${id}'`)
      .toArray();
  } catch (e: unknown) {
    console.error("Failed to fetch application:", e);
    return c.json({ error: "Failed to fetch application" }, 500);
  }

  if (results.length === 0 || results[0].id === "__init__") {
    return c.json({ error: "Application not found" }, 404);
  }

  const app = results[0];
  return c.json({
    id: app.id,
    company: app.company,
    position: app.position,
    url: app.url,
    status: app.status,
    applied_date: Number(app.applied_date),
    created_at: Number(app.created_at),
  });
});

router.patch("/:id", async (c) => {
  const id = sanitizeId(c.req.param("id"));
  const { company, position, url, status, applied_date } = await c.req.json();

  let existing: Awaited<ReturnType<typeof applicationsTable.query>["toArray"]>;
  try {
    existing = await applicationsTable
      .query()
      .where(`id = '${id}'`)
      .toArray();
  } catch (e: unknown) {
    console.error("Failed to fetch application for update:", e);
    return c.json({ error: "Failed to fetch application" }, 500);
  }

  if (existing.length === 0 || existing[0].id === "__init__") {
    return c.json({ error: "Application not found" }, 404);
  }

  const updates: Record<string, string | number | bigint | boolean> = {};

  if (company !== undefined) updates.company = company;
  if (position !== undefined) updates.position = position;
  if (url !== undefined) updates.url = url;
  if (status !== undefined) updates.status = status;
  if (applied_date !== undefined) updates.applied_date = BigInt(applied_date);

  if (Object.keys(updates).length > 0) {
    try {
      await applicationsTable.update({
        where: `id = '${id}'`,
        values: updates,
      });
    } catch (e: unknown) {
      console.error("Failed to update application:", e);
      return c.json({ error: "Failed to update application" }, 500);
    }
  }

  return c.json({ success: true, id });
});

router.delete("/:id", async (c) => {
  const id = sanitizeId(c.req.param("id"));

  let existing: Awaited<ReturnType<typeof applicationsTable.query>["toArray"]>;
  try {
    existing = await applicationsTable
      .query()
      .where(`id = '${id}'`)
      .toArray();
  } catch (e: unknown) {
    console.error("Failed to fetch application for delete:", e);
    return c.json({ error: "Failed to fetch application" }, 500);
  }

  if (existing.length === 0 || existing[0].id === "__init__") {
    return c.json({ error: "Application not found" }, 404);
  }

  try {
    await applicationsTable.delete(`id = '${id}'`);
  } catch (e: unknown) {
    console.error("Failed to delete application:", e);
    return c.json({ error: "Failed to delete application" }, 500);
  }

  return c.json({ success: true });
});

export default router;
