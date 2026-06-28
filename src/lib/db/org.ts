// Shared helpers for the server-side data modules.
// A single, stable demo org guarantees every inserted row (competitors,
// campaigns, etc.) has a valid parent org, so foreign keys are satisfied
// without requiring full multi-tenant login yet.

import { createServiceSupabase } from "@/lib/supabase/server";
import { ORG as MOCK_ORG } from "@/lib/mock/data";

export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

type ServiceClient = NonNullable<ReturnType<typeof createServiceSupabase>>;

// Ensure the demo org row exists. Safe to call repeatedly (upsert by id).
export async function ensureDemoOrg(db: ServiceClient): Promise<void> {
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
