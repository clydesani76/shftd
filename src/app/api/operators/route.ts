export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { authorize } from "@/lib/permissions";
import {
  applyAsOperator,
  getOperatorProfile,
  listOperators,
  type OperatorApplication,
} from "@/lib/db/operators";
import type { QualificationStatus } from "@/lib/operator-flow";

// GET — admins list operators (optionally by status); anyone else gets their
// own profile.
export async function GET(req: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ operators: [], profile: null }, { status: 200 });
  }
  try {
    if (principal.role === "admin") {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status") as QualificationStatus | null;
      const operators = await listOperators(status ?? undefined);
      return NextResponse.json({ operators });
    }
    const profile = await getOperatorProfile(principal.userId);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

// POST — apply (or update your own application). Never grants a status.
export async function POST(req: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "Sign in to apply" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<OperatorApplication>;
  if (!body.displayName?.trim()) {
    return NextResponse.json({ error: "displayName is required" }, { status: 400 });
  }
  try {
    const profile = await applyAsOperator(principal.userId, {
      displayName: body.displayName.trim(),
      businessInfo: body.businessInfo,
      specialties: body.specialties,
      portfolioUrl: body.portfolioUrl,
      serviceFeeNote: body.serviceFeeNote,
      conflictsNote: body.conflictsNote,
    });
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to apply" },
      { status: 500 },
    );
  }
}
