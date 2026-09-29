// Server-side data module: risk signals (anti-gaming, auditability).
// Signals are OBSERVATIONS for human review — kept separate from final findings.
// A single signal never auto-penalizes a user.

import { createServiceSupabase } from "@/lib/supabase/server";

export interface RiskSignal {
  id: string;
  orgId?: string;
  kind: string;
  severity: "low" | "medium" | "high";
  subjectType?: string;
  subjectId?: string;
  evidence?: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export async function recordRiskSignal(s: {
  orgId?: string | null;
  kind: string;
  severity?: "low" | "medium" | "high";
  subjectType?: string;
  subjectId?: string;
  evidence?: Record<string, unknown>;
}): Promise<void> {
  const db = createServiceSupabase();
  if (!db) return;
  await db.from("risk_signals").insert({
    org_id: s.orgId ?? null,
    kind: s.kind,
    severity: s.severity ?? "low",
    subject_type: s.subjectType ?? null,
    subject_id: s.subjectId ?? null,
    evidence: s.evidence ?? {},
    status: "open",
  });
}

interface Row {
  id: string;
  org_id: string | null;
  kind: string;
  severity: "low" | "medium" | "high";
  subject_type: string | null;
  subject_id: string | null;
  evidence: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

export async function listRiskSignals(orgId?: string): Promise<RiskSignal[]> {
  const db = createServiceSupabase();
  if (!db) return [];
  let query = db
    .from("risk_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (orgId) query = query.eq("org_id", orgId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map((r) => ({
    id: r.id,
    orgId: r.org_id ?? undefined,
    kind: r.kind,
    severity: r.severity,
    subjectType: r.subject_type ?? undefined,
    subjectId: r.subject_id ?? undefined,
    evidence: r.evidence ?? {},
    status: r.status,
    createdAt: r.created_at,
  }));
}

// First-pass detection at invite time: flag a self-referral / related party
// (the operator being engaged is the brand's own account owner). More detectors
// (duplicate attribution, circular spend) are added as those data paths land.
export async function scanEngagementRisk(input: {
  orgId: string;
  operatorUserId: string;
  brandUserIds: string[];
}): Promise<void> {
  if (input.brandUserIds.includes(input.operatorUserId)) {
    await recordRiskSignal({
      orgId: input.orgId,
      kind: "self_referral",
      severity: "high",
      subjectType: "operator_user",
      subjectId: input.operatorUserId,
      evidence: { reason: "Operator is a member of the engaging brand org" },
    });
  }
}
