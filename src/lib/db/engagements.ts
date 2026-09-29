// Server-side data module: brand↔operator engagements.
// A brand invites an APPROVED operator with an explicit scope (campaigns +
// permissions), a service fee, and a window. Access begins only after the
// operator accepts; expiry/revocation block immediately (enforced by
// engagementActive at every check). Accepting records a SEPARATE operator-fee
// obligation and an audit event.

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  canChangeEngagement,
  engagementActive,
  canAcceptEngagements,
  deriveOperatorFee,
  type EngagementStatus,
  type OperatorPermission,
  type OperatorScope,
} from "@/lib/operator-flow";
import { recordOperatorFee } from "@/lib/db/ledger";
import { recordAudit } from "@/lib/db/audit";
import type { QualificationStatus } from "@/lib/operator-flow";

export interface Engagement {
  id: string;
  orgId: string;
  operatorUserId: string;
  operatorName?: string;
  scopeNote?: string;
  campaignIds: string[];
  permissions: OperatorPermission[];
  serviceFee: number;
  feeModel: string;
  startAt?: string;
  expiresAt?: string;
  status: EngagementStatus;
  agreementVersion: number;
  acceptedAt?: string;
  createdAt: string;
}

interface Row {
  id: string;
  org_id: string;
  operator_user_id: string;
  scope_note: string | null;
  campaign_ids: string[] | null;
  permissions: string[] | null;
  service_fee: number | null;
  fee_model: string;
  start_at: string | null;
  expires_at: string | null;
  status: EngagementStatus;
  agreement_version: number;
  accepted_at: string | null;
  created_at: string;
  users: { full_name: string } | null;
}

function toEngagement(r: Row): Engagement {
  return {
    id: r.id,
    orgId: r.org_id,
    operatorUserId: r.operator_user_id,
    operatorName: r.users?.full_name,
    scopeNote: r.scope_note ?? undefined,
    campaignIds: r.campaign_ids ?? [],
    permissions: (r.permissions ?? []) as OperatorPermission[],
    serviceFee: Number(r.service_fee ?? 0),
    feeModel: r.fee_model,
    startAt: r.start_at ?? undefined,
    expiresAt: r.expires_at ?? undefined,
    status: r.status,
    agreementVersion: r.agreement_version,
    acceptedAt: r.accepted_at ?? undefined,
    createdAt: r.created_at,
  };
}

const SELECT = "*, users:operator_user_id(full_name)";

export interface InviteInput {
  operatorUserId: string;
  scopeNote?: string;
  campaignIds: string[];
  permissions: OperatorPermission[];
  serviceFee: number;
  feeModel?: string;
  startAt?: string;
  expiresAt?: string;
}

// Brand invites an operator. The operator must be admin-approved to be engaged.
export async function inviteEngagement(
  orgId: string,
  proposedBy: string,
  input: InviteInput,
): Promise<Engagement> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const { data: prof } = await db
    .from("operator_profiles")
    .select("status")
    .eq("user_id", input.operatorUserId)
    .maybeSingle();
  const status = (prof as { status: QualificationStatus } | null)?.status;
  if (!status || !canAcceptEngagements(status)) {
    throw new Error("Operator is not approved to accept engagements");
  }

  const { data, error } = await db
    .from("brand_operator_engagements")
    .insert({
      org_id: orgId,
      operator_user_id: input.operatorUserId,
      scope_note: input.scopeNote ?? null,
      campaign_ids: input.campaignIds,
      permissions: input.permissions,
      service_fee: Math.max(0, input.serviceFee),
      fee_model: input.feeModel ?? "fixed",
      start_at: input.startAt ?? null,
      expires_at: input.expiresAt ?? null,
      status: "proposed",
      proposed_by: proposedBy,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId,
    actorUserId: proposedBy,
    action: "engagement.invited",
    subjectType: "engagement",
    subjectId: (data as Row).id,
    data: { operatorUserId: input.operatorUserId, serviceFee: input.serviceFee },
  });
  return toEngagement(data as Row);
}

export async function listEngagements(filter: {
  orgId?: string;
  operatorUserId?: string;
}): Promise<Engagement[]> {
  const db = createServiceSupabase();
  if (!db) return [];
  let query = db
    .from("brand_operator_engagements")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (filter.orgId) query = query.eq("org_id", filter.orgId);
  if (filter.operatorUserId) query = query.eq("operator_user_id", filter.operatorUserId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toEngagement);
}

export async function getEngagement(id: string): Promise<Engagement | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("brand_operator_engagements")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toEngagement(data as Row) : null;
}

// Operator accepts an invitation → active. Only the invited operator may accept.
// Records the separate operator-fee obligation (fixed fee) idempotently.
export async function acceptEngagement(
  id: string,
  operatorUserId: string,
): Promise<Engagement> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const eng = await getEngagement(id);
  if (!eng) throw new Error("Engagement not found");
  if (eng.operatorUserId !== operatorUserId)
    throw new Error("Only the invited operator may accept");
  const check = canChangeEngagement(eng.status, "active");
  if (!check.ok) throw new Error(check.reason ?? "Cannot accept");

  const acceptedAt = new Date().toISOString();
  const { data, error } = await db
    .from("brand_operator_engagements")
    .update({ status: "active", accepted_at: acceptedAt })
    .eq("id", id)
    .eq("status", "proposed")
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);

  // Separate operator-fee obligation (fixed model). Idempotent by engagement.
  if (eng.serviceFee > 0 && (eng.feeModel === "fixed" || eng.feeModel === "milestone")) {
    const obligations = deriveOperatorFee(id, "engagement", eng.serviceFee);
    await recordOperatorFee(
      db,
      {
        orgId: eng.orgId,
        engagementId: id,
        operatorUserId,
        campaignId: eng.campaignIds[0] ?? null,
      },
      obligations,
    );
  }

  await recordAudit({
    orgId: eng.orgId,
    actorUserId: operatorUserId,
    action: "engagement.accepted",
    subjectType: "engagement",
    subjectId: id,
  });
  return toEngagement(data as Row);
}

export async function revokeEngagement(
  id: string,
  actorUserId: string,
): Promise<void> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const eng = await getEngagement(id);
  if (!eng) throw new Error("Engagement not found");
  const check = canChangeEngagement(eng.status, "revoked");
  if (!check.ok) throw new Error(check.reason ?? "Cannot revoke");
  const { error } = await db
    .from("brand_operator_engagements")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["proposed", "active"]);
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId: eng.orgId,
    actorUserId,
    action: "engagement.revoked",
    subjectType: "engagement",
    subjectId: id,
  });
}

// Build the operator's scope for a campaign from any active engagement that
// covers it. Returns null when there is no active, in-scope engagement.
export async function getOperatorScope(
  operatorUserId: string,
  campaignId: string,
): Promise<OperatorScope | null> {
  const engagements = await listEngagements({ operatorUserId });
  for (const e of engagements) {
    if (!e.campaignIds.includes(campaignId)) continue;
    const engagementLike = {
      status: e.status,
      startAt: e.startAt,
      expiresAt: e.expiresAt,
      acceptedAt: e.acceptedAt,
    };
    if (engagementActive(engagementLike)) {
      return {
        engagement: engagementLike,
        campaignIds: e.campaignIds,
        permissions: e.permissions,
      };
    }
  }
  return null;
}
