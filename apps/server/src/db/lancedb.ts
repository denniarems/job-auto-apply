import * as lancedb from "@lancedb/lancedb";
import os from "os";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(os.homedir(), ".job-auto-apply");

export let memoriesTable: lancedb.Table;
export let templatesTable: lancedb.Table;
export let applicationsTable: lancedb.Table;
export let coverLettersTable: lancedb.Table;

export async function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Use local LanceDB storage in ~/.job-auto-apply directory
  const dbPath = path.join(DB_DIR, "db");
  const db = await lancedb.connect(dbPath);

  const createTableData = [
    {
      id: "__init__",
      question: "__init__",
      answer: "__init__",
      category: "__init__",
      source: "__init__",
      usage_count: 0n,
      last_used: 0n,
      created_at: 0n,
      vector: Array.from({ length: 1536 }, () => 0),
    },
  ];

  try {
    memoriesTable = await db.createTable("memories", createTableData);
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      memoriesTable = await db.openTable("memories");
    } else {
      throw e;
    }
  }

  try {
    templatesTable = await db.createTable("form_templates", createTableData);
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      templatesTable = await db.openTable("form_templates");
    } else {
      throw e;
    }
  }

  // Application tracking table
  const appData = [
    {
      id: "__init__",
      company: "__init__",
      position: "__init__",
      url: "__init__",
      status: "__init__",
      applied_date: 0n,
      created_at: 0n,
    },
  ];

  try {
    applicationsTable = await db.createTable("applications", appData);
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      applicationsTable = await db.openTable("applications");
    } else {
      throw e;
    }
  }

  // Cover letters table
  const coverLetterData = [
    {
      id: "__init__",
      application_id: "__init__",
      company: "__init__",
      position: "__init__",
      content: "__init__",
      generated_at: 0n,
    },
  ];

  try {
    coverLettersTable = await db.createTable("cover_letters", coverLetterData);
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      coverLettersTable = await db.openTable("cover_letters");
    } else {
      throw e;
    }
  }
}
