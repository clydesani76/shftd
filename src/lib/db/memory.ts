// Server-side data module: Marketing Memory
// Persists brand learnings (wins/losses) that feed future strategy. Depends
// only on the org (+ optional campaign), so no login/creator account needed.

import { createServiceSupabase } from "@/lib/supabase/server";
import { MEMORY as MOCK_MEMORY } from "@/lib/mock/data";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import { tempId } from "@/lib/utils";
import type { BrandMemoryNote, MemoryKind } from "@/types";

type Outcome = BrandMemoryNote["outcome"];

interface MemoryRow {
  id: string;
  org_id: string;
  campaign_id: string | null;
  kind: MemoryKind;
  insight: string;
  outcome: Outcome;
  metric_ref: string | null;
  created_at: string;
}

function rowToNote(r: MemoryRow): BrandMemoryNote {
  return {
    id: r.id,
    orgId: r.org_id,
    campaignId: r.campaign_id ?? undefined,
    kind: r.kind,
    insight: r.insight,
    outcome: r.outcome,
    metricRef: r.metric_ref ?? undefined,
    createdAt: r.created_at,
  };
}

export async function listMemory(): Promise<BrandMemoryNote[]> {
  const db = createServiceSupabase();
  if (!db) return MOCK_MEMORY;

  const { data, error } = await db
    .from("brand_memory_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as MemoryRow[]).map(rowToNote);
}

export interface NewMemory {
  kind: MemoryKind;
  insight: string;
  outcome: Outcome;
  metricRef?: string;
}

export async function addMemory(input: NewMemory): Promise<BrandMemoryNote> {
  const db = createServiceSupabase();

  if (!db) {
    return {
      id: tempId("mem"),
      orgId: DEMO_ORG_ID,
      kind: input.kind,
      insight: input.insight,
      outcome: input.outcome,
      metricRef: input.metricRef,
      createdAt: new Date().toISOString(),
    };
  }

  await ensureDemoOrg(db);

  const { data, error } = await db
    .from("brand_memory_notes")
    .insert({
      org_id: DEMO_ORG_ID,
      kind: input.kind,
      insight: input.insight,
      outcome: input.outcome,
      metric_ref: input.metricRef || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToNote(data as MemoryRow);
}
