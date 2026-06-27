// ─────────────────────────────────────────────────────────────
// Data access layer
// The app's pages/components call these functions instead of touching
// Supabase or mock data directly. In DEMO MODE they return the in-memory
// mock dataset. When Supabase is configured, swap the bodies for queries
// (the return shapes already match src/types).
//
// Kept synchronous-friendly: each getter returns data immediately in demo
// mode. The async wrappers exist so the Supabase implementation can drop in
// without changing call sites.
// ─────────────────────────────────────────────────────────────

import { config } from "@/lib/config";
import * as mock from "@/lib/mock/data";
import type {
  Campaign,
  CampaignApplication,
  CampaignMetrics,
  Competitor,
  CopyVariant,
  CreatorProfile,
  Evidence,
  Insight,
  LedgerEntry,
  MarketplaceListing,
  Submission,
} from "@/types";

// ── Org / profile ─────────────────────────────────────────────
export function getOrg() {
  return mock.ORG;
}
export function getBusinessProfile() {
  return mock.BUSINESS_PROFILE;
}
export function getUsers() {
  return mock.USERS;
}

// ── Intelligence ──────────────────────────────────────────────
export function getCompetitors(): Competitor[] {
  // TODO(supabase): select * from ci_competitors where org_id = currentOrg
  return mock.COMPETITORS;
}
export function getEvidence(): Evidence[] {
  return mock.EVIDENCE;
}
export function getEvidenceForCompetitor(competitorId: string): Evidence[] {
  return mock.EVIDENCE.filter((e) => e.competitorId === competitorId);
}
export function getInsights(): Insight[] {
  return mock.INSIGHTS;
}

// ── Strategy ──────────────────────────────────────────────────
export function getRecommendations() {
  return mock.RECOMMENDATIONS;
}

// ── Campaigns ─────────────────────────────────────────────────
export function getCampaigns(): Campaign[] {
  return mock.CAMPAIGNS;
}
export function getCampaign(id: string): Campaign | undefined {
  return mock.CAMPAIGNS.find((c) => c.id === id);
}
export function getMarketplace(): MarketplaceListing[] {
  return mock.MARKETPLACE;
}
export function getApplications(campaignId?: string): CampaignApplication[] {
  return campaignId
    ? mock.APPLICATIONS.filter((a) => a.campaignId === campaignId)
    : mock.APPLICATIONS;
}
export function getSubmissions(campaignId?: string): Submission[] {
  return campaignId
    ? mock.SUBMISSIONS.filter((s) => s.campaignId === campaignId)
    : mock.SUBMISSIONS;
}

// ── Creators ──────────────────────────────────────────────────
export function getCreators(): CreatorProfile[] {
  return mock.CREATORS;
}
export function getCreator(id: string): CreatorProfile | undefined {
  return mock.CREATORS.find((c) => c.id === id);
}

// ── Copy ──────────────────────────────────────────────────────
export function getCopyVariants(campaignId?: string): CopyVariant[] {
  return campaignId
    ? mock.COPY_VARIANTS.filter((c) => c.campaignId === campaignId)
    : mock.COPY_VARIANTS;
}

// ── Payouts ───────────────────────────────────────────────────
export function getLedger(): LedgerEntry[] {
  return mock.LEDGER;
}

// ── Analytics ─────────────────────────────────────────────────
export function getMetrics(): CampaignMetrics[] {
  return mock.METRICS;
}
export function getMetricsForCampaign(campaignId: string): CampaignMetrics | undefined {
  return mock.METRICS.find((m) => m.campaignId === campaignId);
}

// ── Memory ────────────────────────────────────────────────────
export function getMemory() {
  return mock.MEMORY;
}

// Surface mode so UI can show a "Demo data" badge.
export const isDemo = config.demoMode;
