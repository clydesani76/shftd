export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  createSubmission,
  listSubmissions,
  type NewSubmission,
} from "@/lib/db/submissions";

// GET ?campaignId= — list deliverables. POST — creator submits a deliverable.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  try {
    const submissions = await listSubmissions(campaignId);
    return NextResponse.json({ submissions });
  } catch (e) {
    return NextResponse.json(
      { submissions: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<NewSubmission>;
  if (!body.campaignId || (!body.contentUrl && !body.fileName)) {
    return NextResponse.json(
      { error: "campaignId and a content URL or file are required" },
      { status: 400 },
    );
  }
  try {
    const submission = await createSubmission({
      campaignId: body.campaignId,
      contentUrl: body.contentUrl,
      fileName: body.fileName,
      note: body.note,
      publicationDate: body.publicationDate,
      evidenceUrl: body.evidenceUrl,
    });
    return NextResponse.json({ submission });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to submit";
    if (msg === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
