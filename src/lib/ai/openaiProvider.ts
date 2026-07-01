// OpenAI-backed provider (server-only). This is wired but inert until
// OPENAI_API_KEY is present — see src/lib/ai/index.ts for selection logic.
//
// TODO: install the `openai` package and uncomment the live call. For now,
// each method documents the intended prompt and throws if invoked without a
// key so we never silently fail. The structured-output contract matches
// AIProvider so swapping providers requires no changes elsewhere.

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

const SYSTEM_PROMPT = `You are SHFTD's marketing strategist engine. You do not write captions in a vacuum — you think like a senior growth strategist. You analyze competitor activity, identify what works, what is overused, and where the white space is. You produce structured JSON only, matching the requested schema. Always explain WHY each recommendation makes sense.`;

async function callLLM(userPrompt: string): Promise<string> {
  if (!config.hasOpenAI) {
    throw new Error(
      "OPENAI_API_KEY not configured — openaiProvider should not be selected. Falling back to mockProvider.",
    );
  }
  // TODO: replace with a real call, e.g.:
  //
  // import OpenAI from "openai";
  // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const res = await client.chat.completions.create({
  //   model: config.aiModel,
  //   response_format: { type: "json_object" },
  //   messages: [
  //     { role: "system", content: SYSTEM_PROMPT },
  //     { role: "user", content: userPrompt },
  //   ],
  // });
  // return res.choices[0]?.message?.content ?? "{}";
  throw new Error("Live LLM call not yet implemented. See TODO in openaiProvider.ts");
}

export const openaiProvider: AIProvider = {
  name: "openai",

  async analyzeInsights(input: AnalyzeInsightsInput): Promise<GeneratedInsight[]> {
    const prompt = `Analyze this competitor evidence for "${input.brandName}" (${input.industry}). Categorize findings into winning_pattern, overused_angle, and white_space. Evidence:\n${JSON.stringify(
      input.evidence,
      null,
      2,
    )}\nReturn JSON: { "insights": GeneratedInsight[] }`;
    const raw = await callLLM(prompt);
    return JSON.parse(raw).insights;
  },

  async generateStrategies(
    input: GenerateStrategiesInput,
  ): Promise<GeneratedStrategy[]> {
    const prompt = `Generate exactly two campaign strategies for "${input.brandName}": one path="proven" (Safe & Proven) and one path="original" (Bold & Original). Audience: ${input.audience}. Goals: ${input.goals.join(
      ", ",
    )}. Insights: ${input.insightSummaries.join("; ")}. Past learnings: ${(
      input.memory || []
    ).join("; ")}. Return JSON: { "strategies": GeneratedStrategy[] }`;
    const raw = await callLLM(prompt);
    return JSON.parse(raw).strategies;
  },

  async generateCopy(input: GenerateCopyInput): Promise<GeneratedCopy[]> {
    const prompt = `Write ${input.count ?? 4} variants of ${input.type} copy for platform ${input.platform}, tone ${input.tone}, audience ${input.audience}, offer "${input.offer}", brand voice "${input.brandVoice}". Score each 0-100 for fit. Return JSON: { "variants": GeneratedCopy[] }`;
    const raw = await callLLM(prompt);
    return JSON.parse(raw).variants;
  },
};

export { SYSTEM_PROMPT };
