// Deterministic mock AI provider. Generates plausible, structured marketing
// output with no external calls — so the product is fully demoable offline.
// The "intelligence" here is heuristic/templated, NOT machine learning.
// Swap in `openaiProvider` once OPENAI_API_KEY is configured.

import type {
  AIProvider,
  AnalyzeInsightsInput,
  GenerateCopyInput,
  GenerateStrategiesInput,
  GeneratedCopy,
  GeneratedInsight,
  GeneratedStrategy,
} from "./types";
import type { CopyType } from "@/types";

// Tiny pseudo-random helper seeded by string for stable-ish output.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Email"];

export const mockProvider: AIProvider = {
  name: "mock",

  async analyzeInsights({
    brandName,
    evidence,
  }: AnalyzeInsightsInput): Promise<GeneratedInsight[]> {
    // Categorize the supplied evidence into the three insight buckets.
    const channels = Array.from(
      new Set(evidence.map((e) => e.channel).filter(Boolean)),
    );
    const primaryChannel = channels[0] || "Multi-channel";

    return [
      {
        category: "winning_pattern",
        title: "Repeatable hook format is outperforming in-category",
        explanation: `Across the captured evidence, the strongest-performing assets share a first-person, outcome-led hook. ${brandName} can pattern-match this proven structure.`,
        recommendation:
          "Brief Igniter creators to lead with a first-person outcome hook in the first 2 seconds.",
        channel: primaryChannel,
        confidence: 80 + (hash(brandName) % 12),
      },
      {
        category: "overused_angle",
        title: "Category messaging is converging on generic benefit claims",
        explanation:
          "Multiple competitors lean on the same benefit phrasing, eroding differentiation and depressing engagement over time.",
        recommendation:
          "Avoid the saturated phrasing as a primary hook; subvert or reframe it to stand out.",
        channel: channels[1] || primaryChannel,
        confidence: 75 + (hash(brandName + "o") % 12),
      },
      {
        category: "white_space",
        title: "An untapped daily moment is available to own",
        explanation:
          "No competitor has claimed a specific high-intent daily moment for the target audience — a first-mover opportunity to define a new category beat.",
        recommendation:
          "Originate a movement around the unclaimed moment. High upside, defensible brand association.",
        channel: "Multi-channel",
        confidence: 66 + (hash(brandName + "w") % 14),
      },
    ];
  },

  async generateStrategies({
    brandName,
    audience,
    insightSummaries,
    memory = [],
  }: GenerateStrategiesInput): Promise<GeneratedStrategy[]> {
    const memoryNote =
      memory.length > 0
        ? ` Marketing Memory shows: ${memory[0]} — this recommendation accounts for that.`
        : "";

    const proven: GeneratedStrategy = {
      path: "proven",
      title: "Pattern-Matched Performance Play",
      concept: `Adapt the winning in-category hook structure for ${brandName}, executed by credible Igniter + Amplifier creators targeting ${audience}.`,
      rationale: `Built directly on observed winning patterns${
        insightSummaries[0] ? ` ("${insightSummaries[0]}")` : ""
      }. Lower variance, predictable reach.${memoryNote}`,
      riskLevel: "low",
      expectedUpside: "Predictable top-of-funnel reach and efficient CAC.",
      platforms: ["TikTok", "Instagram"],
      creatorRoles: ["igniter", "amplifier"],
      kpis: ["Views", "Hook retention %", "CTR to landing", "First orders"],
      budgetSplit: [
        { label: "Igniter creators", percent: 50 },
        { label: "Amplifier creators", percent: 25 },
        { label: "Performance bonus pool", percent: 25 },
      ],
    };

    const original: GeneratedStrategy = {
      path: "original",
      title: "First-Mover Movement Play",
      concept: `Originate and own the untapped moment surfaced in white-space analysis for ${brandName}. Seed with Igniters, scale with Amplifiers, convert with Closers.`,
      rationale: `Targets a white-space opportunity competitors ignore. Higher variance, but defensible category ownership that others may eventually copy.${memoryNote}`,
      riskLevel: "high",
      expectedUpside:
        "Category ownership of a daily moment; compounding UGC; defensible brand association.",
      platforms: ["TikTok", "Instagram", "YouTube"],
      creatorRoles: ["igniter", "amplifier", "closer"],
      kpis: ["Branded hashtag volume", "Repeat UGC", "Search lift", "Conversions"],
      budgetSplit: [
        { label: "Igniter (seed)", percent: 40 },
        { label: "Amplifier (scale)", percent: 30 },
        { label: "Closer (convert)", percent: 15 },
        { label: "Performance bonus pool", percent: 15 },
      ],
    };

    return [proven, original];
  },

  async generateCopy({
    type,
    platform,
    tone,
    offer,
    audience,
    count = 4,
  }: GenerateCopyInput): Promise<GeneratedCopy[]> {
    const templates: Record<CopyType, string[]> = {
      hook: [
        "I tried this for 30 days. Day 3 nearly broke me — then everything changed.",
        `Nobody tells you what really happens when ${audience} make this one swap.`,
        "Stop scrolling if you've ever hit a wall by 3PM.",
        "This is the part the ads never show you.",
      ],
      headline: [
        "The upgrade your routine was missing",
        "Built for people who refuse to flatline",
        "Less crash. More you.",
        "The ritual high-performers actually keep",
      ],
      caption: [
        `${tone} take: the old way is over. ${offer} Tap to start.`,
        "We didn't follow the trend. We set it. Here's how 👇",
        "Real talk for real ones — this is your sign.",
        "Save this for the next time you hit the wall.",
      ],
      cta: [
        `Start now — ${offer}`,
        "Claim your spot before it's gone",
        "Join the ones who switched",
        "Get yours, first order ships today",
      ],
      script: [
        `[Hook] Open on a relatable struggle. [Beat 1] Introduce the swap. [Beat 2] Honest first-week reality. [Beat 3] The turnaround. [CTA] ${offer}`,
        "[Cold open] Pattern interrupt. [Demo] Show, don't tell. [Proof] Quick result. [CTA] Soft close.",
        "[POV] First person. [Tension] The problem at its worst. [Resolution] The fix. [CTA] Tap the link.",
        "[Question] Ask the audience their pain. [Empathy] You're not alone. [Solution] Here's what worked. [CTA].",
      ],
      landing_page: [
        `Headline: Beat the wall. Subhead: Built for ${audience}. ${offer} CTA: Start your ritual kit.`,
        "Hero: One line promise. Social proof bar. 3 benefit cards. Sticky CTA.",
        "Above the fold: outcome-led headline + product shot + urgency banner.",
        "Problem → Agitate → Solution structure with a single, clear CTA.",
      ],
      ad: [
        `Primary text: The swap ${audience} keep talking about. ${offer} Headline: Try it risk-free.`,
        "Hook line + benefit + proof + CTA, optimized for paid social feed.",
        "UGC-style ad: creator testimonial → product → offer.",
        "Direct-response ad: bold claim, quick proof, urgency CTA.",
      ],
    };

    const pool = templates[type] ?? templates.caption;
    return pool.slice(0, count).map((content, i) => ({
      type,
      platform,
      tone,
      content,
      // Score blends a base by position with a stable jitter.
      score: Math.min(96, 72 + (pool.length - i) * 4 + (hash(content) % 7)),
    }));
  },
};
