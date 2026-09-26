// ─────────────────────────────────────────────────────────────
// Campaign workflow state machine (pure, server-shared, unit-tested).
//
// Encodes the legal transitions for the campaign lifecycle and the submission
// review flow, plus idempotent derivation of payout obligations. Keeping this
// pure lets the API enforce it on the server AND lets us test every rule
// without a database. (Priority 2.)
// ─────────────────────────────────────────────────────────────

import type {
  CampaignStatus,
  LedgerType,
  RightsStatus,
  SubmissionStatus,
} from "@/types";

// ── Campaign lifecycle ────────────────────────────────────────
// draft → published → live → review → completed; anything → archived.
// A brief must be APPROVED before it can be published.
export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["published", "archived"],
  published: ["live", "draft", "archived"],
  live: ["review", "completed", "archived"],
  review: ["live", "completed", "archived"],
  completed: ["archived"],
  archived: [],
};

export interface TransitionCheck {
  ok: boolean;
  reason?: string;
}

export function canTransitionCampaign(
  from: CampaignStatus,
  to: CampaignStatus,
  opts: { briefApproved?: boolean } = {},
): TransitionCheck {
  if (from === to) return { ok: false, reason: `Already ${to}` };
  const allowed = CAMPAIGN_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, reason: `Cannot move a ${from} campaign to ${to}` };
  }
  // Gate: publishing requires an approved brief.
  if (to === "published" && !opts.briefApproved) {
    return {
      ok: false,
      reason: "Approve the brief before publishing to the marketplace",
    };
  }
  return { ok: true };
}

// ── Submission review ─────────────────────────────────────────
// submitted → approved | rejected | revision_requested.
// revision_requested → submitted (creator resubmits). approved/rejected are
// terminal. Approval is what creates a payout obligation.
export const SUBMISSION_TRANSITIONS: Record<
  SubmissionStatus,
  SubmissionStatus[]
> = {
  submitted: ["approved", "rejected", "revision_requested"],
  revision_requested: ["submitted"],
  approved: [],
  rejected: [],
};

export function canReviewSubmission(
  from: SubmissionStatus,
  to: SubmissionStatus,
): TransitionCheck {
  const allowed = SUBMISSION_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, reason: `Cannot move submission from ${from} to ${to}` };
  }
  return { ok: true };
}

// ── Payout obligations (idempotent) ───────────────────────────
// A payout obligation is created when a deliverable is APPROVED. Base pay,
// performance bonus, and licensing fee are SEPARATE entries. Each carries a
// deterministic idempotency key so re-approving the same submission never
// creates a duplicate obligation.
//
// New obligations start as "approved" — never "paid". A payout only becomes
// "paid" when a payment provider confirms it or an authorized admin records a
// verified manual payment (enforced elsewhere).
export type PayoutStatus =
  | "pending"
  | "approved"
  | "paid"
  | "failed"
  | "disputed";

export interface PayoutTerms {
  basePay: number;
  bonus: number;
  licensingFee: number;
}

export interface PayoutObligation {
  idempotencyKey: string;
  type: LedgerType;
  amount: number;
  status: PayoutStatus;
}

// A bonus this far above the agreed base pay is unusual and should be held for
// review rather than auto-approved.
export const BONUS_REVIEW_MULTIPLE = 2;

export function derivePayoutObligations(
  submissionId: string,
  terms: PayoutTerms,
): PayoutObligation[] {
  const out: PayoutObligation[] = [];
  const push = (type: LedgerType, amount: number, status: PayoutStatus) => {
    if (amount > 0) {
      out.push({ idempotencyKey: `${submissionId}:${type}`, type, amount, status });
    }
  };

  push("base_pay", terms.basePay, "approved");

  // Unusually large bonuses require manual review before approval.
  const bonusStatus: PayoutStatus =
    terms.basePay > 0 && terms.bonus > terms.basePay * BONUS_REVIEW_MULTIPLE
      ? "disputed"
      : "approved";
  push("performance_bonus", terms.bonus, bonusStatus);

  push("sales_bonus", 0, "approved"); // reserved; only created when > 0

  return out;
}

// Idempotent merge: given the obligations that should exist and the set of
// idempotency keys already recorded, return only the ones that are new.
export function newObligations(
  obligations: PayoutObligation[],
  existingKeys: Iterable<string>,
): PayoutObligation[] {
  const seen = new Set(existingKeys);
  return obligations.filter((o) => !seen.has(o.idempotencyKey));
}

// A payout may only be marked paid via a verified path, and only from an
// "approved" obligation with a payment reference present.
export function canMarkPaid(
  from: PayoutStatus,
  by: "provider_confirmed" | "admin_verified" | "client",
  opts: { hasReference?: boolean } = {},
): TransitionCheck {
  if (from === "paid") return { ok: false, reason: "Already paid" };
  if (from === "disputed")
    return { ok: false, reason: "Resolve the dispute before paying" };
  if (from !== "approved")
    return { ok: false, reason: `Cannot pay a ${from} obligation` };
  if (by === "client") {
    return {
      ok: false,
      reason: "Payments require provider confirmation or an admin-verified record",
    };
  }
  if (by === "admin_verified" && !opts.hasReference) {
    return {
      ok: false,
      reason: "A verified manual payment must include a payment reference",
    };
  }
  return { ok: true };
}

// An authorized admin resolves a disputed obligation — either approving it for
// payment or marking it failed. No other transition out of "disputed".
export function canResolveDispute(
  from: PayoutStatus,
  to: "approved" | "failed",
): TransitionCheck {
  if (from !== "disputed")
    return { ok: false, reason: "Only a disputed obligation can be resolved" };
  if (to !== "approved" && to !== "failed")
    return { ok: false, reason: "Resolve to approved or failed" };
  return { ok: true };
}

// ── UGC rights / licensing ────────────────────────────────────
// A brand PROPOSES rights; the creator must EXPLICITLY consent (accept) before
// they are granted. Accepted rights can later be revoked or expire. Expanding
// rights = a new proposal (a new agreement row), never an in-place widening.
export const RIGHTS_TRANSITIONS: Record<RightsStatus, RightsStatus[]> = {
  proposed: ["accepted", "declined"],
  accepted: ["revoked", "expired"],
  declined: [],
  revoked: [],
  expired: [],
};

export function canChangeRights(
  from: RightsStatus,
  to: RightsStatus,
): TransitionCheck {
  const allowed = RIGHTS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    return { ok: false, reason: `Cannot move rights from ${from} to ${to}` };
  }
  return { ok: true };
}

// Rights are only granted with explicit creator consent.
export function rightsGranted(status: RightsStatus): boolean {
  return status === "accepted";
}
