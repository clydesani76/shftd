// AI service entry point. Selects a provider based on configuration and
// re-exports the unified interface. The rest of the app imports `ai` from here.

import { config } from "@/lib/config";
import type { AIProvider } from "./types";
import { mockProvider } from "./mockProvider";
import { openaiProvider } from "./openaiProvider";
import { anthropicProvider } from "./anthropicProvider";

// Prefer the live Anthropic provider when ANTHROPIC_API_KEY is set; then the
// OpenAI provider; otherwise the deterministic mock. If a live call throws,
// callers catch and degrade to the mock provider.
export const ai: AIProvider = config.hasAnthropic
  ? anthropicProvider
  : config.hasAI
    ? openaiProvider
    : mockProvider;

// Always-available mock, handy for previews and graceful fallback.
export { mockProvider };
export type * from "./types";
