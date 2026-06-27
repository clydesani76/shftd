import { NextResponse } from "next/server";
import { ai, mockProvider } from "@/lib/ai";
import type { GenerateCopyInput } from "@/lib/ai/types";

// POST /api/ai/copy — generate scored copy variants.
// Uses the configured AI provider, falling back to the mock provider if a
// live call fails (e.g. key present but provider not yet implemented).
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<GenerateCopyInput>;

  const input: GenerateCopyInput = {
    type: body.type ?? "caption",
    platform: body.platform ?? "Instagram",
    tone: body.tone ?? "Bold",
    audience: body.audience ?? "your target audience",
    offer: body.offer ?? "",
    brandVoice: body.brandVoice ?? "",
    campaignName: body.campaignName,
    count: body.count ?? 4,
  };

  try {
    const variants = await ai.generateCopy(input);
    return NextResponse.json({ variants, provider: ai.name });
  } catch {
    const variants = await mockProvider.generateCopy(input);
    return NextResponse.json({ variants, provider: "mock-fallback" });
  }
}
