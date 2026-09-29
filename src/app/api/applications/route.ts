// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  createApplication,
  listApplications,
  type NewApplication,
} from "@/lib/db/applications";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  try {
    const applications = await listApplications(campaignId);
    return NextResponse.json({ applications });
  } catch (e) {
    return NextResponse.json(
      { applications: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewApplication>;
  if (!body.campaignId || !body.role) {
    return NextResponse.json(
      { error: "campaignId and role are required" },
      { status: 400 },
    );
  }
  try {
    const application = await createApplication({
      campaignId: body.campaignId,
      role: body.role,
      pitch: body.pitch ?? "",
    });
    return NextResponse.json({ application });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to apply";
    // Signal the UI to send the creator to sign in.
    if (msg === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
