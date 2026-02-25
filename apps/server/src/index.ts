import { env } from "@job-auto-apply/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initDb, memoriesTable } from "./db/zvec";
import memories from "./routes/memories";
import resumes from "./routes/resumes";
import providers from "./routes/providers";

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

export default {
  port: env.PORT,
  fetch: app.fetch,
};
