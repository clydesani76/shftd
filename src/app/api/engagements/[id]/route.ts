export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import {
  acceptEngagement,
  getEngagement,
  revokeEngagement,
} from "@/lib/db/engagements";

// PATCH — operator accepts, or brand revokes an engagement.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: "accept" | "revoke";
  };

  const eng = await getEngagement(params.id);
  if (!eng) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    if (body.action === "accept") {
      // Only the invited operator (an operator role) may accept.
      const az = authorize(principal, "engagement:accept");
      if (!az.ok) return NextResponse.json({ error: az.reason }, { status: az.status });
      if (eng.operatorUserId !== principal.userId) {
        return NextResponse.json({ error: "Not your invitation" }, { status: 403 });
      }
      const engagement = await acceptEngagement(params.id, principal.userId);
      return NextResponse.json({ engagement });
    }

    if (body.action === "revoke") {
      // Only a business/admin of the engaging org may revoke.
      const az = authorize(principal, "engagement:revoke", { orgId: eng.orgId });
      if (!az.ok) return NextResponse.json({ error: az.reason }, { status: az.status });
      await revokeEngagement(params.id, principal.userId);
      return NextResponse.json({ ok: true, status: "revoked" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = /cannot|not found|only|invit/i.test(msg) ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
