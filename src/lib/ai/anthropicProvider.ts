// Live Anthropic provider (server-only). Implements the shared AIProvider
// contract using the official @anthropic-ai/sdk, so insights, strategy, and
// copy come from Claude instead of the deterministic mock generator.
//
// Selected automatically when ANTHROPIC_API_KEY is set (see ./index.ts). The
// API routes that call this already fall back to the mock provider if a call
// throws, so a transient error degrades gracefully rather than 500ing.

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
import { config } from "@/lib/config";

const SYSTEM_PROMPT = `You are SHFTD's marketing strategist engine. You do not write captions in a vacuum — you think like a senior growth strategist. You analyze competitor activity, identify what works, what is overused, and where the white space is, and you always explain WHY each recommendation makes sense.

Output rules: respond with valid JSON ONLY — no prose, no explanation, no markdown code fences. Match the exact shape and field names requested in each message.`;

// Lazily construct the client so merely importing this module never requires a
// key (the constructor reads ANTHROPIC_API_KEY from the environment).
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  return new Anthropic();
}

// Parse a JSON value out of a model response, tolerating stray prose or code
// fences by falling back to the outermost bracketed region.
function parseJson<T>(raw: string): T {
  let s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    const candidates = [s.indexOf("["), s.indexOf("{")].filter((i) => i >= 0);
    const start = candidates.length ? Math.min(...candidates) : -1;
    const end = Math.max(s.lastIndexOf("]"), s.lastIndexOf("}"));
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1)) as T;
    }
    throw new Error("Could not parse JSON from Anthropic response");
  }
}

async function completeJson<T>(userPrompt: string, maxTokens = 4096): Promise<T> {
  const res = await getClient().messages.create({
    model: config.aiModel,
    max_tokens: maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let text = "";
  for (const block of res.content) {
    if (block.type === "text") text += block.text;
  }
  return parseJson<T>(text);
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",

  async analyzeInsights({
    brandName,
    industry,
    evidence,
  }: AnalyzeInsightsInput): Promise<GeneratedInsight[]> {
    const prompt = `Analyze this competitor evidence for "${brandName}" (${industry}). Categorize the findings into winning patterns, overused angles, and white-space opportunities.

Evidence:
${JSON.stringify(evidence, null, 2)}

Return a JSON array of 3 to 6 objects. Each object must have exactly these fields:
- "category": one of "winning_pattern" | "overused_angle" | "white_space"
- "title": string (short headline)
- "explanation": string (what's happening and why it matters)
- "recommendation": string (what ${brandName} should do)
- "channel": string (e.g. "TikTok", "Email", "Multi-channel")
- "confidence": number from 0 to 100

Return ONLY the JSON array.`;
    return completeJson<GeneratedInsight[]>(prompt);
  },

  async generateStrategies({
    brandName,
    industry,
    audience,
    goals,
    insightSummaries,
    memory = [],
  }: GenerateStrategiesInput): Promise<GeneratedStrategy[]> {
    const prompt = `Generate exactly two campaign strategies for "${brandName}" (${industry}).
Audience: ${audience}
Goals: ${goals.join(", ")}
Competitive insights: ${insightSummaries.join("; ") || "none provided"}
Marketing memory (past wins/losses — bias the recommendations with these): ${
      memory.join("; ") || "none yet"
    }

One strategy must have "path": "proven" (Safe & Proven — lower-risk, pattern-matched to what competitors already do well). The other must have "path": "original" (Bold & Original — higher-upside first-mover play from white-space/trend synthesis).

Return a JSON array of EXACTLY 2 objects. Each object must have exactly these fields:
- "path": "proven" | "original"
- "title": string
- "concept": string
- "rationale": string (explain WHY, referencing the insights/memory)
- "riskLevel": "low" | "medium" | "high"
- "expectedUpside": string
- "platforms": array of strings
- "creatorRoles": array of "igniter" | "amplifier" | "closer"
- "kpis": array of strings
- "budgetSplit": array of objects, each { "label": string, "percent": number }, percents summing to 100

Return ONLY the JSON array.`;
    return completeJson<GeneratedStrategy[]>(prompt);
  },

  async generateCopy({
    type,
    platform,
    tone,
    audience,
    offer,
    brandVoice,
    campaignName,
    count = 4,
  }: GenerateCopyInput): Promise<GeneratedCopy[]> {
    const prompt = `Write ${count} distinct variants of ${type} marketing copy.
Platform: ${platform}
Tone: ${tone}
Audience: ${audience}
Offer: ${offer || "(none specified)"}
Brand voice: ${brandVoice || "(use a strong, modern marketing voice)"}${
      campaignName ? `\nCampaign: ${campaignName}` : ""
    }

Return a JSON array of ${count} objects. Each object must have exactly these fields:
- "type": "${type}"
- "platform": "${platform}"
- "tone": "${tone}"
- "content": string (the copy itself)
- "score": number from 0 to 100 estimating how well it fits the brief

Return ONLY the JSON array.`;
    return completeJson<GeneratedCopy[]>(prompt);
  },
};
