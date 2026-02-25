import { env } from "@job-auto-apply/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initDb, collection } from "./db/db";
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
    origin: (origin) => {
      if (!origin) return env.CORS_ORIGIN;
      if (origin.startsWith("chrome-extension://") || origin === env.CORS_ORIGIN) {
        return origin;
      }
      return env.CORS_ORIGIN;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    database: collection ? "connected" : "disconnected",
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
