// Server-side data module: Demo seeding
// Populates the live database with a curated set of competitors and campaigns
// so a fresh/empty environment looks alive during a demo. Uses the service
// role (bypasses RLS). No-op with a friendly summary when Supabase isn't
// configured (the app already shows mock data in that case).

import { createServiceSupabase } from "@/lib/supabase/server";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";

const SEED_COMPETITORS = [
  {
    brand_name: "Pulse Electrolytes",
    domain: "pulsehydration.com",
    social_handle: "@drinkpulse",
    category: "Hydration / Electrolytes",
  },
  {
    brand_name: "Voltaid",
    domain: "voltaid.co",
    social_handle: "@voltaid",
    category: "Energy / Performance",
  },
  {
    brand_name: "ClearCo Water",
    domain: "clearco.com",
    social_handle: "@clearco",
    category: "Functional Water",
  },
];

const SEED_CAMPAIGNS = [
  {
    name: "30-Day Coffee Swap Challenge",
    goal: "Drive 2M top-of-funnel views and 1,500 first orders",
    path: "proven" as const,
    status: "live" as const,
    narrative_angle:
      "Personal transformation: 'what happened when I swapped coffee for Nova for 30 days'",
    target_audience:
      "25–40 professionals reliant on coffee who feel afternoon crashes",
    offer: "First-order ritual kit (free bottle) + subscribe & save 25%",
    deliverables: ["1x 30–45s TikTok", "3x IG Stories", "1x IG Reel recap"],
    platforms: ["TikTok", "Instagram"],
    creator_instructions:
      "Lead with a first-person POV hook in the first 2 seconds. Show the swap moment. Be honest about days 1–3 being hard. End with a soft CTA to the ritual kit.",
    kpis: ["Views", "Hook retention %", "CTR to landing", "First orders"],
    budget: 24000,
    base_pay_pool: 14000,
    performance_bonus_pool: 10000,
  },
  {
    name: "Beat the 3PM Wall",
    goal: "Establish brand ownership of the afternoon-slump moment",
    path: "original" as const,
    status: "published" as const,
    narrative_angle:
      "Cultural ownership of the 3PM energy dip — a rallying cry, not a product pitch",
    target_audience: "Desk-bound professionals who hit an afternoon energy crash",
    offer: "Afternoon reset pack + a shareable '3PM manifesto'",
    deliverables: ["1x hero TikTok", "2x IG Reels", "1x email"],
    platforms: ["TikTok", "Instagram", "Email"],
    creator_instructions:
      "Own the 3PM moment culturally. Make it a movement people want to join, not an ad.",
    kpis: ["Reach", "Saves", "Branded mentions", "Conversions"],
    budget: 18000,
    base_pay_pool: 10000,
    performance_bonus_pool: 8000,
  },
];

export interface SeedResult {
  seeded: boolean;
  reset: boolean;
  competitors: number;
  campaigns: number;
  note?: string;
}

export async function seedDemoData(reset = false): Promise<SeedResult> {
  const db = createServiceSupabase();
  if (!db) {
    return {
      seeded: false,
      reset: false,
      competitors: 0,
      campaigns: 0,
      note: "Supabase not configured — the app already shows demo data.",
    };
  }

  await ensureDemoOrg(db);

  if (reset) {
    // Clear demo-org rows so re-seeding is predictable (no duplicates).
    await db.from("campaign_assets").delete().eq("org_id", DEMO_ORG_ID);
    await db.from("copy_variants").delete().eq("org_id", DEMO_ORG_ID);
    await db.from("campaigns").delete().eq("org_id", DEMO_ORG_ID);
    await db.from("ci_competitors").delete().eq("org_id", DEMO_ORG_ID);
  } else {
    // Idempotent guard: if there's already data, don't duplicate it.
    const [{ count: compCount }, { count: campCount }] = await Promise.all([
      db
        .from("ci_competitors")
        .select("id", { count: "exact", head: true })
        .eq("org_id", DEMO_ORG_ID),
      db
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("org_id", DEMO_ORG_ID),
    ]);
    if ((compCount ?? 0) > 0 || (campCount ?? 0) > 0) {
      return {
        seeded: false,
        reset: false,
        competitors: compCount ?? 0,
        campaigns: campCount ?? 0,
        note: "Data already present — use Reset to replace it.",
      };
    }
  }

  const { data: comps, error: compErr } = await db
    .from("ci_competitors")
    .insert(SEED_COMPETITORS.map((c) => ({ ...c, org_id: DEMO_ORG_ID })))
    .select("id");
  if (compErr) throw new Error(compErr.message);

  const { data: camps, error: campErr } = await db
    .from("campaigns")
    .insert(SEED_CAMPAIGNS.map((c) => ({ ...c, org_id: DEMO_ORG_ID })))
    .select("id");
  if (campErr) throw new Error(campErr.message);

  return {
    seeded: true,
    reset,
    competitors: comps?.length ?? 0,
    campaigns: camps?.length ?? 0,
  };
}
