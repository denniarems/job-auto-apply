import { Hono } from "hono";
import { z } from "zod";
import {
  getProviderDisplayName,
  isProviderConfigured,
  type AIProvider,
} from "../lib/extraction";

const providers = new Hono();

const providerSchema = z.object({
  provider: z.enum(["anthropic", "openai", "google", "qwen"]),
});

// NOTE: selectedProvider is module-level mutable state scoped to a single server
// process. It resets to "anthropic" on every server restart and is shared across
// all requests. This is intentional for the current single-user use case.
let selectedProvider: AIProvider = "anthropic";

// GET /api/providers - List available providers and their key status
providers.get("/", (c) => {
  const availableProviders: AIProvider[] = ["anthropic", "google", "openai"];

  const providerList = availableProviders.map((provider) => ({
    id: provider,
    name: getProviderDisplayName(provider),
    configured: isProviderConfigured(provider),
  }));

  return c.json({
    success: true,
    providers: providerList,
    selected: selectedProvider,
  });
});

// GET /api/providers/config - Get current provider selection
providers.get("/config", (c) => {
  return c.json({
    success: true,
    provider: {
      id: selectedProvider,
      name: getProviderDisplayName(selectedProvider),
    },
  });
});

// PATCH /api/providers/config - Update selected provider
providers.patch("/config", async (c) => {
  try {
    const result = providerSchema.safeParse(await c.req.json());
    if (!result.success) {
      return c.json({ success: false, error: "Invalid provider" }, 400);
    }
    const { provider } = result.data;

    // Check if provider is configured
    if (!isProviderConfigured(provider)) {
      return c.json(
        {
          success: false,
          error: `${getProviderDisplayName(provider)} API key not configured`,
        },
        400
      );
    }

    selectedProvider = provider;

    return c.json({
      success: true,
      provider: {
        id: selectedProvider,
        name: getProviderDisplayName(selectedProvider),
      },
    });
  } catch (error: unknown) {
    return c.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default providers;
