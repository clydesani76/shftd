export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { reviewSubmission, type ReviewDecision } from "@/lib/db/submissions";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import { submissionOwner } from "@/lib/db/ownership";

// PATCH — brand reviews a deliverable: approve | reject | revise.
// Approval idempotently creates the payout obligation. The transition is
// validated server-side; an illegal one returns 409.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = (await req.json().catch(() => ({}))) as {
    decision?: ReviewDecision;
    reviewerNote?: string;
    reviewedBy?: string;
  };
  if (!body.decision || !["approve", "reject", "revise"].includes(body.decision)) {
    return NextResponse.json(
      { error: "decision must be approve, reject or revise" },
      { status: 400 },
    );
  }
  try {
    // Authorize: only a business/admin of the submission's campaign org.
    const principal = await getPrincipal();
    const owner = await submissionOwner(params.id);
    const az = authorize(principal, "submission:review", {
      orgId: owner?.orgId,
    });
    if (!az.ok) {
      return NextResponse.json({ error: az.reason }, { status: az.status });
    }

    const result = await reviewSubmission(params.id, {
      decision: body.decision,
      reviewerNote: body.reviewerNote,
      reviewedBy: body.reviewedBy || principal!.userId,
    });
    return NextResponse.json({
      submission: result.submission,
      obligationsCreated: result.obligationsCreated,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to review";
    // Illegal transition / concurrent double-review.
    const status = /illegal|not found|cannot/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
