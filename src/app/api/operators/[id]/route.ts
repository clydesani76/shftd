export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import { reviewOperator } from "@/lib/db/operators";
import type { QualificationStatus } from "@/lib/operator-flow";

// PATCH — admin qualification decision (under_review | approved | suspended).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const principal = await getPrincipal();
  const az = authorize(principal, "operator:review");
  if (!az.ok) return NextResponse.json({ error: az.reason }, { status: az.status });

  const body = (await req.json().catch(() => ({}))) as {
    to?: QualificationStatus;
    note?: string;
    verified?: { verifiedOutcomes?: number; repeatBrands?: number; paymentReliability?: number };
  };
  if (!body.to) {
    return NextResponse.json({ error: "to (status) is required" }, { status: 400 });
  }
  try {
    await reviewOperator(params.id, {
      to: body.to,
      reviewedBy: principal!.userId,
      note: body.note,
      verified: body.verified,
    });
    return NextResponse.json({ ok: true, status: body.to });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = /illegal|not found/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
