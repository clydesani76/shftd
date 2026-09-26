// Server-only: resolve the owning org / creator of a resource, so mutation
// routes can verify the authenticated principal is allowed to act on it.
// Returns null when the row (or database) is absent.

import { createServiceSupabase } from "@/lib/supabase/server";
import type { ResourceOwner } from "@/lib/permissions";

export async function campaignOwner(id: string): Promise<ResourceOwner | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("campaigns")
    .select("org_id")
    .eq("id", id)
    .maybeSingle();
  return data ? { orgId: (data as { org_id: string }).org_id } : null;
}

export async function submissionOwner(id: string): Promise<ResourceOwner | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("submissions")
    .select("creator_id, campaigns(org_id)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as { creator_id: string; campaigns: { org_id: string } | null };
  return { orgId: row.campaigns?.org_id ?? null, creatorId: row.creator_id };
}

export async function applicationOwner(id: string): Promise<ResourceOwner | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("campaign_applications")
    .select("creator_id, campaigns(org_id)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as { creator_id: string; campaigns: { org_id: string } | null };
  return { orgId: row.campaigns?.org_id ?? null, creatorId: row.creator_id };
}

export async function ledgerOwner(id: string): Promise<ResourceOwner | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("ledger_entries")
    .select("creator_id, campaigns(org_id)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as { creator_id: string; campaigns: { org_id: string } | null };
  return { orgId: row.campaigns?.org_id ?? null, creatorId: row.creator_id };
}

export async function rightsOwner(id: string): Promise<ResourceOwner | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("rights_agreements")
    .select("creator_id, campaigns(org_id)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as { creator_id: string; campaigns: { org_id: string } | null };
  return { orgId: row.campaigns?.org_id ?? null, creatorId: row.creator_id };
}

// For proposing rights: ownership comes from the submission's campaign org.
export async function submissionCampaignOwner(
  submissionId: string,
): Promise<ResourceOwner | null> {
  return submissionOwner(submissionId);
}
