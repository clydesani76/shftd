// Server-side data module: Competitive Intelligence — Evidence & Insights
// Evidence is attached to competitors; insights are org-scoped AI output.
// "Re-analyze" generates insights from the org's real evidence (via the AI
// service layer) and replaces the stored set.

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  EVIDENCE as MOCK_EVIDENCE,
  INSIGHTS as MOCK_INSIGHTS,
  ORG as MOCK_ORG,
} from "@/lib/mock/data";
import { ai, mockProvider } from "@/lib/ai";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import { tempId } from "@/lib/utils";
import type { Evidence, EvidenceType, Insight, InsightCategory } from "@/types";

// ── Evidence ──────────────────────────────────────────────────
interface EvidenceRow {
  id: string;
  competitor_id: string;
  type: EvidenceType;
  channel: string | null;
  content: string;
  source_url: string | null;
  captured_at: string;
}

function rowToEvidence(r: EvidenceRow): Evidence {
  return {
    id: r.id,
    competitorId: r.competitor_id,
    type: r.type,
    channel: r.channel ?? "",
    content: r.content,
    sourceUrl: r.source_url ?? undefined,
    capturedAt: r.captured_at,
  };
}

export async function listEvidence(): Promise<Evidence[]> {
  const db = createServiceSupabase();
  if (!db) return MOCK_EVIDENCE;
  const { data, error } = await db
    .from("ci_evidence")
    .select("*")
    .order("captured_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as EvidenceRow[]).map(rowToEvidence);
}

export interface NewEvidence {
  competitorId: string;
  type: EvidenceType;
  channel: string;
  content: string;
  sourceUrl?: string;
}

export async function addEvidence(input: NewEvidence): Promise<Evidence> {
  const db = createServiceSupabase();
  if (!db) {
    return {
      id: tempId("ev"),
      competitorId: input.competitorId,
      type: input.type,
      channel: input.channel,
      content: input.content,
      sourceUrl: input.sourceUrl,
      capturedAt: new Date().toISOString(),
    };
  }
  const { data, error } = await db
    .from("ci_evidence")
    .insert({
      competitor_id: input.competitorId,
      type: input.type,
      channel: input.channel || null,
      content: input.content,
      source_url: input.sourceUrl || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToEvidence(data as EvidenceRow);
}

// ── Insights ──────────────────────────────────────────────────
interface InsightRow {
  id: string;
  org_id: string;
  category: InsightCategory;
  title: string;
  explanation: string | null;
  recommendation: string | null;
  channel: string | null;
  confidence: number | null;
  created_at: string;
}

function rowToInsight(r: InsightRow): Insight {
  return {
    id: r.id,
    orgId: r.org_id,
    category: r.category,
    title: r.title,
    explanation: r.explanation ?? "",
    recommendation: r.recommendation ?? "",
    channel: r.channel ?? "",
    confidence: Number(r.confidence ?? 0),
    evidenceIds: [],
    createdAt: r.created_at,
  };
}

export async function listInsights(): Promise<Insight[]> {
  const db = createServiceSupabase();
  if (!db) return MOCK_INSIGHTS;
  const { data, error } = await db
    .from("ci_insights")
    .select("*")
    .eq("org_id", DEMO_ORG_ID)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as InsightRow[]).map(rowToInsight);
}

// Generate insights from the org's real evidence and replace the stored set.
export async function reanalyzeInsights(): Promise<Insight[]> {
  const db = createServiceSupabase();

  const evidence = await listEvidence();
  const aiInput = {
    brandName: MOCK_ORG.name,
    industry: MOCK_ORG.industry,
    evidence: evidence.map((e) => ({
      type: e.type,
      channel: e.channel,
      content: e.content,
    })),
  };

  // Use the configured provider; fall back to mock if a live call fails.
  let generated;
  try {
    generated = await ai.analyzeInsights(aiInput);
  } catch {
    generated = await mockProvider.analyzeInsights(aiInput);
  }

  if (!db) {
    // Demo fallback: just return the freshly generated insights.
    return generated.map((g) => ({
      id: tempId("ins"),
      orgId: DEMO_ORG_ID,
      category: g.category,
      title: g.title,
      explanation: g.explanation,
      recommendation: g.recommendation,
      channel: g.channel,
      confidence: g.confidence,
      evidenceIds: [],
      createdAt: new Date().toISOString(),
    }));
  }

  await ensureDemoOrg(db);

  // Replace the stored insight set so re-analysis doesn't pile up duplicates.
  await db.from("ci_insights").delete().eq("org_id", DEMO_ORG_ID);

  const rows = generated.map((g) => ({
    org_id: DEMO_ORG_ID,
    category: g.category,
    title: g.title,
    explanation: g.explanation,
    recommendation: g.recommendation,
    channel: g.channel,
    confidence: g.confidence,
  }));

  const { data, error } = await db.from("ci_insights").insert(rows).select("*");
  if (error) throw new Error(error.message);
  return (data as InsightRow[]).map(rowToInsight);
}
