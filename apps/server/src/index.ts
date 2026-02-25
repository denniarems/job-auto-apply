import { env } from "@job-auto-apply/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initDb, memoriesTable } from "./db/db";
import memories from "./routes/memories";

const app = new Hono();

// Initialize DB
initDb().catch((err) => {
  console.error("Failed to initialize database:", err);
});

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
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
    },
  });
});

app.route("/api/memories", memories);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
