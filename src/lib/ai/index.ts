// AI service entry point. Selects a provider based on configuration and
// re-exports the unified interface. The rest of the app imports `ai` from here.

import { config } from "@/lib/config";
import type { AIProvider } from "./types";
import { mockProvider } from "./mockProvider";
import { openaiProvider } from "./openaiProvider";

// Use the live provider when a key is present; otherwise the mock. If a live
// call throws (e.g. not yet implemented), callers can catch and degrade.
export const ai: AIProvider = config.hasAI ? openaiProvider : mockProvider;

// Always-available mock, handy for previews and graceful fallback.
export { mockProvider };
export type * from "./types";
