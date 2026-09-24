// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  approveBrief,
  getCampaign,
  updateCampaignStatus,
} from "@/lib/db/campaigns";
import { canTransitionCampaign } from "@/lib/campaign-flow";
import type { CampaignStatus } from "@/types";

// Single-campaign API — fetch one, approve its brief, or transition its status.

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
  const body = (await req.json().catch(() => ({}))) as {
    status?: CampaignStatus;
    action?: "approve_brief";
  };

  try {
    const campaign = await getCampaign(params.id);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Approve the brief (gate for publishing).
    if (body.action === "approve_brief") {
      await approveBrief(params.id);
      return NextResponse.json({ ok: true, briefApproved: true });
    }

    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    // Server-enforced state machine: reject illegal transitions and block
    // publishing a brief that hasn't been approved. The client-visible role
    // selector cannot bypass this.
    const check = canTransitionCampaign(campaign.status, body.status, {
      briefApproved: !!campaign.briefApprovedAt,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    await updateCampaignStatus(params.id, body.status);
    return NextResponse.json({ ok: true, status: body.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 },
    );
  }
}
