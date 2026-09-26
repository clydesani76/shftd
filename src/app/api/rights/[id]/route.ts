export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { decideRights, type ConsentDecision } from "@/lib/db/rights";

// PATCH — creator consents (accept/decline) or revokes rights. Acceptance is
// explicit consent; on accept a licensing_fee obligation is created idempotently.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = (await req.json().catch(() => ({}))) as {
    decision?: ConsentDecision;
    consentedBy?: string;
  };
  if (!body.decision || !["accept", "decline", "revoke"].includes(body.decision)) {
    return NextResponse.json(
      { error: "decision must be accept, decline or revoke" },
      { status: 400 },
    );
  }
  try {
    const result = await decideRights(params.id, {
      decision: body.decision,
      consentedBy: body.consentedBy || "creator",
    });
    return NextResponse.json({
      rights: result.rights,
      obligationsCreated: result.obligationsCreated,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = /illegal|not found|cannot/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
