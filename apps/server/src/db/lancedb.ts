import * as lancedb from "@lancedb/lancedb";
import os from "os";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(os.homedir(), ".job-auto-apply");

export let memoriesTable: lancedb.Table;
export let templatesTable: lancedb.Table;
export let applicationsTable: lancedb.Table;
export let coverLettersTable: lancedb.Table;

// Cached DB connection — reused across calls to initDb()
let dbConnection: lancedb.Connection | null = null;

/**
 * Opens an existing table or creates it with the provided init record.
 * Abstracts the "table already exists" error pattern used by all tables.
 */
async function getOrCreateTable<T extends Record<string, unknown>>(
  db: lancedb.Connection,
  name: string,
  initRecord: T
): Promise<lancedb.Table> {
  try {
    return await db.createTable(name, [initRecord]);
  } catch (e: unknown) {
    if (e instanceof Error && e.message?.includes("already exists")) {
      return await db.openTable(name);
    }
    throw e;
  }
}

export async function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Use local LanceDB storage in ~/.job-auto-apply directory
  const dbPath = path.join(DB_DIR, "db");

  if (!dbConnection) {
    dbConnection = await lancedb.connect(dbPath);
  }
  const db = dbConnection;

  const createTableData = {
    id: "__init__",
    question: "__init__",
    answer: "__init__",
    category: "__init__",
    source: "__init__",
    usage_count: 0n,
    last_used: 0n,
    created_at: 0n,
    vector: Array.from({ length: 1536 }, () => 0),
  };

  memoriesTable = await getOrCreateTable(db, "memories", createTableData);
  templatesTable = await getOrCreateTable(db, "form_templates", createTableData);

  // Application tracking table
  const appData = {
    id: "__init__",
    company: "__init__",
    position: "__init__",
    url: "__init__",
    status: "__init__",
    applied_date: 0n,
    created_at: 0n,
  };

  applicationsTable = await getOrCreateTable(db, "applications", appData);

  // Cover letters table
  const coverLetterData = {
    id: "__init__",
    application_id: "__init__",
    company: "__init__",
    position: "__init__",
    content: "__init__",
    generated_at: 0n,
  };

  coverLettersTable = await getOrCreateTable(db, "cover_letters", coverLetterData);
}
