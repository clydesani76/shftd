// Server-side data module: Campaigns
// Reads/writes real campaign rows in Supabase (service-role, server-only),
// with a mock fallback when Supabase isn't configured.
//
// Cross-page note: pages that haven't been migrated yet (analytics, payouts,
// marketplace) still reference the mock campaigns by their string ids. To
// keep those working, getCampaign() falls back to the mock dataset when an
// id isn't found in the database.

import { createServiceSupabase } from "@/lib/supabase/server";
import { CAMPAIGNS as MOCK_CAMPAIGNS } from "@/lib/mock/data";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import { tempId } from "@/lib/utils";
import type { Campaign, CampaignPath, CampaignStatus } from "@/types";

interface CampaignRow {
  id: string;
  org_id: string;
  recommendation_id: string | null;
  name: string;
  goal: string | null;
  path: CampaignPath;
  status: CampaignStatus;
  narrative_angle: string | null;
  target_audience: string | null;
  offer: string | null;
  deliverables: string[] | null;
  platforms: string[] | null;
  creator_instructions: string | null;
  timeline_start: string | null;
  timeline_end: string | null;
  kpis: string[] | null;
  budget: number | null;
  base_pay_pool: number | null;
  performance_bonus_pool: number | null;
  created_at: string;
}

function rowToCampaign(r: CampaignRow): Campaign {
  return {
    id: r.id,
    orgId: r.org_id,
    recommendationId: r.recommendation_id ?? undefined,
    name: r.name,
    goal: r.goal ?? "",
    path: r.path,
    status: r.status,
    narrativeAngle: r.narrative_angle ?? "",
    targetAudience: r.target_audience ?? "",
    offer: r.offer ?? "",
    deliverables: r.deliverables ?? [],
    platforms: r.platforms ?? [],
    creatorInstructions: r.creator_instructions ?? "",
    timelineStart: r.timeline_start ?? "",
    timelineEnd: r.timeline_end ?? "",
    kpis: r.kpis ?? [],
    budget: Number(r.budget ?? 0),
    basePayPool: Number(r.base_pay_pool ?? 0),
    performanceBonusPool: Number(r.performance_bonus_pool ?? 0),
    createdAt: r.created_at,
  };
}

export async function listCampaigns(): Promise<Campaign[]> {
  const db = createServiceSupabase();
  if (!db) return MOCK_CAMPAIGNS;

  const { data, error } = await db
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as CampaignRow[]).map(rowToCampaign);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const db = createServiceSupabase();
  // Demo fallback: look up the mock dataset.
  if (!db) return MOCK_CAMPAIGNS.find((c) => c.id === id) ?? null;

  const { data, error } = await db
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return rowToCampaign(data as CampaignRow);

  // Not in the DB — may be a sample campaign referenced by an un-migrated
  // page. Fall back to mock so those links still resolve.
  return MOCK_CAMPAIGNS.find((c) => c.id === id) ?? null;
}

// Shape accepted from the campaign builder wizard.
export interface NewCampaign {
  name: string;
  goal?: string;
  path: CampaignPath;
  narrativeAngle?: string;
  targetAudience?: string;
  offer?: string;
  deliverables?: string[];
  platforms?: string[];
  creatorInstructions?: string;
  timelineStart?: string | null;
  timelineEnd?: string | null;
  kpis?: string[];
  budget?: number;
  basePayPool?: number;
  performanceBonusPool?: number;
}

export async function createCampaign(input: NewCampaign): Promise<Campaign> {
  const db = createServiceSupabase();

  const budget = input.budget ?? 0;
  const basePayPool = input.basePayPool ?? Math.round(budget * 0.6);
  const performanceBonusPool =
    input.performanceBonusPool ?? budget - basePayPool;

  // Demo fallback: return a non-persistent campaign object.
  if (!db) {
    return {
      id: tempId("camp"),
      orgId: DEMO_ORG_ID,
      name: input.name,
      goal: input.goal ?? "",
      path: input.path,
      status: "draft",
      narrativeAngle: input.narrativeAngle ?? "",
      targetAudience: input.targetAudience ?? "",
      offer: input.offer ?? "",
      deliverables: input.deliverables ?? [],
      platforms: input.platforms ?? [],
      creatorInstructions: input.creatorInstructions ?? "",
      timelineStart: input.timelineStart ?? "",
      timelineEnd: input.timelineEnd ?? "",
      kpis: input.kpis ?? [],
      budget,
      basePayPool,
      performanceBonusPool,
      createdAt: new Date().toISOString(),
    };
  }

  await ensureDemoOrg(db);

  const { data, error } = await db
    .from("campaigns")
    .insert({
      org_id: DEMO_ORG_ID,
      name: input.name,
      goal: input.goal || null,
      path: input.path,
      status: "draft",
      narrative_angle: input.narrativeAngle || null,
      target_audience: input.targetAudience || null,
      offer: input.offer || null,
      deliverables: input.deliverables ?? [],
      platforms: input.platforms ?? [],
      creator_instructions: input.creatorInstructions || null,
      timeline_start: input.timelineStart || null,
      timeline_end: input.timelineEnd || null,
      kpis: input.kpis ?? [],
      budget,
      base_pay_pool: basePayPool,
      performance_bonus_pool: performanceBonusPool,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToCampaign(data as CampaignRow);
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus,
): Promise<void> {
  const db = createServiceSupabase();
  if (!db) return;
  const { error } = await db
    .from("campaigns")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
