// Anthropic-backed AI provider (server-only).
// Implements the same AIProvider contract as the mock/openai providers, so it
// drops in with no changes to routes or call sites. Selected automatically in
// src/lib/ai/index.ts whenever ANTHROPIC_API_KEY is present.

import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  AnalyzeInsightsInput,
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
async function callLLM(userPrompt: string): Promise<Record<string, unknown>> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
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
};

export { SYSTEM_PROMPT };
