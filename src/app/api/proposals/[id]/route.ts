export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import {
  decideProposal,
  editProposal,
  getProposal,
  submitProposal,
} from "@/lib/db/proposals";
import { getEngagement } from "@/lib/db/engagements";

// PATCH — edit / submit (operator, author-only) or decide (brand/admin, no self-approval).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const proposal = await getProposal(params.id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: "edit" | "submit" | "decide";
    decision?: "approved" | "rejected";
    title?: string;
    content?: Record<string, unknown>;
    financialImpact?: number;
    rightsImpact?: string;
    note?: string;
  };

  try {
    if (body.action === "edit" || body.action === "submit") {
      // Only the operator who owns the engagement may edit/submit, and only if
      // the engagement is still theirs. Author-only is re-checked in the DB layer.
      if (principal.role !== "operator") {
        return NextResponse.json(
          { error: "Only the proposing operator may edit or submit" },
          { status: 403 },
        );
      }
      const eng = await getEngagement(proposal.engagementId);
      if (!eng || eng.operatorUserId !== principal.userId) {
        return NextResponse.json({ error: "Not your engagement" }, { status: 403 });
      }
      if (body.action === "edit") {
        const updated = await editProposal(
          params.id,
          {
            title: body.title,
            content: body.content,
            financialImpact: body.financialImpact,
            rightsImpact: body.rightsImpact,
          },
          principal.userId,
        );
        return NextResponse.json({ proposal: updated });
      }
      await submitProposal(params.id, principal.userId);
      return NextResponse.json({ ok: true, status: "submitted" });
    }

    if (body.action === "decide") {
      // Brand/admin of the owning org approves or rejects. Self-approval is
      // blocked inside decideProposal (canApproveProposal).
      const az = authorize(principal, "proposal:approve", { orgId: proposal.orgId });
      if (!az.ok) return NextResponse.json({ error: az.reason }, { status: az.status });
      if (body.decision !== "approved" && body.decision !== "rejected") {
        return NextResponse.json({ error: "decision must be approved or rejected" }, { status: 400 });
      }
      const updated = await decideProposal(params.id, {
        decision: body.decision,
        approverUserId: principal.userId,
        approverRole: principal.role,
        note: body.note,
      });
      return NextResponse.json({ proposal: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = /cannot|only|not found|self|invalid/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
