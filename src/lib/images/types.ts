// Contracts for the image-generation layer. Mirrors the AIProvider pattern in
// src/lib/ai so providers are swappable (placeholder today, OpenAI when a key
// is present, others later) without touching call sites.

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

export interface GenerateImageInput {
  prompt: string;
  size?: ImageSize;
  count?: number;
}

export interface GeneratedImage {
  // A data: URL (base64) or a remote URL the browser can render directly.
  url: string;
  prompt: string;
}

export interface ImageProvider {
  readonly name: string;
  generate(input: GenerateImageInput): Promise<GeneratedImage[]>;
}
