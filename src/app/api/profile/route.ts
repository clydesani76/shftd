// Always run on each request so reads/writes reflect the live database.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getProfile, saveProfile, type ProfileUpdate } from "@/lib/db/profile";

// Brand profile API — load the org's profile and save edits.

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const body = (await req.json()) as ProfileUpdate;
  try {
    const profile = await saveProfile(body);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 },
    );
  }
}
