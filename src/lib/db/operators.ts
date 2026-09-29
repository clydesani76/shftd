// Server-side data module: operator profiles + qualification.
// Applying creates a profile in "applicant". Only an administrator can move it
// to under_review/approved/suspended (competency + verified evidence — never
// paid certification). Self-reported disclosures are stored separately from
// admin-verified counts.

import { createServiceSupabase } from "@/lib/supabase/server";
import { canQualify, type QualificationStatus } from "@/lib/operator-flow";
import { recordAudit } from "@/lib/db/audit";

export interface OperatorProfile {
  id: string;
  userId: string;
  displayName: string;
  businessInfo?: string;
  specialties: string[];
  portfolioUrl?: string;
  serviceFeeNote?: string; // self-reported
  conflictsNote?: string; // self-reported
  verifiedOutcomes: number; // admin-verified
  repeatBrands: number; // admin-verified
  paymentReliability?: number; // admin-verified 0-100
  status: QualificationStatus;
  reviewNote?: string;
  createdAt: string;
}

interface Row {
  id: string;
  user_id: string;
  display_name: string;
  business_info: string | null;
  specialties: string[] | null;
  portfolio_url: string | null;
  service_fee_note: string | null;
  conflicts_note: string | null;
  verified_outcomes: number | null;
  repeat_brands: number | null;
  payment_reliability: number | null;
  status: QualificationStatus;
  review_note: string | null;
  created_at: string;
}

function toProfile(r: Row): OperatorProfile {
  return {
    id: r.id,
    userId: r.user_id,
    displayName: r.display_name,
    businessInfo: r.business_info ?? undefined,
    specialties: r.specialties ?? [],
    portfolioUrl: r.portfolio_url ?? undefined,
    serviceFeeNote: r.service_fee_note ?? undefined,
    conflictsNote: r.conflicts_note ?? undefined,
    verifiedOutcomes: Number(r.verified_outcomes ?? 0),
    repeatBrands: Number(r.repeat_brands ?? 0),
    paymentReliability: r.payment_reliability ?? undefined,
    status: r.status,
    reviewNote: r.review_note ?? undefined,
    createdAt: r.created_at,
  };
}

export async function getOperatorProfile(
  userId: string,
): Promise<OperatorProfile | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("operator_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? toProfile(data as Row) : null;
}

export interface OperatorApplication {
  displayName: string;
  businessInfo?: string;
  specialties?: string[];
  portfolioUrl?: string;
  serviceFeeNote?: string;
  conflictsNote?: string;
}

// Apply (or update your own draft application). Never sets a privileged status.
export async function applyAsOperator(
  userId: string,
  input: OperatorApplication,
): Promise<OperatorProfile> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
    .from("operator_profiles")
    .upsert(
      {
        user_id: userId,
        display_name: input.displayName,
        business_info: input.businessInfo ?? null,
        specialties: input.specialties ?? [],
        portfolio_url: input.portfolioUrl ?? null,
        service_fee_note: input.serviceFeeNote ?? null,
        conflicts_note: input.conflictsNote ?? null,
        status: "applicant",
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    actorUserId: userId,
    action: "operator.apply",
    subjectType: "operator_profile",
    subjectId: (data as Row).id,
  });
  return toProfile(data as Row);
}

export async function listOperators(
  status?: QualificationStatus,
): Promise<OperatorProfile[]> {
  const db = createServiceSupabase();
  if (!db) return [];
  let query = db
    .from("operator_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toProfile);
}

// Admin qualification decision. Validates the transition and records the actor.
export async function reviewOperator(
  id: string,
  input: {
    to: QualificationStatus;
    reviewedBy: string;
    note?: string;
    verified?: { verifiedOutcomes?: number; repeatBrands?: number; paymentReliability?: number };
  },
): Promise<void> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const { data: cur } = await db
    .from("operator_profiles")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!cur) throw new Error("Operator not found");
  const check = canQualify((cur as { status: QualificationStatus }).status, input.to);
  if (!check.ok) throw new Error(check.reason ?? "Illegal qualification change");

  const patch: Record<string, unknown> = {
    status: input.to,
    review_note: input.note ?? null,
    reviewed_by: input.reviewedBy,
  };
  if (input.verified) {
    if (input.verified.verifiedOutcomes != null)
      patch.verified_outcomes = input.verified.verifiedOutcomes;
    if (input.verified.repeatBrands != null)
      patch.repeat_brands = input.verified.repeatBrands;
    if (input.verified.paymentReliability != null)
      patch.payment_reliability = input.verified.paymentReliability;
  }
  const { error } = await db
    .from("operator_profiles")
    .update(patch)
    .eq("id", id)
    .eq("status", (cur as { status: QualificationStatus }).status);
  if (error) throw new Error(error.message);
  await recordAudit({
    actorUserId: input.reviewedBy,
    action: `operator.${input.to}`,
    subjectType: "operator_profile",
    subjectId: id,
    data: { note: input.note },
  });
}
