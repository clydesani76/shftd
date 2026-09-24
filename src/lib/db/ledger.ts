// Server-side data module: Payout ledger
// Base pay, performance bonuses and licensing fees are SEPARATE entries linked
// to the campaign, creator and submission. Obligations are written idempotently
// (deterministic idempotency_key) so approving the same deliverable twice never
// creates a duplicate. Nothing here marks a payout "paid" — that requires a
// verified path (payment provider or authorized admin).

import { createServiceSupabase } from "@/lib/supabase/server";
import { LEDGER as MOCK_LEDGER } from "@/lib/mock/data";
import type { LedgerEntry, LedgerStatus, LedgerType } from "@/types";
import type { PayoutObligation } from "@/lib/campaign-flow";

export interface LedgerView extends LedgerEntry {
  creatorName?: string;
  campaignName?: string;
}

interface LedgerRow {
  id: string;
  campaign_id: string;
  creator_id: string;
  submission_id: string | null;
  type: LedgerType;
  amount: number | null;
  status: LedgerStatus;
  note: string | null;
  created_at: string;
  creator_profiles: { name: string } | null;
  campaigns: { name: string } | null;
}

function rowToView(r: LedgerRow): LedgerView {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    creatorId: r.creator_id,
    submissionId: r.submission_id ?? undefined,
    type: r.type,
    amount: Number(r.amount ?? 0),
    status: r.status,
    note: r.note ?? undefined,
    createdAt: r.created_at,
    creatorName: r.creator_profiles?.name,
    campaignName: r.campaigns?.name,
  };
}

export async function listLedger(): Promise<LedgerView[]> {
  const db = createServiceSupabase();
  if (!db) return MOCK_LEDGER as LedgerView[];

  const { data, error } = await db
    .from("ledger_entries")
    .select("*, creator_profiles(name), campaigns(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as LedgerRow[]).map(rowToView);
}

type ServiceDb = NonNullable<ReturnType<typeof createServiceSupabase>>;

// Idempotently record payout obligations for an approved submission. Relies on
// the unique idempotency_key: re-approving inserts nothing new. Returns the
// number of NEW obligations written.
export async function recordObligations(
  db: ServiceDb,
  ctx: { campaignId: string; creatorId: string; submissionId: string },
  obligations: PayoutObligation[],
): Promise<number> {
  if (obligations.length === 0) return 0;

  const rows = obligations.map((o) => ({
    campaign_id: ctx.campaignId,
    creator_id: ctx.creatorId,
    submission_id: ctx.submissionId,
    type: o.type,
    amount: o.amount,
    status: o.status,
    idempotency_key: o.idempotencyKey,
    note:
      o.status === "disputed"
        ? "Held for review — bonus unusually large vs. base pay"
        : null,
  }));

  // onConflict on the unique idempotency_key + ignoreDuplicates = idempotent.
  const { data, error } = await db
    .from("ledger_entries")
    .upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
