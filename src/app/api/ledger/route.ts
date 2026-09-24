export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listLedger } from "@/lib/db/ledger";

// GET — the payout ledger for this workspace (base pay, bonuses, licensing
// fees) with their pending/approved/paid/failed/disputed status.
export async function GET() {
  try {
    const ledger = await listLedger();
    return NextResponse.json({ ledger });
  } catch (e) {
    return NextResponse.json(
      { ledger: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
