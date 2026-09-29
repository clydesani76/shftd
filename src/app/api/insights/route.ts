// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listInsights, reanalyzeInsights } from "@/lib/db/intel";

// GET: list stored insights. POST: re-analyze (generate from real evidence
// via the AI layer) and persist the refreshed set.

export async function GET() {
  try {
    const insights = await listInsights();
    return NextResponse.json({ insights });
  } catch (e) {
    return NextResponse.json(
      { insights: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const insights = await reanalyzeInsights();
    return NextResponse.json({ insights });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to analyze" },
      { status: 500 },
    );
  }
}
