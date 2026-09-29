// Server-side data module: Business / brand profile
// Persists the brand profile (voice, audience, budget, channels, goals) that
// powers AI tone and strategy. Org-scoped only, so no login needed yet.

import { createServiceSupabase } from "@/lib/supabase/server";
import { BUSINESS_PROFILE as MOCK_PROFILE } from "@/lib/mock/data";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import type { BusinessProfile } from "@/types";

interface ProfileRow {
  id: string;
  org_id: string;
  brand_voice: string | null;
  target_audience: string | null;
  primary_goals: string[] | null;
  monthly_budget: number | null;
  channels: string[] | null;
}

function rowToProfile(r: ProfileRow): BusinessProfile {
  return {
    id: r.id,
    orgId: r.org_id,
    brandVoice: r.brand_voice ?? "",
    targetAudience: r.target_audience ?? "",
    primaryGoals: r.primary_goals ?? [],
    monthlyBudget: Number(r.monthly_budget ?? 0),
    channels: r.channels ?? [],
  };
}

export async function getProfile(): Promise<BusinessProfile> {
  const db = createServiceSupabase();
  if (!db) return MOCK_PROFILE;

  const { data, error } = await db
    .from("business_profiles")
    .select("*")
    .eq("org_id", DEMO_ORG_ID)
    .maybeSingle();

  if (error) throw new Error(error.message);
  // No saved profile yet — return sensible mock defaults to pre-fill the form.
  if (!data) return { ...MOCK_PROFILE, orgId: DEMO_ORG_ID };
  return rowToProfile(data as ProfileRow);
}

export interface ProfileUpdate {
  brandVoice?: string;
  targetAudience?: string;
  monthlyBudget?: number;
  primaryGoals?: string[];
  channels?: string[];
}

export async function saveProfile(input: ProfileUpdate): Promise<BusinessProfile> {
  const db = createServiceSupabase();
  if (!db) return { ...MOCK_PROFILE, ...input, orgId: DEMO_ORG_ID };

  await ensureDemoOrg(db);

  const fields = {
    brand_voice: input.brandVoice ?? null,
    target_audience: input.targetAudience ?? null,
    monthly_budget: input.monthlyBudget ?? 0,
    primary_goals: input.primaryGoals ?? [],
    channels: input.channels ?? [],
  };

  // No unique constraint on org_id, so check-then-update/insert.
  const { data: existing } = await db
    .from("business_profiles")
    .select("id")
    .eq("org_id", DEMO_ORG_ID)
    .maybeSingle();

  if (existing) {
    const { data, error } = await db
      .from("business_profiles")
      .update(fields)
      .eq("id", (existing as { id: string }).id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToProfile(data as ProfileRow);
  }

  const { data, error } = await db
    .from("business_profiles")
    .insert({ org_id: DEMO_ORG_ID, ...fields })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToProfile(data as ProfileRow);
}
