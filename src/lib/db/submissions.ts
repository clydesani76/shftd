// Server-side data module: Submissions (deliverables) and their review.
// Creator submits a deliverable (URL/file + publication date + evidence). The
// brand approves, requests a revision, or rejects — recording WHO decided and
// WHEN. Approval idempotently creates the payout obligation from the accepted
// application's agreed terms. Transitions are validated by the shared state
// machine (src/lib/campaign-flow.ts), so the client cannot force an illegal one.

import { createServiceSupabase } from "@/lib/supabase/server";
import { getCurrentCreator } from "@/lib/db/applications";
import { recordObligations } from "@/lib/db/ledger";
import {
  canReviewSubmission,
  derivePayoutObligations,
} from "@/lib/campaign-flow";
import { SUBMISSIONS as MOCK_SUBS, CREATORS as MOCK_CREATORS } from "@/lib/mock/data";
import type { Submission, SubmissionStatus } from "@/types";

export interface SubmissionView extends Submission {
  creatorName: string;
}

interface SubmissionRow {
  id: string;
  campaign_id: string;
  creator_id: string;
  content_url: string | null;
  file_name: string | null;
  note: string | null;
  publication_date: string | null;
  evidence_url: string | null;
  status: SubmissionStatus;
  reviewer_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  creator_profiles: { name: string } | null;
}

function rowToView(r: SubmissionRow): SubmissionView {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    creatorId: r.creator_id,
    contentUrl: r.content_url ?? undefined,
    fileName: r.file_name ?? undefined,
    note: r.note ?? "",
    publicationDate: r.publication_date ?? undefined,
    evidenceUrl: r.evidence_url ?? undefined,
    status: r.status,
    reviewerNote: r.reviewer_note ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    submittedAt: r.submitted_at,
    creatorName: r.creator_profiles?.name ?? "Creator",
  };
}

export async function listSubmissions(
  campaignId?: string,
): Promise<SubmissionView[]> {
  const db = createServiceSupabase();
  if (!db) {
    const subs = campaignId
      ? MOCK_SUBS.filter((s) => s.campaignId === campaignId)
      : MOCK_SUBS;
    return subs.map((s) => ({
      ...s,
      creatorName:
        MOCK_CREATORS.find((c) => c.id === s.creatorId)?.name ?? "Creator",
    }));
  }

  let query = db
    .from("submissions")
    .select("*, creator_profiles(name)")
    .order("submitted_at", { ascending: false });
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as SubmissionRow[]).map(rowToView);
}

export interface NewSubmission {
  campaignId: string;
  contentUrl?: string;
  fileName?: string;
  note?: string;
  publicationDate?: string;
  evidenceUrl?: string;
}

// Creator submits a deliverable. Requires an authenticated creator.
export async function createSubmission(
  input: NewSubmission,
): Promise<SubmissionView> {
  const creator = await getCurrentCreator();
  if (!creator) throw new Error("UNAUTHENTICATED");
  const db = createServiceSupabase();
  if (!db) throw new Error("UNAUTHENTICATED");

  const { data, error } = await db
    .from("submissions")
    .insert({
      campaign_id: input.campaignId,
      creator_id: creator.id,
      content_url: input.contentUrl || null,
      file_name: input.fileName || null,
      note: input.note || null,
      publication_date: input.publicationDate || null,
      evidence_url: input.evidenceUrl || null,
      status: "submitted",
    })
    .select("*, creator_profiles(name)")
    .single();
  if (error) throw new Error(error.message);
  return rowToView(data as SubmissionRow);
}

export type ReviewDecision = "approve" | "reject" | "revise";

const DECISION_STATUS: Record<ReviewDecision, SubmissionStatus> = {
  approve: "approved",
  reject: "rejected",
  revise: "revision_requested",
};

export interface ReviewResult {
  submission: SubmissionView;
  obligationsCreated: number;
}

// Brand reviews a submission. Validates the transition, records the reviewer +
// timestamp, and — on approval — idempotently creates the payout obligation
// from the accepted application's agreed terms.
export async function reviewSubmission(
  id: string,
  input: { decision: ReviewDecision; reviewerNote?: string; reviewedBy: string },
): Promise<ReviewResult> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const { data: current, error: readErr } = await db
    .from("submissions")
    .select("*, creator_profiles(name)")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!current) throw new Error("Submission not found");

  const from = (current as SubmissionRow).status;
  const to = DECISION_STATUS[input.decision];
  const check = canReviewSubmission(from, to);
  if (!check.ok) throw new Error(check.reason ?? "Illegal review transition");

  const { data: updated, error: updErr } = await db
    .from("submissions")
    .update({
      status: to,
      reviewer_note: input.reviewerNote || null,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", from) // optimistic guard against concurrent double-review
    .select("*, creator_profiles(name)")
    .single();
  if (updErr) throw new Error(updErr.message);

  let obligationsCreated = 0;
  if (to === "approved") {
    const row = updated as SubmissionRow;
    // Agreed terms come from the accepted application for this creator+campaign.
    const { data: app } = await db
      .from("campaign_applications")
      .select("agreed_base_pay, agreed_bonus")
      .eq("campaign_id", row.campaign_id)
      .eq("creator_id", row.creator_id)
      .eq("status", "accepted")
      .maybeSingle();

    const basePay = Number(app?.agreed_base_pay ?? 0);
    const bonus = Number(app?.agreed_bonus ?? 0);

    const obligations = derivePayoutObligations(id, {
      basePay,
      bonus,
      licensingFee: 0,
    });
    obligationsCreated = await recordObligations(
      db,
      { campaignId: row.campaign_id, creatorId: row.creator_id, submissionId: id },
      obligations,
    );
  }

  return {
    submission: rowToView(updated as SubmissionRow),
    obligationsCreated,
  };
}
