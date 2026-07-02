// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listAssets, saveAsset, type NewAsset } from "@/lib/db/assets";

// Campaign image assets API — list saved images (optionally by campaign) and
// save a generated image to Supabase Storage + the database.
// Note: /api/ai/image GENERATES images; this endpoint PERSISTS a chosen one.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  try {
    const assets = await listAssets(campaignId);
    return NextResponse.json({ assets });
  } catch (e) {
    return NextResponse.json(
      { assets: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<NewAsset>;
  if (!body.dataUrl) {
    return NextResponse.json({ error: "dataUrl is required" }, { status: 400 });
  }
  try {
    const saved = await saveAsset({
      campaignId: body.campaignId,
      dataUrl: body.dataUrl,
      prompt: body.prompt ?? "",
      size: body.size ?? "1024x1024",
      provider: body.provider ?? "placeholder",
    });
    return NextResponse.json({ saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save image" },
      { status: 500 },
    );
  }
}
