// ─────────────────────────────────────────────────────────────
// Campaign Operator Network — pure, server-shared, unit-tested logic.
//
// Covers: operator qualification, brand↔operator engagement lifecycle (access
// begins only after brand acceptance; expiry/revocation immediately block),
// scoped operator permissions, versioned proposal approvals (editing a proposal
// invalidates its approval; no self-approval), and operator-fee separation from
// creator earnings.
// ─────────────────────────────────────────────────────────────

// ── Operator qualification ────────────────────────────────────
export type QualificationStatus =
  | "applicant"
  | "under_review"
  | "approved"
  | "suspended";

export const QUALIFICATION_TRANSITIONS: Record<
  QualificationStatus,
  QualificationStatus[]
> = {
  applicant: ["under_review", "suspended"],
  under_review: ["approved", "applicant", "suspended"],
  approved: ["suspended"],
  suspended: ["under_review"],
};

export interface Check {
  ok: boolean;
  reason?: string;
}

export function canQualify(
  from: QualificationStatus,
  to: QualificationStatus,
): Check {
  const allowed = QUALIFICATION_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to))
    return { ok: false, reason: `Cannot move operator from ${from} to ${to}` };
  return { ok: true };
}

// An operator may only accept brand engagements once administrator-approved.
export function canAcceptEngagements(status: QualificationStatus): boolean {
  return status === "approved";
}

// ── Engagement lifecycle ──────────────────────────────────────
export type EngagementStatus =
  | "proposed"
  | "active"
  | "expired"
  | "revoked"
  | "completed";

export const ENGAGEMENT_TRANSITIONS: Record<
  EngagementStatus,
  EngagementStatus[]
> = {
  proposed: ["active", "revoked", "expired"], // brand accepts → active; or declines/revokes
  active: ["revoked", "expired", "completed"],
  expired: [],
  revoked: [],
  completed: [],
};

export function canChangeEngagement(
  from: EngagementStatus,
  to: EngagementStatus,
): Check {
  const allowed = ENGAGEMENT_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to))
    return { ok: false, reason: `Cannot move engagement from ${from} to ${to}` };
  return { ok: true };
}

export interface EngagementLike {
  status: EngagementStatus;
  startAt?: string | null;
  expiresAt?: string | null;
  acceptedAt?: string | null;
}

// Access is granted ONLY when the engagement is active (brand-accepted), within
// its window, and not revoked/expired. Expiry is enforced by the clock even if
// the stored status hasn't been swept yet — so a lapsed engagement blocks
// immediately, including queued jobs.
export function engagementActive(
  e: EngagementLike,
  now: Date = new Date(),
): boolean {
  if (e.status !== "active") return false;
  if (!e.acceptedAt) return false;
  const t = now.getTime();
  if (e.startAt && t < new Date(e.startAt).getTime()) return false;
  if (e.expiresAt && t > new Date(e.expiresAt).getTime()) return false;
  return true;
}

// ── Scoped operator permissions ───────────────────────────────
export type OperatorPermission =
  | "view_campaign"
  | "view_analytics"
  | "draft_brief"
  | "content_directions"
  | "propose_creators"
  | "prepare_budget"
  | "review_deliverables";

export interface OperatorScope {
  engagement: EngagementLike;
  campaignIds: string[]; // campaigns covered by the engagement
  permissions: OperatorPermission[];
}

// An operator may perform a scoped action only if the engagement is active, the
// campaign is in scope, and the specific permission was granted. Consequential
// actions (publish, budget increase, payout, rights, compensation changes) are
// NEVER granted here — operators can only PROPOSE those, which route to brand
// approval.
export function operatorCan(
  scope: OperatorScope | null,
  permission: OperatorPermission,
  campaignId: string,
  now: Date = new Date(),
): Check {
  if (!scope) return { ok: false, reason: "No active engagement" };
  if (!engagementActive(scope.engagement, now))
    return { ok: false, reason: "Engagement is not active" };
  if (!scope.campaignIds.includes(campaignId))
    return { ok: false, reason: "Campaign is not in the engagement scope" };
  if (!scope.permissions.includes(permission))
    return { ok: false, reason: `Engagement does not grant ${permission}` };
  return { ok: true };
}

