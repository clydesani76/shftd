export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { recordVerifiedPayment, resolveDispute } from "@/lib/db/ledger";

// PATCH — admin actions on a payout obligation:
//   { action: "mark_paid", reference, paidBy }  → record a VERIFIED manual
//       payment (approved → paid). A reference is required; nothing simulates
//       a real transfer.
//   { action: "resolve_dispute", resolution: "approved" | "failed" }
//
// NOTE: business/admin auth is not yet wired, so the acting admin identity is
// taken from the request. Real admin authorization is the remaining gap; the
// guardrails (approved-only, reference-required, no client "paid") hold today.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: "mark_paid" | "resolve_dispute";
    reference?: string;
    paidBy?: string;
    resolution?: "approved" | "failed";
  };

  try {
    if (body.action === "mark_paid") {
      if (!body.reference?.trim()) {
        return NextResponse.json(
          { error: "A payment reference is required to record a verified payment" },
          { status: 400 },
        );
      }
      await recordVerifiedPayment(params.id, {
        reference: body.reference.trim(),
        paidBy: body.paidBy || "admin",
        method: "manual",
      });
      return NextResponse.json({ ok: true, status: "paid" });
    }

    if (body.action === "resolve_dispute") {
      const to = body.resolution === "failed" ? "failed" : "approved";
      await resolveDispute(params.id, to);
      return NextResponse.json({ ok: true, status: to });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = /cannot|not found|reference|dispute/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
