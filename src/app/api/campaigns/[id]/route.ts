// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  approveBrief,
  getCampaign,
  updateCampaignStatus,
} from "@/lib/db/campaigns";
import { canTransitionCampaign } from "@/lib/campaign-flow";
import { getPrincipal } from "@/lib/db/principal";
import { authorize, ownsOrg } from "@/lib/permissions";
import { config } from "@/lib/config";
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
    // A real workspace may only view its OWN campaigns — hide others as 404.
    if (config.hasSupabase) {
      const principal = await getPrincipal();
      if (!ownsOrg(principal, campaign.orgId)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
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

    // Authorize: only a business/admin of THIS campaign's org may act on it.
    const principal = await getPrincipal();
    const action =
      body.action === "approve_brief"
        ? "campaign:approve_brief"
        : "campaign:transition";
    const az = authorize(principal, action, { orgId: campaign.orgId });
    if (!az.ok) {
      return NextResponse.json({ error: az.reason }, { status: az.status });
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
    // publishing a brief that hasn't been approved.
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