// ── Proposals & versioned approvals ───────────────────────────
export type ProposalType =
  | "brief_draft"
  | "content_directions"
  | "creator_shortlist"
  | "budget_change"
  | "creator_comp_change"
  | "operator_comp_change"
  | "publish_campaign"
  | "payout_release"
  | "rights_grant";

export type ProposalStatus = "draft" | "submitted" | "approved" | "rejected" | "withdrawn";

export const PROPOSAL_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["approved", "rejected", "draft", "withdrawn"], // back to draft = an edit
  approved: [],
  rejected: ["draft"],
  withdrawn: [],
};

export function canChangeProposal(
  from: ProposalStatus,
  to: ProposalStatus,
): Check {
  const allowed = PROPOSAL_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to))
    return { ok: false, reason: `Cannot move proposal from ${from} to ${to}` };
  return { ok: true };
}

// Stable content hash (order-independent) for display/audit integrity.
export function proposalContentHash(content: unknown): string {
  const stable = stableStringify(content);
  let h = 5381;
  for (let i = 0; i < stable.length; i++) h = ((h << 5) + h + stable.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

export interface ProposalLike {
  id: string;
  version: number;
  status: ProposalStatus;
  createdBy: string; // user id of the operator/author
}

export interface ApprovalLike {
  proposalId: string;
  approvedVersion: number;
  approvedBy: string;
}

// An approval is valid ONLY for the exact version it approved. Any edit
// increments the proposal version, so a stale approval no longer applies.
export function approvalValidFor(
  approval: ApprovalLike | null,
  proposal: ProposalLike,
): boolean {
  if (!approval) return false;
  if (approval.proposalId !== proposal.id) return false;
  return approval.approvedVersion === proposal.version && proposal.status === "approved";
}

// Who may approve a proposal: an authorized brand/admin approver who is NOT the
// author (no self-approval). Server also checks org ownership + role separately.
export function canApproveProposal(input: {
  approverUserId: string;
  approverRole: "business" | "creator" | "admin" | "operator";
  proposal: ProposalLike;
}): Check {
  if (input.proposal.status !== "submitted")
    return { ok: false, reason: "Only a submitted proposal can be approved" };
  if (input.approverRole !== "business" && input.approverRole !== "admin")
    return { ok: false, reason: "Only a brand or admin may approve" };
  if (input.approverUserId === input.proposal.createdBy)
    return { ok: false, reason: "Self-approval is not allowed" };
  return { ok: true };
}

// Editing a submitted/approved proposal bumps its version and drops any prior
// approval — returning the next version to persist.
export function nextProposalVersion(current: number): number {
  return current + 1;
}

// ── Operator fee separation ───────────────────────────────────
// Operator fees are their OWN ledger entries, never mixed into creator pay.
export interface OperatorFeeObligation {
  idempotencyKey: string;
  type: "operator_fee";
  amount: number;
  status: "pending" | "approved" | "paid" | "failed" | "disputed";
}

export function deriveOperatorFee(
  engagementId: string,
  milestoneKey: string,
  amount: number,
): OperatorFeeObligation[] {
  if (amount <= 0) return [];
  return [
    {
      idempotencyKey: `engagement:${engagementId}:operator_fee:${milestoneKey}`,
      type: "operator_fee",
      amount,
      status: "approved",
    },
  ];
}

// Invariant: adding operator fees must not alter creator earnings. Given the
// existing creator entries and new operator-fee entries, the creator total is
// unchanged.
export function creatorEarningsUnaffected(
  creatorEntries: { amount: number }[],
  before: number,
): boolean {
  const after = creatorEntries.reduce((s, e) => s + e.amount, 0);
  return after === before;
}
