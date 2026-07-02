// Always run on each request (writes to the live database).
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/db/seed";

// Demo seeding API — populate the database with sample competitors and
// campaigns so an empty environment looks alive. POST { reset?: boolean }.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { reset?: boolean };
  try {
    const result = await seedDemoData(body.reset === true);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to seed demo data" },
      { status: 500 },
    );
  }
}
