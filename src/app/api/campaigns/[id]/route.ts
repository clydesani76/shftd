// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getCampaign,
  updateCampaignStatus,
} from "@/lib/db/campaigns";
import type { CampaignStatus } from "@/types";

// Single-campaign API — fetch one or update its status.

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const campaign = await getCampaign(params.id);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as { status?: CampaignStatus };
  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }
  try {
    await updateCampaignStatus(params.id, body.status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 },
    );
  }
}
