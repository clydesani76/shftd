// ─────────────────────────────────────────────────────────────
// SHFTD domain types
// These mirror the Supabase schema in `supabase/schema.sql`. Keep them
// in sync. They are the single source of truth for the app's data model.
// ─────────────────────────────────────────────────────────────

export type UUID = string;
export type ISODate = string;

// ── Roles & identity ──────────────────────────────────────────
export type UserRole = "business" | "creator" | "admin";

export interface AppUser {
  id: UUID;
  email: string;
  fullName: string;
  role: UserRole;
  orgId: UUID | null;
  avatarUrl?: string;
  createdAt: ISODate;
}

export interface Org {
  id: UUID;
  name: string;
  slug: string;
  industry: string;
  website?: string;
  createdAt: ISODate;
}

export interface BusinessProfile {
  id: UUID;
  orgId: UUID;
  brandVoice: string;
  targetAudience: string;
  primaryGoals: string[];
  monthlyBudget: number;
  channels: string[];
}

export interface CreatorProfile {
  id: UUID;
  userId: UUID;
  name: string;
  niches: string[];
  socialHandles: { platform: string; handle: string; followers: number }[];
  trustScore: number; // 0-100
  totalEarnings: number;
  completedCampaigns: number;
  avgEngagementRate: number; // percentage
  roles: CreatorRole[];
  bio: string;
  avatarUrl?: string;
}

// Creator function within a campaign / movement.
export type CreatorRole = "igniter" | "amplifier" | "closer";

// ── Competitive Intelligence ──────────────────────────────────
export interface Competitor {
  id: UUID;
  orgId: UUID;
  brandName: string;
  domain?: string;
  socialHandle?: string;
  category: string;
  addedAt: ISODate;
}

export type EvidenceType =
  | "ad"
  | "caption"
  | "landing_page"
  | "campaign"
  | "offer"
  | "hook"
  | "cta";

export interface Evidence {
  id: UUID;
  competitorId: UUID;
  type: EvidenceType;
  channel: string; // e.g. "Instagram", "TikTok", "Email"
  content: string;
  sourceUrl?: string;
  capturedAt: ISODate;
}

export type InsightCategory =
  | "winning_pattern"
  | "overused_angle"
  | "white_space";

export interface Insight {
  id: UUID;
  orgId: UUID;
  category: InsightCategory;
  title: string;
  explanation: string;
  recommendation: string;
  channel: string;
  confidence: number; // 0-100
  evidenceIds: UUID[];
  createdAt: ISODate;
}

// ── Strategy Engine ───────────────────────────────────────────
export type CampaignPath = "proven" | "original";
export type RiskLevel = "low" | "medium" | "high";

export interface StrategyRecommendation {
  id: UUID;
  orgId: UUID;
  insightId?: UUID;
  path: CampaignPath; // proven => "Safe & Proven", original => "Bold & Original"
  title: string;
  concept: string;
  rationale: string; // why it is recommended
  riskLevel: RiskLevel;
  expectedUpside: string;
  platforms: string[];
  creatorRoles: CreatorRole[];
  kpis: string[];
  budgetSplit: { label: string; percent: number }[];
  createdAt: ISODate;
}

// ── Campaigns ─────────────────────────────────────────────────
export type CampaignStatus =
  | "draft"
  | "published"
  | "live"
  | "review"
  | "completed"
  | "archived";

export interface Campaign {
  id: UUID;
  orgId: UUID;
  recommendationId?: UUID;
  name: string;
  goal: string;
  path: CampaignPath;
  status: CampaignStatus;
  narrativeAngle: string;
  targetAudience: string;
  offer: string;
  deliverables: string[];
  platforms: string[];
  creatorInstructions: string;
  timelineStart: ISODate;
  timelineEnd: ISODate;
  kpis: string[];
  budget: number;
  basePayPool: number;
  performanceBonusPool: number;
  createdAt: ISODate;
}

export interface MarketplaceListing {
  id: UUID;
  campaignId: UUID;
  isOpen: boolean;
  rolesNeeded: CreatorRole[];
  payRange: { min: number; max: number };
  publishedAt: ISODate;
}

export type ApplicationStatus =
  | "applied"
  | "invited"
  | "accepted"
  | "rejected";

export interface CampaignApplication {
  id: UUID;
  campaignId: UUID;
  creatorId: UUID;
  role: CreatorRole;
  status: ApplicationStatus;
  pitch: string;
  appliedAt: ISODate;
}

export type SubmissionStatus =
  | "submitted"
  | "approved"
  | "rejected"
  | "revision_requested";

export interface Submission {
  id: UUID;
  campaignId: UUID;
  creatorId: UUID;
  contentUrl?: string;
  fileName?: string;
  note: string;
  status: SubmissionStatus;
  reviewerNote?: string;
  submittedAt: ISODate;
}

// ── AI Copy Studio ────────────────────────────────────────────
export type CopyType =
  | "hook"
  | "headline"
  | "caption"
  | "cta"
  | "script"
  | "landing_page"
  | "ad";

export interface CopyVariant {
  id: UUID;
  orgId: UUID;
  campaignId?: UUID;
  type: CopyType;
  platform: string;
  tone: string;
  content: string;
  score: number; // 0-100 AI quality/fit score
  createdAt: ISODate;
}

export interface SavedCopy {
  id: UUID;
  campaignId: UUID;
  copyVariantId: UUID;
  savedAt: ISODate;
}

// ── Payouts & ledger ──────────────────────────────────────────
export type LedgerType =
  | "base_pay"
  | "performance_bonus"
  | "sales_bonus"
  | "payout";

export type LedgerStatus = "pending" | "approved" | "paid";

export interface LedgerEntry {
  id: UUID;
  campaignId: UUID;
  creatorId: UUID;
  type: LedgerType;
  amount: number;
  status: LedgerStatus;
  note?: string;
  createdAt: ISODate;
}

// ── Analytics ─────────────────────────────────────────────────
export interface CampaignMetrics {
  id: UUID;
  campaignId: UUID;
  views: number;
  engagement: number;
  clicks: number;
  ctr: number; // %
  conversions: number;
  revenue: number;
  cac: number;
  roas: number;
  recordedAt: ISODate;
}

// ── Marketing Memory ──────────────────────────────────────────
export type MemoryKind =
  | "winning_hook"
  | "failed_angle"
  | "best_creator_type"
  | "best_platform"
  | "best_offer"
  | "general";

export interface BrandMemoryNote {
  id: UUID;
  orgId: UUID;
  campaignId?: UUID;
  kind: MemoryKind;
  insight: string;
  outcome: "win" | "loss" | "neutral";
  metricRef?: string;
  createdAt: ISODate;
}
