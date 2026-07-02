// Anthropic-backed AI provider (server-only).
// Implements the same AIProvider contract as the mock/openai providers, so it
// drops in with no changes to routes or call sites. Selected automatically in
// src/lib/ai/index.ts whenever ANTHROPIC_API_KEY is present.

import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AnalyzeCompetitorInput,
  AnalyzeInsightsInput,
  CompetitorAnalysis,
  GenerateCopyInput,
  GenerateStrategiesInput,
  GeneratedCopy,
  GeneratedInsight,
  GeneratedStrategy,
} from "./types";

const MODEL = process.env.SHFTD_AI_MODEL || "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are SHFTD's marketing strategist engine. You think like a senior growth strategist: you read competitor activity, identify what is winning, what is overused, and where the white space is, and you weigh the brand's own past wins and losses before recommending anything. Always explain WHY each recommendation makes sense.

Output rules: respond with a SINGLE valid JSON object and nothing else — no prose, no commentary outside the JSON, no markdown code fences. Match the exact schema the user requests, including every field name.`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY not configured — anthropicProvider should not be selected.",
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Tolerate any stray fences/whitespace and clip to the outermost JSON object.
function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) t = t.slice(first, last + 1);
  return t;
}

// Single call site for the model. The system prompt constrains the reply to a
// single JSON object; extractJson clips any stray text. (Assistant-turn
// prefill is intentionally NOT used — it returns a 400 on claude-sonnet-4-6
// and the rest of the 4.6+ family.)
async function callLLM(
  userPrompt: string,
  maxTokens = 4096,
): Promise<Record<string, unknown>> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = res.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
  return JSON.parse(extractJson(text));
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",

  async analyzeInsights(
    input: AnalyzeInsightsInput,
  ): Promise<GeneratedInsight[]> {
    const prompt = `Analyze this competitor evidence for "${input.brandName}" (${input.industry}). Categorize findings into winning_pattern, overused_angle, and white_space. Evidence:\n${JSON.stringify(
      input.evidence,
      null,
      2,
    )}\nReturn JSON: { "insights": GeneratedInsight[] } where each GeneratedInsight is { category, title, explanation, recommendation, channel, confidence }. category must be one of "winning_pattern" | "overused_angle" | "white_space"; confidence is 0-100.`;
    const data = await callLLM(prompt);
    return (data.insights as GeneratedInsight[]) ?? [];
  },

  async generateStrategies(
    input: GenerateStrategiesInput,
  ): Promise<GeneratedStrategy[]> {
    const prompt = `Generate exactly two campaign strategies for "${input.brandName}": one with path="proven" (Safe & Proven, lower risk) and one with path="original" (Bold & Original, higher upside). Audience: ${input.audience}. Goals: ${input.goals.join(
      ", ",
    )}. Competitor insights: ${input.insightSummaries.join(
      "; ",
    )}. The brand's past wins and losses (Marketing Memory) — reuse what won, avoid what failed: ${(
      input.memory || []
    ).join(
      " | ",
    )}. Return JSON: { "strategies": GeneratedStrategy[] } where each is { path, title, concept, rationale, riskLevel, expectedUpside, platforms, creatorRoles, kpis, budgetSplit }. path is "proven" | "original"; riskLevel is "low" | "medium" | "high"; creatorRoles use "igniter" | "amplifier" | "closer"; budgetSplit is an array of { label, percent } summing to 100.`;
    const data = await callLLM(prompt);
    return (data.strategies as GeneratedStrategy[]) ?? [];
  },

  async generateCopy(input: GenerateCopyInput): Promise<GeneratedCopy[]> {
    const prompt = `Write ${input.count ?? 4} variants of ${input.type} copy for platform ${input.platform}, tone ${input.tone}, audience ${input.audience}, offer "${input.offer}", brand voice "${input.brandVoice}". Score each 0-100 for fit. Return JSON: { "variants": GeneratedCopy[] } where each is { type, platform, tone, content, score }.`;
    const data = await callLLM(prompt);
    return (data.variants as GeneratedCopy[]) ?? [];
  },

  async analyzeCompetitor(
    input: AnalyzeCompetitorInput,
  ): Promise<CompetitorAnalysis> {
    const site = input.siteContext
      ? `\n\nREAL website content fetched just now (use this as primary evidence; quote specifics):\n"""\n${input.siteContext}\n"""`
      : `\n\nNo live website content was retrievable, so base the read on category knowledge and the identifiers provided — and say so honestly in "sources" and "disclaimer".`;

    const prompt = `Perform a rigorous, MEASURED competitive analysis of the competitor "${input.brandName}" for our brand "${input.ourBrand}" (industry: ${input.industry}; our audience: ${input.ourAudience}).
Competitor identifiers — domain: ${input.domain || "unknown"}; social handle: ${input.socialHandle || "unknown"}.${site}

Assess the competitor across: (1) their WEBSITE & UX, (2) GOOGLE / SEO / search presence, (3) SOCIAL PLATFORMS (Instagram, TikTok, YouTube, X, etc.), (4) the TYPES OF CAMPAIGNS they appear to run, and (5) their OFFER & POSITIONING. Score each dimension 0-100 with a concrete note. Give an overall competitive-strength score (0-100) and a threatLevel. For each channel, estimate presence and a 0-100 strength with a short assessment. List the campaign types they run with an intensity. List concrete strengths and exploitable gaps (white space).

Then design EXACTLY TWO campaigns for "${input.ourBrand}" to out-compete "${input.brandName}" and drive major market growth: one path="proven" (Safe & Proven, attack their strengths with a lower-risk, pattern-matched play) and one path="original" (Bold & Original, seize a gap they ignore).

Where signals are estimated rather than measured, say so plainly — do NOT fabricate precise metrics (follower counts, exact traffic). Frame estimates as estimates.

Return a SINGLE JSON object exactly matching:
{
  "brandName": string,
  "summary": string,
  "threatLevel": "low" | "medium" | "high",
  "overallScore": number,
  "scorecard": [{ "dimension": string, "score": number, "note": string }],
  "channels": [{ "channel": string, "presence": "none"|"weak"|"moderate"|"strong"|"unknown", "strength": number, "assessment": string }],
  "campaignTypes": [{ "type": string, "description": string, "intensity": "low"|"medium"|"high" }],
  "strengths": string[],
  "gaps": string[],
  "recommendedCampaigns": [{ "path": "proven"|"original", "title": string, "concept": string, "rationale": string, "riskLevel": "low"|"medium"|"high", "expectedUpside": string, "platforms": string[], "creatorRoles": ("igniter"|"amplifier"|"closer")[], "kpis": string[], "budgetSplit": [{ "label": string, "percent": number }] }],
  "sources": string[],
  "disclaimer": string
}`;
    const data = (await callLLM(prompt, 8000)) as unknown as CompetitorAnalysis;
    return data;
  },
};

export { SYSTEM_PROMPT };
