import { env } from "@job-auto-apply/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initDb, memoriesTable } from "./db/lancedb";
import memories from "./routes/memories";
import resumes from "./routes/resumes";
import providers from "./routes/providers";
import forms from "./routes/forms";
import fields from "./routes/fields";
import mappings from "./routes/mappings";

const app = new Hono();

// Initialize DB
initDb().catch((err) => {
  console.error("Failed to initialize database:", err);
});

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return env.CORS_ORIGIN;
      if (origin.startsWith("chrome-extension://") || origin === env.CORS_ORIGIN) {
        return origin;
      }
      return env.CORS_ORIGIN;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    database: memoriesTable ? "connected" : "disconnected",
    keys: {
      anthropic: !!env.ANTHROPIC_API_KEY,
      openai: !!env.OPENAI_API_KEY,
      google: !!env.GOOGLE_GENERATIVE_AI_API_KEY,
      qwen: !!env.QWEN_API_KEY,
    },
  });
});

app.route("/api/memories", memories);
app.route("/api/resumes", resumes);
app.route("/api/providers", providers);
app.route("/api/forms", forms);
app.route("/api/fields", fields);
app.route("/api/mappings", mappings);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
