// AI service entry point. Selects a provider based on configuration and
// re-exports the unified interface. The rest of the app imports `ai` from here.

import { config } from "@/lib/config";
import type { AIProvider } from "./types";
import { mockProvider } from "./mockProvider";
import { openaiProvider } from "./openaiProvider";
import { anthropicProvider } from "./anthropicProvider";

// Pick the live provider by available key — Anthropic first, then OpenAI —
// otherwise the mock. If a live call throws, route handlers catch and degrade
// to the mock so the app never hard-fails.
export const ai: AIProvider = config.hasAnthropic
  ? anthropicProvider
  : config.hasOpenAI
    ? openaiProvider
    : mockProvider;

// Always-available mock, handy for previews and graceful fallback.
export { mockProvider };
export type * from "./types";
