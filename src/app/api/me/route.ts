export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/db/principal";
import { config } from "@/lib/config";

// Lightweight identity probe for the client. Never returns secrets — just
// whether the visitor is authenticated and their authoritative role.
export async function GET() {
  try {
    const principal = await getPrincipal();
    return NextResponse.json({
      authenticated: !!principal,
      role: principal?.role ?? null,
      hasSupabase: config.hasSupabase,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      role: null,
      hasSupabase: config.hasSupabase,
    });
  }
}
