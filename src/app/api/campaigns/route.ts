// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  createCampaign,
  listCampaigns,
  type NewCampaign,
} from "@/lib/db/campaigns";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import { config } from "@/lib/config";

// Campaigns collection API — scoped to the authenticated workspace.
// A real workspace only ever sees and creates its OWN org's campaigns.

export async function GET() {
  try {
    const principal = await getPrincipal();
    // Without Supabase (pure local demo) fall back to the mock set. With
    // Supabase, an unauthenticated real workspace sees nothing until sign-in.
    if (config.hasSupabase && !principal) {
      return NextResponse.json({ campaigns: [], needsAuth: true });
    }
    const campaigns = await listCampaigns(principal?.orgId ?? undefined);
    return NextResponse.json({ campaigns });
  } catch (e) {
    return NextResponse.json(
      { campaigns: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewCampaign>;
  if (!body.name || !body.path) {
    return NextResponse.json(
      { error: "name and path are required" },
      { status: 400 },
    );
  }
  try {
    const principal = await getPrincipal();
    // Creating a campaign requires an authenticated business/admin when
    // Supabase is configured; the campaign is created under THEIR org.
    if (config.hasSupabase) {
      const az = authorize(principal, "campaign:create");
      if (!az.ok) {
        return NextResponse.json({ error: az.reason }, { status: az.status });
      }
    }
    const campaign = await createCampaign(
      body as NewCampaign,
      principal?.orgId ?? undefined,
    );
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create campaign" },
      { status: 500 },
    );
  }
}
