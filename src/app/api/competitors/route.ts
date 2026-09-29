// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  addCompetitor,
  deleteCompetitor,
  listCompetitors,
  type NewCompetitor,
} from "@/lib/db/competitors";

// Competitors API — reads/writes real rows in Supabase (via the server-side
// service-role client), with a mock fallback when Supabase isn't configured.

export async function GET() {
  try {
    const competitors = await listCompetitors();
    return NextResponse.json({ competitors });
  } catch (e) {
    return NextResponse.json(
      { competitors: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewCompetitor>;
  if (!body.brandName) {
    return NextResponse.json({ error: "brandName is required" }, { status: 400 });
  }
  try {
    const competitor = await addCompetitor({
      brandName: body.brandName,
      domain: body.domain,
      socialHandle: body.socialHandle,
      category: body.category ?? "",
    });
    return NextResponse.json({ competitor });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add competitor" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    await deleteCompetitor(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete" },
      { status: 500 },
    );
  }
}
