import { NextResponse } from "next/server";
import { listSavedCopy, saveCopy, type NewCopy } from "@/lib/db/copy";

// Saved copy API — list saved variants (optionally by campaign) and save one.
// Note: /api/ai/copy GENERATES copy; this endpoint PERSISTS a chosen variant.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  try {
    const copy = await listSavedCopy(campaignId);
    return NextResponse.json({ copy });
  } catch (e) {
    return NextResponse.json(
      { copy: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewCopy>;
  if (!body.type || !body.content) {
    return NextResponse.json(
      { error: "type and content are required" },
      { status: 400 },
    );
  }
  try {
    const saved = await saveCopy({
      campaignId: body.campaignId,
      type: body.type,
      platform: body.platform ?? "",
      tone: body.tone ?? "",
      content: body.content,
      score: body.score ?? 0,
    });
    return NextResponse.json({ saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save copy" },
      { status: 500 },
    );
  }
}
