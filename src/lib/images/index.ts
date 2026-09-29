// Image service entry point. Selects a provider by configuration and
// re-exports the unified interface. Call sites import `imageAI` from here.

import { config } from "@/lib/config";
import type { ImageProvider } from "./types";
import { openaiImages } from "./openaiImages";
import { placeholderImages } from "./placeholderImages";

// OpenAI (gpt-image-1) when a key is present; otherwise branded placeholders.
export const imageAI: ImageProvider = config.hasOpenAI
  ? openaiImages
  : placeholderImages;

// Always-available fallback for graceful degradation.
export { placeholderImages };
export type * from "./types";
