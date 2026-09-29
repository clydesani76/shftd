// Server-side data module: append-only audit trail.
// Records engagement/permission/proposal/approval/rights/payment events. There
// is no update or delete path — the table is write-once by design.

import { createServiceSupabase } from "@/lib/supabase/server";

export interface AuditEvent {
  id: string;
  orgId?: string;
  actorUserId?: string;
  action: string;
  subjectType?: string;
  subjectId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export async function recordAudit(e: {
  orgId?: string | null;
  actorUserId?: string | null;
  action: string;
  subjectType?: string;
  subjectId?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  const db = createServiceSupabase();
  if (!db) return; // demo / no DB — nothing to audit
  await db.from("audit_events").insert({
    org_id: e.orgId ?? null,
    actor_user_id: e.actorUserId ?? null,
    action: e.action,
    subject_type: e.subjectType ?? null,
    subject_id: e.subjectId ?? null,
    data: e.data ?? {},
  });
  // Intentionally swallow errors: auditing must never block the primary action,
  // but we also never surface a false success — callers log separately.
}

interface AuditRow {
  id: string;
  org_id: string | null;
  actor_user_id: string | null;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

export async function listAudit(
  orgId: string,
  opts: { subjectId?: string; limit?: number } = {},
): Promise<AuditEvent[]> {
  const db = createServiceSupabase();
  if (!db) return [];
  let query = db
    .from("audit_events")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.subjectId) query = query.eq("subject_id", opts.subjectId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as AuditRow[]).map((r) => ({
    id: r.id,
    orgId: r.org_id ?? undefined,
    actorUserId: r.actor_user_id ?? undefined,
    action: r.action,
    subjectType: r.subject_type ?? undefined,
    subjectId: r.subject_id ?? undefined,
    data: r.data ?? {},
    createdAt: r.created_at,
  }));
}
