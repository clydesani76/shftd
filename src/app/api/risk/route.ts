export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { listRiskSignals } from "@/lib/db/risk";

// GET — risk signals for review. Admin sees all (or ?orgId=); a brand sees only
// its own org's signals. Signals are observations, never automatic penalties.
export async function GET(req: Request) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ signals: [] }, { status: 200 });
  const { searchParams } = new URL(req.url);
  try {
    if (principal.role === "admin") {
      const orgId = searchParams.get("orgId") ?? undefined;
      return NextResponse.json({ signals: await listRiskSignals(orgId) });
    }
    if (principal.role === "business" && principal.orgId) {
      return NextResponse.json({ signals: await listRiskSignals(principal.orgId) });
    }
    return NextResponse.json({ signals: [] });
  } catch (e) {
    return NextResponse.json(
      { signals: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
