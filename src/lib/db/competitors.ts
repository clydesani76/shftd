// ─────────────────────────────────────────────────────────────
// Server-side data module: Competitors
// This is the first module wired to REAL persistence. It runs only on the
// server (called from API routes) and uses the Supabase service-role client,
// which safely bypasses Row Level Security on the server — so the app works
// without requiring the visitor to be logged in (MVP-friendly).
//
// When Supabase isn't configured (e.g. local demo with no keys), it falls
// back to the in-memory mock data so nothing breaks.
// ─────────────────────────────────────────────────────────────

import { createServiceSupabase } from "@/lib/supabase/server";
import { COMPETITORS as MOCK_COMPETITORS, ORG as MOCK_ORG } from "@/lib/mock/data";
import { tempId } from "@/lib/utils";
import type { Competitor } from "@/types";

// A single, stable demo org so inserted competitors always have a valid
// parent row (the competitors table requires an org). Real multi-tenant org
// resolution from the logged-in user is a later step.
export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

interface CompetitorRow {
  id: string;
  org_id: string;
  brand_name: string;
  domain: string | null;
  social_handle: string | null;
  category: string | null;
  added_at: string;
}

function rowToCompetitor(r: CompetitorRow): Competitor {
  return {
    id: r.id,
    orgId: r.org_id,
    brandName: r.brand_name,
    domain: r.domain ?? undefined,
    socialHandle: r.social_handle ?? undefined,
    category: r.category ?? "",
    addedAt: r.added_at,
  };
}

// Make sure the demo org row exists before inserting competitors that
// reference it (foreign key). Safe to call repeatedly.
async function ensureDemoOrg(db: ReturnType<typeof createServiceSupabase>) {
  if (!db) return;
  await db.from("orgs").upsert(
    {
      id: DEMO_ORG_ID,
      name: MOCK_ORG.name,
      slug: MOCK_ORG.slug,
      industry: MOCK_ORG.industry,
      website: MOCK_ORG.website,
    },
    { onConflict: "id" },
  );
}

export async function listCompetitors(): Promise<Competitor[]> {
  const db = createServiceSupabase();
  if (!db) return MOCK_COMPETITORS; // demo fallback

  const { data, error } = await db
    .from("ci_competitors")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as CompetitorRow[]).map(rowToCompetitor);
}

export type NewCompetitor = Pick<
  Competitor,
  "brandName" | "domain" | "socialHandle" | "category"
>;

export async function addCompetitor(input: NewCompetitor): Promise<Competitor> {
  const db = createServiceSupabase();

  // Demo fallback: return a non-persistent object so local dev still works.
  if (!db) {
    return {
      id: tempId("comp"),
      orgId: DEMO_ORG_ID,
      brandName: input.brandName,
      domain: input.domain,
      socialHandle: input.socialHandle,
      category: input.category,
      addedAt: new Date().toISOString(),
    };
  }

  await ensureDemoOrg(db);

  const { data, error } = await db
    .from("ci_competitors")
    .insert({
      org_id: DEMO_ORG_ID,
      brand_name: input.brandName,
      domain: input.domain || null,
      social_handle: input.socialHandle || null,
      category: input.category || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToCompetitor(data as CompetitorRow);
}

export async function deleteCompetitor(id: string): Promise<void> {
  const db = createServiceSupabase();
  if (!db) return;
  const { error } = await db.from("ci_competitors").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
