export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listRights, proposeRights, type ProposeRightsInput } from "@/lib/db/rights";

// GET ?submissionId= — the license history for a deliverable.
// POST — brand proposes rights (the creator must consent separately).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submissionId");
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId required" }, { status: 400 });
  }
  try {
    const rights = await listRights(submissionId);
    return NextResponse.json({ rights });
  } catch (e) {
    return NextResponse.json(
      { rights: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<ProposeRightsInput>;
  if (!body.submissionId || !body.usage) {
    return NextResponse.json(
      { error: "submissionId and usage are required" },
      { status: 400 },
    );
  }
  try {
    const rights = await proposeRights({
      submissionId: body.submissionId,
      channels: body.channels ?? [],
      usage: body.usage,
      durationDays: Number(body.durationDays ?? 0),
      territory: body.territory ?? "",
      editingAllowed: !!body.editingAllowed,
      fee: Number(body.fee ?? 0),
      expiresAt: body.expiresAt,
      proposedBy: body.proposedBy || "brand",
    });
    return NextResponse.json({ rights });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to propose" },
      { status: 500 },
    );
  }
}
