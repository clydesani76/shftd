export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { reviewSubmission, type ReviewDecision } from "@/lib/db/submissions";

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
    const result = await reviewSubmission(params.id, {
      decision: body.decision,
      reviewerNote: body.reviewerNote,
      // NOTE: business auth is not yet wired; the reviewer identity is the
      // current session's brand user. Recorded for the audit trail.
      reviewedBy: body.reviewedBy || "brand",
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
