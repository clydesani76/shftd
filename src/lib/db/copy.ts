// Server-side data module: Saved AI copy
// Persists copy variants saved from the Copy Studio. Only depends on the org
// (and optionally a campaign), so it needs no login/creator account.

import { createServiceSupabase } from "@/lib/supabase/server";
import { COPY_VARIANTS as MOCK_COPY } from "@/lib/mock/data";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import { tempId } from "@/lib/utils";
import type { CopyType, CopyVariant } from "@/types";

interface CopyRow {
  id: string;
  org_id: string;
  campaign_id: string | null;
  type: CopyType;
  platform: string | null;
  tone: string | null;
  content: string;
  score: number | null;
  created_at: string;
}

function rowToCopy(r: CopyRow): CopyVariant {
  return {
    id: r.id,
    orgId: r.org_id,
    campaignId: r.campaign_id ?? undefined,
    type: r.type,
    platform: r.platform ?? "",
    tone: r.tone ?? "",
    content: r.content,
    score: Number(r.score ?? 0),
    createdAt: r.created_at,
  };
}

// Only attach a campaign_id when it's a real database UUID, so saving copy
// tied to a sample (mock) campaign id never trips the foreign key.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const realCampaignId = (id?: string) => (id && UUID_RE.test(id) ? id : null);

export async function listSavedCopy(campaignId?: string): Promise<CopyVariant[]> {
  const db = createServiceSupabase();
  if (!db) {
    return campaignId
      ? MOCK_COPY.filter((c) => c.campaignId === campaignId)
      : MOCK_COPY;
  }

  let query = db.from("copy_variants").select("*").order("created_at", {
    ascending: false,
  });
  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CopyRow[]).map(rowToCopy);
}

export interface NewCopy {
  campaignId?: string;
  type: CopyType;
  platform: string;
  tone: string;
  content: string;
  score: number;
}

export async function saveCopy(input: NewCopy): Promise<CopyVariant> {
  const db = createServiceSupabase();

  if (!db) {
    return {
      id: tempId("cp"),
      orgId: DEMO_ORG_ID,
      campaignId: input.campaignId,
      type: input.type,
      platform: input.platform,
      tone: input.tone,
      content: input.content,
      score: input.score,
      createdAt: new Date().toISOString(),
    };
  }

  await ensureDemoOrg(db);

  const { data, error } = await db
    .from("copy_variants")
    .insert({
      org_id: DEMO_ORG_ID,
      campaign_id: realCampaignId(input.campaignId),
      type: input.type,
      platform: input.platform || null,
      tone: input.tone || null,
      content: input.content,
      score: input.score,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToCopy(data as CopyRow);
}
