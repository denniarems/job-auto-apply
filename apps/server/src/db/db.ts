import * as lancedb from "@lancedb/lancedb";
import os from "os";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(os.homedir(), ".job-auto-apply", "lancedb");

export let db: lancedb.Connection;
export let memoriesTable: lancedb.Table;

export async function initDb() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await lancedb.connect(DB_PATH);

  try {
    memoriesTable = await db.openTable("memories");
  } catch {
    // Table doesn't exist, create it with a dummy record to define schema
    memoriesTable = await db.createTable("memories", [
      {
        id: "seed",
        question: "Seed question",
        answer: "Seed answer",
        category: "seed",
        source: "system",
        usage_count: 0,
        last_used: Date.now(),
        created_at: Date.now(),
        vector: Array(1536).fill(0),
      },
    ]);
    // Optionally delete seed record if wanted, but keeping it ensures schema
    await memoriesTable.delete("id = 'seed'");
  }
}
