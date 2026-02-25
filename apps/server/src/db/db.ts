import * as zvec from "@zvec/zvec";
import os from "os";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(os.homedir(), ".job-auto-apply");
const DB_PATH = path.join(DB_DIR, "memory.db");

export let collection: zvec.ZVecCollection;

export async function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const schema = new zvec.ZVecCollectionSchema({
    name: "memories",
    vectors: [
      {
        name: "embedding",
        dataType: zvec.ZVecDataType.VECTOR_FP32,
        dimension: 1536,
        indexParams: {
          indexType: zvec.ZVecIndexType.HNSW,
          metricType: zvec.ZVecMetricType.COSINE,
          m: 16,
          efConstruction: 200,
        }
      }
    ],
    fields: [
      { name: "question", dataType: zvec.ZVecDataType.STRING },
      { name: "answer", dataType: zvec.ZVecDataType.STRING },
      { name: "category", dataType: zvec.ZVecDataType.STRING },
      { name: "source", dataType: zvec.ZVecDataType.STRING },
      { name: "usage_count", dataType: zvec.ZVecDataType.INT64 },
      { name: "last_used", dataType: zvec.ZVecDataType.INT64 },
      { name: "created_at", dataType: zvec.ZVecDataType.INT64 },
    ]
  });

  // ZVecCreateAndOpen will open if exists, or create if not.
  collection = zvec.ZVecCreateAndOpen(DB_PATH, schema);
}
