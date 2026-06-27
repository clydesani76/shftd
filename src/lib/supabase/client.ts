"use client";

import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

// Browser-side Supabase client. Returns null in demo mode so callers can
// fall back to the mock data layer.
export function createClient() {
  if (!config.hasSupabase) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
