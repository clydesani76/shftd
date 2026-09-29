export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { listAudit } from "@/lib/db/audit";

// GET — the org's append-only audit trail. Scoped to the principal's org; an
// admin may pass ?orgId= to inspect a specific org. Operators/creators get none.
export async function GET(req: Request) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ events: [] }, { status: 200 });
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 100);

  try {
    let orgId: string | null = principal.orgId;
    if (principal.role === "admin") {
      orgId = searchParams.get("orgId") ?? principal.orgId;
    } else if (principal.role !== "business") {
      // Only brand/admin may read the audit trail.
      return NextResponse.json({ events: [] }, { status: 200 });
    }
    if (!orgId) return NextResponse.json({ events: [] });
    const events = await listAudit(orgId, { subjectId, limit });
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json(
      { events: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
