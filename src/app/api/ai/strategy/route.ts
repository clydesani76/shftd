import { NextResponse } from "next/server";
import { ai, mockProvider } from "@/lib/ai";
import { getBusinessProfile, getInsights, getMemory, getOrg } from "@/lib/data";
import type { GenerateStrategiesInput } from "@/lib/ai/types";

// POST /api/ai/strategy — generate side-by-side Safe & Proven vs Bold &
// Original strategy recommendations, biased by Marketing Memory.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const org = getOrg();
  const profile = getBusinessProfile();

  const input: GenerateStrategiesInput = {
    brandName: body.brandName ?? org.name,
    industry: body.industry ?? org.industry,
    audience: body.audience ?? profile.targetAudience,
    goals: body.goals ?? profile.primaryGoals,
    insightSummaries:
      body.insightSummaries ?? getInsights().map((i) => i.title),
    // Past wins/losses inform new recommendations — SHFTD's compounding edge.
    memory: body.memory ?? getMemory().map((m) => m.insight),
  };

  try {
    const strategies = await ai.generateStrategies(input);
    return NextResponse.json({ strategies, provider: ai.name });
  } catch {
    const strategies = await mockProvider.generateStrategies(input);
    return NextResponse.json({ strategies, provider: "mock-fallback" });
  }
}
