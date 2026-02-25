import { Hono } from "hono";
import { getProviderDisplayName, isProviderConfigured, type AIProvider } from "../lib/extraction";

const providers = new Hono();

// In-memory store for selected provider (would be in DB/storage in production)
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
    const body = await c.req.json();
    const { provider } = body as { provider: AIProvider };

    if (!provider) {
      return c.json({ success: false, error: "provider is required" }, 400);
    }

    const validProviders: AIProvider[] = ["anthropic", "google", "openai"];
    if (!validProviders.includes(provider)) {
      return c.json(
        {
          success: false,
          error: `Invalid provider. Must be one of: ${validProviders.join(", ")}`,
        },
        400
      );
    }

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
  } catch (error) {
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
