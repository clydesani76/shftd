// OpenAI image provider (server-only). Calls the Images API (gpt-image-1) via
// fetch — no SDK dependency. Returns base64 data URLs the browser can render.
// Selected when OPENAI_API_KEY is present; otherwise the placeholder provider
// is used (see ./index.ts). If a call fails, callers fall back to placeholders.

import type { GeneratedImage, GenerateImageInput, ImageProvider } from "./types";

interface OpenAIImageResponse {
  data: { b64_json?: string; url?: string }[];
}

export const openaiImages: ImageProvider = {
  name: "openai",
  async generate({
    prompt,
    size = "1024x1024",
    count = 1,
  }: GenerateImageInput): Promise<GeneratedImage[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: Math.min(Math.max(count, 1), 4),
        size,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI image error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as OpenAIImageResponse;
    return data.data.map((d) => ({
      url: d.b64_json ? `data:image/png;base64,${d.b64_json}` : (d.url ?? ""),
      prompt,
    }));
  },
};
