export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { acceptApplication, rejectApplication } from "@/lib/db/applications";

// PATCH — brand accepts a creator (with agreed base pay + bonus) or rejects.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: "accept" | "reject";
    agreedBasePay?: number;
    agreedBonus?: number;
  };

  try {
    if (body.action === "reject") {
      await rejectApplication(params.id);
      return NextResponse.json({ ok: true, status: "rejected" });
    }
    if (body.action === "accept") {
      await acceptApplication(params.id, {
        agreedBasePay: Number(body.agreedBasePay ?? 0),
        agreedBonus: Number(body.agreedBonus ?? 0),
      });
      return NextResponse.json({ ok: true, status: "accepted" });
    }
    return NextResponse.json(
      { error: "action must be accept or reject" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
