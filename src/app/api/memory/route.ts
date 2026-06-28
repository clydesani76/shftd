import { NextResponse } from "next/server";
import { addMemory, listMemory, type NewMemory } from "@/lib/db/memory";

// Marketing Memory API — list brand learnings and add a new one.

export async function GET() {
  try {
    const notes = await listMemory();
    return NextResponse.json({ notes });
  } catch (e) {
    return NextResponse.json(
      { notes: [], error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<NewMemory>;
  if (!body.insight) {
    return NextResponse.json({ error: "insight is required" }, { status: 400 });
  }
  try {
    const note = await addMemory({
      kind: body.kind ?? "general",
      insight: body.insight,
      outcome: body.outcome ?? "neutral",
      metricRef: body.metricRef,
    });
    return NextResponse.json({ note });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add" },
      { status: 500 },
    );
  }
}
