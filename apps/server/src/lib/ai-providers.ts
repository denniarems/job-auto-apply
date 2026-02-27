import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { env } from "@job-auto-apply/env/server";

export type AIProvider = "anthropic" | "openai" | "google" | "qwen";

const GEMINI_MODEL = "gemini-2.0-flash-exp";

// Lazily initialised OpenAI-compatible clients
let _openai: ReturnType<typeof createOpenAI> | undefined;
let _qwen: ReturnType<typeof createOpenAI> | undefined;

function getOpenAIClient(): ReturnType<typeof createOpenAI> {
  if (!_openai) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    _openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return _openai;
}

function getQwenClient(): ReturnType<typeof createOpenAI> {
  if (!_qwen) {
    if (!env.QWEN_API_KEY) {
      throw new Error("QWEN_API_KEY is not configured");
    }
    _qwen = createOpenAI({
      apiKey: env.QWEN_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }
  return _qwen;
}

// Exported for use in other modules that need a plain OpenAI client (e.g. embeddings)
export const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Map an AIProvider to its corresponding AI SDK model instance.
 * The exhaustive switch ensures compile-time safety if new providers are added.
 */
export function getModel(provider: AIProvider) {
  switch (provider) {
    case "anthropic":
      return anthropic("claude-3-5-sonnet-20241022");
    case "google":
      return google(GEMINI_MODEL);
    case "openai":
      return getOpenAIClient()("gpt-4o");
    case "qwen":
      return getQwenClient()("qwen-plus");
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unknown AI provider: ${_exhaustive}`);
    }
  }
}
