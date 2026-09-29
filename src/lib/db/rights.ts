// Server-side data module: UGC rights / licensing agreements.
// A brand PROPOSES per-deliverable rights (channels, organic vs paid, duration,
// territory, editing/derivatives, fee, expiry). The creator must EXPLICITLY
// consent before rights are granted. Expanding rights = a new proposal (a new
// row) the creator consents to again. All rows for a submission form the license
// history, visible to both sides. On consent, a separate licensing_fee ledger
// entry is created idempotently (linked to the campaign, creator, submission and
// this agreement).

import { createServiceSupabase } from "@/lib/supabase/server";
import { recordObligations } from "@/lib/db/ledger";
import { canChangeRights } from "@/lib/campaign-flow";
import type { RightsAgreement, RightsStatus, RightsUsage } from "@/types";

interface RightsRow {
  id: string;
  submission_id: string;
  campaign_id: string;
  creator_id: string;
  channels: string[] | null;
  usage: RightsUsage;
  duration_days: number | null;
  territory: string | null;
  editing_allowed: boolean;
  fee: number | null;
  expires_at: string | null;
  status: RightsStatus;
  proposed_by: string | null;
  proposed_at: string;
  consented_by: string | null;
  consented_at: string | null;
  created_at: string;
}

function rowToRights(r: RightsRow): RightsAgreement {
  return {
    id: r.id,
    submissionId: r.submission_id,
    campaignId: r.campaign_id,
    creatorId: r.creator_id,
    channels: r.channels ?? [],
    usage: r.usage,
    durationDays: Number(r.duration_days ?? 0),
    territory: r.territory ?? "",
    editingAllowed: r.editing_allowed,
    fee: Number(r.fee ?? 0),
    expiresAt: r.expires_at ?? undefined,
    status: r.status,
    proposedBy: r.proposed_by ?? undefined,
    proposedAt: r.proposed_at,
    consentedBy: r.consented_by ?? undefined,
    consentedAt: r.consented_at ?? undefined,
    createdAt: r.created_at,
  };
}

export async function listRights(
  submissionId: string,
): Promise<RightsAgreement[]> {
  const db = createServiceSupabase();
  if (!db) return [];
  const { data, error } = await db
    .from("rights_agreements")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as RightsRow[]).map(rowToRights);
}

export interface ProposeRightsInput {
  submissionId: string;
  channels: string[];
  usage: RightsUsage;
  durationDays: number;
  territory: string;
  editingAllowed: boolean;
  fee: number;
  expiresAt?: string;
  proposedBy: string;
}

// Brand proposes rights for a deliverable (a new agreement row).
export async function proposeRights(
  input: ProposeRightsInput,
): Promise<RightsAgreement> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const { data: sub, error: subErr } = await db
    .from("submissions")
    .select("campaign_id, creator_id")
    .eq("id", input.submissionId)
    .maybeSingle();
  if (subErr) throw new Error(subErr.message);
  if (!sub) throw new Error("Submission not found");

  const { data, error } = await db
    .from("rights_agreements")
    .insert({
      submission_id: input.submissionId,
      campaign_id: (sub as { campaign_id: string }).campaign_id,
      creator_id: (sub as { creator_id: string }).creator_id,
      channels: input.channels,
      usage: input.usage,
      duration_days: input.durationDays,
      territory: input.territory || null,
      editing_allowed: input.editingAllowed,
      fee: Math.max(0, input.fee),
      expires_at: input.expiresAt || null,
      status: "proposed",
      proposed_by: input.proposedBy,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToRights(data as RightsRow);
}

export type ConsentDecision = "accept" | "decline" | "revoke";

const DECISION_STATUS: Record<ConsentDecision, RightsStatus> = {
  accept: "accepted",
  decline: "declined",
  revoke: "revoked",
};

// Creator consents (accept/decline) or later revokes. On explicit acceptance a
// separate licensing_fee ledger obligation is created idempotently.
export async function decideRights(
  id: string,
  input: { decision: ConsentDecision; consentedBy: string },
): Promise<{ rights: RightsAgreement; obligationsCreated: number }> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const { data: current, error: readErr } = await db
    .from("rights_agreements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!current) throw new Error("Rights agreement not found");

  const from = (current as RightsRow).status;
  const to = DECISION_STATUS[input.decision];
  const check = canChangeRights(from, to);
  if (!check.ok) throw new Error(check.reason ?? "Illegal rights transition");

  const patch: Record<string, unknown> = { status: to };
  if (input.decision === "accept") {
    patch.consented_by = input.consentedBy;
    patch.consented_at = new Date().toISOString();
  }

  const { data: updated, error: updErr } = await db
    .from("rights_agreements")
    .update(patch)
    .eq("id", id)
    .eq("status", from) // guard against concurrent decisions
    .select("*")
    .single();
  if (updErr) throw new Error(updErr.message);

  let obligationsCreated = 0;
  const row = updated as RightsRow;
  const fee = Number(row.fee ?? 0);
  if (to === "accepted" && fee > 0) {
    // Separate licensing-fee obligation, keyed to this agreement for idempotency.
    obligationsCreated = await recordObligations(
      db,
      {
        campaignId: row.campaign_id,
        creatorId: row.creator_id,
        submissionId: row.submission_id,
      },
      [
        {
          idempotencyKey: `rights:${row.id}:licensing_fee`,
          type: "licensing_fee",
          amount: fee,
          status: "approved",
        },
      ],
    );
  }

  return { rights: rowToRights(row), obligationsCreated };
}
