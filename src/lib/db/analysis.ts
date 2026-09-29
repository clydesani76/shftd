// Server-side data module: Competitor analyses
// Stores the latest deep-analysis report (JSON) per competitor so the UI can
// re-render it without recomputing. Keeps a single latest row per competitor.
// No-ops (returns null / echoes input) when Supabase isn't configured.

import { createServiceSupabase } from "@/lib/supabase/server";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import type { CompetitorAnalysis } from "@/lib/ai/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const realId = (id?: string) => (id && UUID_RE.test(id) ? id : null);

export interface StoredAnalysis {
  competitorId?: string;
  analysis: CompetitorAnalysis;
  createdAt: string;
}

export async function getAnalysis(
  competitorId: string,
): Promise<StoredAnalysis | null> {
  const db = createServiceSupabase();
  if (!db || !realId(competitorId)) return null;

  const { data, error } = await db
    .from("competitor_analyses")
    .select("competitor_id, analysis, created_at")
    .eq("competitor_id", competitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    competitorId: data.competitor_id ?? undefined,
    analysis: data.analysis as CompetitorAnalysis,
    createdAt: data.created_at as string,
  };
}

export async function saveAnalysis(
  competitorId: string,
  analysis: CompetitorAnalysis,
): Promise<StoredAnalysis> {
  const db = createServiceSupabase();
  const createdAt = new Date().toISOString();

  // Demo fallback (or non-UUID/mock competitor): return without persisting.
  if (!db || !realId(competitorId)) {
    return { competitorId: realId(competitorId) ?? undefined, analysis, createdAt };
  }

  await ensureDemoOrg(db);

  // Keep only the latest report per competitor.
  await db.from("competitor_analyses").delete().eq("competitor_id", competitorId);

  const { data, error } = await db
    .from("competitor_analyses")
    .insert({
      org_id: DEMO_ORG_ID,
      competitor_id: competitorId,
      brand_name: analysis.brandName,
      analysis,
    })
    .select("competitor_id, analysis, created_at")
    .single();

  if (error) throw new Error(error.message);
  return {
    competitorId: data.competitor_id ?? undefined,
    analysis: data.analysis as CompetitorAnalysis,
    createdAt: data.created_at as string,
  };
}
