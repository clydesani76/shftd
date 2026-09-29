// Server-side data module: operator proposals + versioned approvals.
// Operators cannot make consequential changes directly — they PROPOSE, and a
// brand/admin approves. Editing a proposal bumps its version, which invalidates
// any prior approval. Self-approval is impossible. Every step is audited.

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  canChangeProposal,
  proposalContentHash,
  canApproveProposal,
  nextProposalVersion,
  type ProposalStatus,
  type ProposalType,
} from "@/lib/operator-flow";
import { recordAudit } from "@/lib/db/audit";
import type { Role } from "@/lib/permissions";

export interface Proposal {
  id: string;
  engagementId: string;
  campaignId?: string;
  orgId: string;
  type: ProposalType;
  title: string;
  content: Record<string, unknown>;
  version: number;
  contentHash?: string;
  status: ProposalStatus;
  financialImpact: number;
  rightsImpact?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  engagement_id: string;
  campaign_id: string | null;
  org_id: string;
  type: ProposalType;
  title: string;
  content: Record<string, unknown> | null;
  version: number;
  content_hash: string | null;
  status: ProposalStatus;
  financial_impact: number | null;
  rights_impact: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toProposal(r: Row): Proposal {
  return {
    id: r.id,
    engagementId: r.engagement_id,
    campaignId: r.campaign_id ?? undefined,
    orgId: r.org_id,
    type: r.type,
    title: r.title,
    content: r.content ?? {},
    version: r.version,
    contentHash: r.content_hash ?? undefined,
    status: r.status,
    financialImpact: Number(r.financial_impact ?? 0),
    rightsImpact: r.rights_impact ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const SELECT = "*";

export interface NewProposal {
  engagementId: string;
  orgId: string;
  campaignId?: string;
  type: ProposalType;
  title: string;
  content: Record<string, unknown>;
  financialImpact?: number;
  rightsImpact?: string;
}

export async function createProposal(
  input: NewProposal,
  createdBy: string,
): Promise<Proposal> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
    .from("campaign_proposals")
    .insert({
      engagement_id: input.engagementId,
      org_id: input.orgId,
      campaign_id: input.campaignId ?? null,
      type: input.type,
      title: input.title,
      content: input.content,
      version: 1,
      content_hash: proposalContentHash(input.content),
      status: "draft",
      financial_impact: input.financialImpact ?? 0,
      rights_impact: input.rightsImpact ?? null,
      created_by: createdBy,
    })
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId: input.orgId,
    actorUserId: createdBy,
    action: "proposal.created",
    subjectType: "proposal",
    subjectId: (data as Row).id,
    data: { type: input.type },
  });
  return toProposal(data as Row);
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db
    .from("campaign_proposals")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toProposal(data as Row) : null;
}

export async function listProposals(filter: {
  orgId?: string;
  engagementId?: string;
}): Promise<Proposal[]> {
  const db = createServiceSupabase();
  if (!db) return [];
  let query = db
    .from("campaign_proposals")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (filter.orgId) query = query.eq("org_id", filter.orgId);
  if (filter.engagementId) query = query.eq("engagement_id", filter.engagementId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Row[]).map(toProposal);
}

// Editing bumps the version and returns the proposal to "draft" — dropping any
// prior approval (approvalValidFor keys on the exact version). Only the author.
export async function editProposal(
  id: string,
  input: { title?: string; content?: Record<string, unknown>; financialImpact?: number; rightsImpact?: string },
  editorUserId: string,
): Promise<Proposal> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const current = await getProposal(id);
  if (!current) throw new Error("Proposal not found");
  if (current.createdBy !== editorUserId)
    throw new Error("Only the author may edit this proposal");
  if (current.status === "approved" || current.status === "withdrawn")
    throw new Error(`Cannot edit a ${current.status} proposal`);

  const content = input.content ?? current.content;
  const { data, error } = await db
    .from("campaign_proposals")
    .update({
      title: input.title ?? current.title,
      content,
      content_hash: proposalContentHash(content),
      financial_impact: input.financialImpact ?? current.financialImpact,
      rights_impact: input.rightsImpact ?? current.rightsImpact ?? null,
      version: nextProposalVersion(current.version),
      status: "draft", // an edit invalidates a submission/approval
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId: current.orgId,
    actorUserId: editorUserId,
    action: "proposal.edited",
    subjectType: "proposal",
    subjectId: id,
    data: { version: nextProposalVersion(current.version) },
  });
  return toProposal(data as Row);
}

export async function submitProposal(
  id: string,
  actorUserId: string,
): Promise<void> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const current = await getProposal(id);
  if (!current) throw new Error("Proposal not found");
  const check = canChangeProposal(current.status, "submitted");
  if (!check.ok) throw new Error(check.reason ?? "Cannot submit");
  const { error } = await db
    .from("campaign_proposals")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", current.status);
  if (error) throw new Error(error.message);
  await recordAudit({
    orgId: current.orgId,
    actorUserId,
    action: "proposal.submitted",
    subjectType: "proposal",
    subjectId: id,
  });
}

// Brand/admin approves (or rejects) the EXACT submitted version. No self-approval.
export async function decideProposal(
  id: string,
  input: {
    decision: "approved" | "rejected";
    approverUserId: string;
    approverRole: Role;
    note?: string;
  },
): Promise<Proposal> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");
  const current = await getProposal(id);
  if (!current) throw new Error("Proposal not found");

  const check = canApproveProposal({
    approverUserId: input.approverUserId,
    approverRole: input.approverRole as never,
    proposal: { id: current.id, version: current.version, status: current.status, createdBy: current.createdBy },
  });
  if (!check.ok) throw new Error(check.reason ?? "Cannot approve");

  const nextStatus: ProposalStatus =
    input.decision === "approved" ? "approved" : "rejected";
  const { data, error } = await db
    .from("campaign_proposals")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "submitted") // guard: only a submitted proposal, prevents races
    .eq("version", current.version) // bind decision to the exact version
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);

  await db.from("proposal_approvals").insert({
    proposal_id: id,
    approved_version: current.version,
    decision: input.decision,
    approved_by: input.approverUserId,
    note: input.note ?? null,
  });
  await recordAudit({
    orgId: current.orgId,
    actorUserId: input.approverUserId,
    action: `proposal.${input.decision}`,
    subjectType: "proposal",
    subjectId: id,
    data: { version: current.version },
  });
  // NOTE: applying the underlying consequential change (publish, budget, payout,
  // rights) is FEATURE-FLAGGED off for this first release — approval is recorded
  // and audited; execution remains a brand action through the existing gates.
  return toProposal(data as Row);
}
