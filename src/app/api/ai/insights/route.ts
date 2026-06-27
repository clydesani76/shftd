import { NextResponse } from "next/server";
import { ai, mockProvider } from "@/lib/ai";
import { getEvidence, getOrg } from "@/lib/data";
import type { AnalyzeInsightsInput } from "@/lib/ai/types";

// POST /api/ai/insights — analyze competitor evidence into categorized
// insights (winning patterns / overused angles / white space).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const org = getOrg();

  const input: AnalyzeInsightsInput = {
    brandName: body.brandName ?? org.name,
    industry: body.industry ?? org.industry,
    evidence:
      body.evidence ??
      getEvidence().map((e) => ({
        type: e.type,
        channel: e.channel,
        content: e.content,
      })),
  };

  try {
    const insights = await ai.analyzeInsights(input);
    return NextResponse.json({ insights, provider: ai.name });
  } catch {
    const insights = await mockProvider.analyzeInsights(input);
    return NextResponse.json({ insights, provider: "mock-fallback" });
  }
}
