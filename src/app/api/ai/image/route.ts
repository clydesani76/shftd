// Always run on each request (server-side key usage).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { imageAI, placeholderImages } from "@/lib/images";
import type { ImageSize } from "@/lib/images/types";

const SIZES: ImageSize[] = ["1024x1024", "1024x1536", "1536x1024"];

// POST /api/ai/image — generate marketing images from a prompt (gpt-image-1
// when OPENAI_API_KEY is set, else branded placeholders). Falls back to
// placeholders if a live call fails so the UI never hard-errors.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    prompt?: string;
    size?: ImageSize;
    count?: number;
  };

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const input = {
    prompt: body.prompt.trim(),
    size: SIZES.includes(body.size as ImageSize) ? body.size! : "1024x1024",
    count: Math.min(Math.max(body.count ?? 1, 1), 4),
  };

  try {
    const images = await imageAI.generate(input);
    return NextResponse.json({ images, provider: imageAI.name });
  } catch (e) {
    const images = await placeholderImages.generate(input);
    return NextResponse.json({
      images,
      provider: "placeholder-fallback",
      error: e instanceof Error ? e.message : "image generation failed",
    });
  }
}
