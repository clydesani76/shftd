import { NextResponse } from "next/server";
import {
  createCampaign,
  listCampaigns,
  type NewCampaign,
} from "@/lib/db/campaigns";

// Campaigns collection API — real Supabase persistence with mock fallback.

export async function GET() {
  try {
    const campaigns = await listCampaigns();
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
    const campaign = await createCampaign(body as NewCampaign);
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create campaign" },
      { status: 500 },
    );
  }
}
