export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import { inviteEngagement, listEngagements, type InviteInput } from "@/lib/db/engagements";
import { scanEngagementRisk } from "@/lib/db/risk";

// GET — a brand sees its org's engagements; an operator sees their own.
export async function GET() {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ engagements: [] });
  try {
    if (principal.role === "operator") {
      const engagements = await listEngagements({ operatorUserId: principal.userId });
      return NextResponse.json({ engagements });
    }
    if (principal.orgId) {
      const engagements = await listEngagements({ orgId: principal.orgId });
      return NextResponse.json({ engagements });
    }
    return NextResponse.json({ engagements: [] });
  } catch (e) {
    return NextResponse.json(
      { engagements: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

// POST — brand invites an approved operator with an explicit scope.
export async function POST(req: Request) {
  const principal = await getPrincipal();
  const az = authorize(principal, "engagement:invite", { orgId: principal?.orgId });
  if (!az.ok) return NextResponse.json({ error: az.reason }, { status: az.status });

  const body = (await req.json().catch(() => ({}))) as Partial<InviteInput>;
  if (!body.operatorUserId || !Array.isArray(body.permissions)) {
    return NextResponse.json(
      { error: "operatorUserId and permissions are required" },
      { status: 400 },
    );
  }
  try {
    const engagement = await inviteEngagement(principal!.orgId!, principal!.userId, {
      operatorUserId: body.operatorUserId,
      scopeNote: body.scopeNote,
      campaignIds: body.campaignIds ?? [],
      permissions: body.permissions,
      serviceFee: Number(body.serviceFee ?? 0),
      feeModel: body.feeModel,
      startAt: body.startAt,
      expiresAt: body.expiresAt,
    });
    // Risk scan (self-referral / related party). Non-blocking.
    await scanEngagementRisk({
      orgId: principal!.orgId!,
      operatorUserId: body.operatorUserId,
      brandUserIds: [principal!.userId],
    });
    return NextResponse.json({ engagement });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to invite" },
      { status: 500 },
    );
  }
}
