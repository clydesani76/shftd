// Deterministic mock AI provider. Generates plausible, structured marketing
// output with no external calls — so the product is fully demoable offline.
// The "intelligence" here is heuristic/templated, NOT machine learning.
// Swap in `openaiProvider` once OPENAI_API_KEY is configured.

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

  async analyzeCompetitor({
    brandName,
    domain,
    socialHandle,
    industry,
    ourBrand,
    ourAudience,
    siteContext,
  }: AnalyzeCompetitorInput): Promise<CompetitorAnalysis> {
    const h = hash(brandName);
    const score = (base: number, salt: string) =>
      Math.min(94, Math.max(38, base + (hash(brandName + salt) % 22) - 8));
    const overall = score(70, "overall");

    return {
      brandName,
      summary: `${brandName} is an established ${industry} player with a polished web presence and steady social output, but leans on category-generic messaging. That predictability is the opening: ${ourBrand} can win by pattern-matching what already works for them while claiming the moments they overlook.`,
      threatLevel: overall >= 75 ? "high" : overall >= 55 ? "medium" : "low",
      overallScore: overall,
      scorecard: [
        {
          dimension: "Website & UX",
          score: score(74, "web"),
          note: siteContext
            ? "Clear value proposition and conversion path observed on the homepage; strong first impression."
            : "Assumed competent based on category norms — live page could not be fetched.",
        },
        {
          dimension: "Google / SEO",
          score: score(64, "seo"),
          note: "Ranks for branded and a few category terms; thin on long-tail informational content (estimated).",
        },
        {
          dimension: "Social presence",
          score: score(68, "social"),
          note: "Consistent posting cadence, but formats are repetitive and rarely trend-setting.",
        },
        {
          dimension: "Campaigns",
          score: score(66, "camp"),
          note: "Reliable creator + paid-social mix; few bold, ownable narrative plays.",
        },
        {
          dimension: "Offer & Positioning",
          score: score(71, "offer"),
          note: "Competitive offer, but positioning overlaps with the category — limited differentiation.",
        },
      ],
      channels: [
        {
          channel: "Instagram",
          presence: "strong",
          strength: score(72, "ig"),
          assessment: `Primary channel${socialHandle ? ` (${socialHandle})` : ""} — polished but formulaic Reels and carousels.`,
        },
        {
          channel: "TikTok",
          presence: "moderate",
          strength: score(58, "tt"),
          assessment: "Present but under-invested; low native-creator volume — a clear opening.",
        },
        {
          channel: "Google Search",
          presence: "moderate",
          strength: score(60, "g"),
          assessment: "Owns branded search; weak on high-intent problem/solution queries (estimated).",
        },
        {
          channel: "YouTube",
          presence: "weak",
          strength: score(44, "yt"),
          assessment: "Minimal long-form footprint — untapped authority-building space.",
        },
        {
          channel: "Email",
          presence: "moderate",
          strength: score(62, "em"),
          assessment: "Standard lifecycle flows; little community or movement-building.",
        },
      ],
      campaignTypes: [
        {
          type: "UGC / creator",
          description: "Steady stream of creator testimonials and product demos.",
          intensity: "high",
        },
        {
          type: "Paid social",
          description: "Always-on prospecting + retargeting on Meta.",
          intensity: "medium",
        },
        {
          type: "Seasonal promotion",
          description: "Discount-led pushes around key retail moments.",
          intensity: "medium",
        },
        {
          type: "Influencer",
          description: "Occasional mid-tier partnerships; few flagship collaborations.",
          intensity: "low",
        },
      ],
      strengths: [
        "Consistent, professional brand presentation across channels",
        "Established branded-search demand and repeat-customer base",
        "Reliable creator pipeline producing steady social proof",
      ],
      gaps: [
        "Repetitive, category-generic hooks — vulnerable to a sharper narrative",
        "Under-invested on TikTok and YouTube — open territory",
        "No ownable cultural moment or movement — pure product marketing",
        "Thin high-intent SEO content — winnable search demand",
      ],
      recommendedCampaigns: [
        {
          path: "proven",
          title: `Out-Hook ${brandName}`,
          concept: `Pattern-match ${brandName}'s best-performing creator format for ${ourBrand}, but lead with a sharper first-person outcome hook aimed at ${ourAudience}.`,
          rationale:
            "Attacks their strongest channel with a lower-variance, proven structure — capturing the same demand with a more differentiated hook.",
          riskLevel: "low",
          expectedUpside: "Efficient top-of-funnel reach and CAC at or below their benchmark.",
          platforms: ["Instagram", "TikTok"],
          creatorRoles: ["igniter", "amplifier"],
          kpis: ["Views", "Hook retention %", "CTR to landing", "First orders"],
          budgetSplit: [
            { label: "Igniter creators", percent: 50 },
            { label: "Amplifier creators", percent: 25 },
            { label: "Performance bonus pool", percent: 25 },
          ],
        },
        {
          path: "original",
          title: "Own the Gap They Ignore",
          concept: `Originate a movement around the under-served moment ${brandName} overlooks — seed on TikTok/YouTube where they're weakest, and rally ${ourAudience} around it.`,
          rationale:
            "Seizes white space competitors under-invest in, building defensible category ownership and compounding organic reach.",
          riskLevel: "high",
          expectedUpside: "Category ownership of an unclaimed moment; compounding UGC and search lift.",
          platforms: ["TikTok", "YouTube", "Instagram"],
          creatorRoles: ["igniter", "amplifier", "closer"],
          kpis: ["Branded hashtag volume", "Repeat UGC", "Search lift", "Conversions"],
          budgetSplit: [
            { label: "Igniter (seed)", percent: 40 },
            { label: "Amplifier (scale)", percent: 30 },
            { label: "Closer (convert)", percent: 15 },
            { label: "Performance bonus pool", percent: 15 },
          ],
        },
      ],
      sources: [
        siteContext ? "Live website fetch" : "Website fetch unavailable",
        "SHFTD category knowledge (offline demo model)",
        domain ? `Domain: ${domain}` : "No domain provided",
      ],
      disclaimer:
        "Demo analysis: social and search figures are directional estimates, not measured analytics. Connect live data sources (site fetch + platform/SEO APIs) for verified metrics.",
    };
  },
};
