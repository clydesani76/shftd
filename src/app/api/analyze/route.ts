// Always run on each request (live website fetch + AI + DB writes).
export const dynamic = "force-dynamic";
// Deep competitor analysis can take a while (site fetch + a large LLM call).
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { ai, mockProvider } from "@/lib/ai";
import { fetchSiteContext } from "@/lib/ai/siteContext";
import { listCompetitors } from "@/lib/db/competitors";
import { getAnalysis, saveAnalysis } from "@/lib/db/analysis";
import { ORG, BUSINESS_PROFILE } from "@/lib/mock/data";
import type { CompetitorAnalysis } from "@/lib/ai/types";

// Defensive: a live model can occasionally omit a field. Coerce the response
// into a safe shape so the UI (which maps over arrays) never crashes.
function normalize(
  a: Partial<CompetitorAnalysis>,
  brandName: string,
): CompetitorAnalysis {
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const level = a.threatLevel;
  return {
    brandName: a.brandName || brandName,
    summary: a.summary || "Analysis unavailable — please re-run.",
    threatLevel:
      level === "low" || level === "medium" || level === "high"
        ? level
        : "medium",
    overallScore: typeof a.overallScore === "number" ? a.overallScore : 60,
    scorecard: arr(a.scorecard),
    channels: arr(a.channels),
    campaignTypes: arr(a.campaignTypes),
    strengths: arr(a.strengths),
    gaps: arr(a.gaps),
    recommendedCampaigns: arr(a.recommendedCampaigns),
    sources: arr<string>(a.sources).length ? arr<string>(a.sources) : ["AI analysis"],
    disclaimer:
      a.disclaimer ||
      "Some signals are AI estimates rather than measured analytics.",
  };
}

// GET ?competitorId= — return the latest stored analysis (if any).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const competitorId = searchParams.get("competitorId");
  if (!competitorId) {
    return NextResponse.json({ error: "competitorId required" }, { status: 400 });
  }
  try {
    const stored = await getAnalysis(competitorId);
    return NextResponse.json({ analysis: stored?.analysis ?? null });
  } catch (e) {
    return NextResponse.json(
      { analysis: null, error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

// POST { competitorId } — fetch the competitor's site, run a measured AI
// analysis (with mock fallback), persist it, and return it.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { competitorId?: string };
  const competitorId = body.competitorId;
  if (!competitorId) {
    return NextResponse.json({ error: "competitorId required" }, { status: 400 });
  }

  const competitor = (await listCompetitors()).find((c) => c.id === competitorId);
  if (!competitor) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  }

  // Ground the analysis in real page content where possible.
  const site = await fetchSiteContext(competitor.domain);

  const input = {
    brandName: competitor.brandName,
    domain: competitor.domain,
    socialHandle: competitor.socialHandle,
    industry: competitor.category || ORG.industry,
    ourBrand: ORG.name,
    ourAudience: BUSINESS_PROFILE.targetAudience,
    siteContext: site.ok ? site.text : undefined,
  };

  let analysis: CompetitorAnalysis;
  let provider = ai.name;
  try {
    analysis = normalize(await ai.analyzeCompetitor(input), competitor.brandName);
    // If a live model returned an empty/degenerate report, fall back.
    if (analysis.scorecard.length === 0 && analysis.recommendedCampaigns.length === 0) {
      analysis = await mockProvider.analyzeCompetitor(input);
      provider = "mock-fallback";
    }
  } catch {
    // Degrade gracefully so the feature always returns something usable.
    analysis = await mockProvider.analyzeCompetitor(input);
    provider = "mock-fallback";
  }

  try {
    await saveAnalysis(competitorId, analysis);
  } catch {
    // Persistence is best-effort; still return the fresh analysis.
  }

  return NextResponse.json({ analysis, provider, siteFetched: site.ok });
}
