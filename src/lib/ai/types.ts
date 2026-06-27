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

// The single interface every AI provider must implement.
export interface AIProvider {
  readonly name: string;
  analyzeInsights(input: AnalyzeInsightsInput): Promise<GeneratedInsight[]>;
  generateStrategies(input: GenerateStrategiesInput): Promise<GeneratedStrategy[]>;
  generateCopy(input: GenerateCopyInput): Promise<GeneratedCopy[]>;
}
