// Contracts for the AI service layer. The rest of the app depends only on
// these interfaces — never on a specific LLM vendor — so providers are
// swappable (mock today, OpenAI/Claude/etc. tomorrow).

import type {
  CampaignPath,
  CopyType,
  CreatorRole,
  Evidence,
  InsightCategory,
  RiskLevel,
} from "@/types";

export interface GeneratedInsight {
  category: InsightCategory;
  title: string;
  explanation: string;
  recommendation: string;
  channel: string;
  confidence: number;
}

export interface GeneratedStrategy {
  path: CampaignPath;
  title: string;
  concept: string;
  rationale: string;
  riskLevel: RiskLevel;
  expectedUpside: string;
  platforms: string[];
  creatorRoles: CreatorRole[];
  kpis: string[];
  budgetSplit: { label: string; percent: number }[];
}

export interface GeneratedCopy {
  type: CopyType;
  platform: string;
  tone: string;
  content: string;
  score: number;
}

export interface AnalyzeInsightsInput {
  brandName: string;
  industry: string;
  evidence: Pick<Evidence, "type" | "channel" | "content">[];
}

export interface GenerateStrategiesInput {
  brandName: string;
  industry: string;
  audience: string;
  goals: string[];
  insightSummaries: string[];
  // Past wins/losses from Marketing Memory to bias recommendations.
  memory?: string[];
}

export interface GenerateCopyInput {
  campaignName?: string;
  brandVoice: string;
  platform: string;
  audience: string;
  offer: string;
  tone: string;
  type: CopyType;
  count?: number;
}

// ── Deep competitor analysis ──────────────────────────────────
// A measured, multi-dimensional read of a single competitor across their
// website, search/SEO, social platforms, and campaign activity — plus the
// campaigns SHFTD recommends to out-compete them.

export interface CompetitorScoreItem {
  dimension: string; // e.g. "Website & UX", "Google / SEO", "Social", "Campaigns", "Offer & Positioning"
  score: number; // 0-100
  note: string;
}

export interface CompetitorChannelAssessment {
  channel: string; // "Instagram" | "TikTok" | "Google Search" | "YouTube" | "Email" | ...
  presence: "none" | "weak" | "moderate" | "strong" | "unknown";
  strength: number; // 0-100 (estimated)
  assessment: string;
}

export interface CompetitorCampaignType {
  type: string; // "UGC / creator", "Paid search", "Email nurture", "Influencer", ...
  description: string;
  intensity: "low" | "medium" | "high";
}

export interface CompetitorAnalysis {
  brandName: string;
  summary: string;
  threatLevel: RiskLevel; // low | medium | high
  overallScore: number; // 0-100 overall competitive strength
  scorecard: CompetitorScoreItem[];
  channels: CompetitorChannelAssessment[];
  campaignTypes: CompetitorCampaignType[];
  strengths: string[];
  gaps: string[]; // weaknesses / white space to exploit
  recommendedCampaigns: GeneratedStrategy[]; // proven + original, to out-compete
  sources: string[]; // what informed the read (e.g. "Live website fetch")
  disclaimer: string; // honesty note about estimated vs. measured signals
  // REAL signals scraped from the competitor's live site (not AI-generated).
  discovered?: {
    socialLinks: { platform: string; url: string }[];
    detectedTech: string[];
    siteUrl: string;
  };
}

export interface AnalyzeCompetitorInput {
  brandName: string;
  domain?: string;
  socialHandle?: string;
  industry: string;
  ourBrand: string;
  ourAudience: string;
  // Real page text fetched server-side (title, description, visible copy).
  siteContext?: string;
}

// The single interface every AI provider must implement.
export interface AIProvider {
  readonly name: string;
  analyzeInsights(input: AnalyzeInsightsInput): Promise<GeneratedInsight[]>;
  generateStrategies(input: GenerateStrategiesInput): Promise<GeneratedStrategy[]>;
  generateCopy(input: GenerateCopyInput): Promise<GeneratedCopy[]>;
  analyzeCompetitor(input: AnalyzeCompetitorInput): Promise<CompetitorAnalysis>;
}
