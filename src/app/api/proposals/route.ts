export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { createProposal, listProposals } from "@/lib/db/proposals";
import { getEngagement } from "@/lib/db/engagements";
import { engagementActive, operatorCan, type OperatorPermission, type OperatorScope, type ProposalType } from "@/lib/operator-flow";

// Which scoped permission each proposal type requires the operator to hold.
const REQUIRED: Partial<Record<ProposalType, OperatorPermission>> = {
  brief_draft: "draft_brief",
  content_directions: "content_directions",
  creator_shortlist: "propose_creators",
  budget_change: "prepare_budget",
  creator_comp_change: "prepare_budget",
  operator_comp_change: "prepare_budget",
  publish_campaign: "draft_brief",
  payout_release: "prepare_budget",
  rights_grant: "content_directions",
};

export async function GET(req: Request) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ proposals: [] });
  const { searchParams } = new URL(req.url);
  const engagementId = searchParams.get("engagementId") ?? undefined;
  try {
    if (principal.role === "operator") {
      // Operators only see proposals under engagements that are theirs.
      if (engagementId) {
        const eng = await getEngagement(engagementId);
        if (!eng || eng.operatorUserId !== principal.userId) {
          return NextResponse.json({ proposals: [] });
        }
        return NextResponse.json({ proposals: await listProposals({ engagementId }) });
      }
      return NextResponse.json({ proposals: [] });
    }
    if (principal.orgId) {
      return NextResponse.json({
        proposals: await listProposals({ orgId: principal.orgId, engagementId }),
      });
    }
    return NextResponse.json({ proposals: [] });
  } catch (e) {
    return NextResponse.json(
      { proposals: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

// POST — an operator creates a proposal within an active, in-scope engagement.
export async function POST(req: Request) {
  const principal = await getPrincipal();
  if (!principal || principal.role !== "operator") {
    return NextResponse.json({ error: "Only an operator may create proposals" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    engagementId?: string;
    campaignId?: string;
    type?: ProposalType;
    title?: string;
    content?: Record<string, unknown>;
    financialImpact?: number;
    rightsImpact?: string;
  };
  if (!body.engagementId || !body.type || !body.title) {
    return NextResponse.json({ error: "engagementId, type and title are required" }, { status: 400 });
  }

  const eng = await getEngagement(body.engagementId);
  if (!eng || eng.operatorUserId !== principal.userId) {
    return NextResponse.json({ error: "Engagement not found" }, { status: 404 });
  }
  const scope: OperatorScope = {
    engagement: {
      status: eng.status,
      startAt: eng.startAt,
      expiresAt: eng.expiresAt,
      acceptedAt: eng.acceptedAt,
    },
    campaignIds: eng.campaignIds,
    permissions: eng.permissions,
  };
  if (!engagementActive(scope.engagement)) {
    return NextResponse.json({ error: "Engagement is not active" }, { status: 403 });
  }
  // Scope check against the target campaign (if the proposal targets one).
  const campaignId = body.campaignId ?? eng.campaignIds[0];
  const required = REQUIRED[body.type] ?? "view_campaign";
  const check = operatorCan(scope, required, campaignId ?? "");
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  try {
    const proposal = await createProposal(
      {
        engagementId: body.engagementId,
        orgId: eng.orgId,
        campaignId: body.campaignId,
        type: body.type,
        title: body.title,
        content: body.content ?? {},
        financialImpact: body.financialImpact,
        rightsImpact: body.rightsImpact,
      },
      principal.userId,
    );
    return NextResponse.json({ proposal });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create proposal" },
      { status: 500 },
    );
  }
}
