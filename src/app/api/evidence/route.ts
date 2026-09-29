// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { addEvidence, listEvidence, type NewEvidence } from "@/lib/db/intel";

export async function GET() {
  try {
    const evidence = await listEvidence();
    return NextResponse.json({ evidence });
  } catch (e) {
    return NextResponse.json(
      { evidence: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewEvidence>;
  if (!body.competitorId || !body.content) {
    return NextResponse.json(
      { error: "competitorId and content are required" },
      { status: 400 },
    );
  }
  try {
    const evidence = await addEvidence({
      competitorId: body.competitorId,
      type: body.type ?? "caption",
      channel: body.channel ?? "",
      content: body.content,
      sourceUrl: body.sourceUrl,
    });
    return NextResponse.json({ evidence });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add evidence" },
      { status: 500 },
    );
  }
}
