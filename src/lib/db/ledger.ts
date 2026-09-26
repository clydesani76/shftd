// Server-side data module: Payout ledger
// Base pay, performance bonuses and licensing fees are SEPARATE entries linked
// to the campaign, creator and submission. Obligations are written idempotently
// (deterministic idempotency_key) so approving the same deliverable twice never
// creates a duplicate. Nothing here marks a payout "paid" — that requires a
// verified path (payment provider or authorized admin).

import { createServiceSupabase } from "@/lib/supabase/server";
import { LEDGER as MOCK_LEDGER } from "@/lib/mock/data";
import type { LedgerEntry, LedgerStatus, LedgerType } from "@/types";
import {
  canMarkPaid,
  canResolveDispute,
  type PayoutObligation,
} from "@/lib/campaign-flow";

export interface LedgerView extends LedgerEntry {
  creatorName?: string;
  campaignName?: string;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  paymentMethod?: string;
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
  paid_at: string | null;
  paid_by: string | null;
  payment_reference: string | null;
  payment_method: string | null;
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
    paidAt: r.paid_at ?? undefined,
    paidBy: r.paid_by ?? undefined,
    paymentReference: r.payment_reference ?? undefined,
    paymentMethod: r.payment_method ?? undefined,
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

// Record a VERIFIED manual payment. Only an authorized admin may call this, only
// from an "approved" obligation, and only WITH a payment reference. This is the
// one legitimate path to "paid" without a payment provider — nothing here
// simulates a real transfer. The status guard (.eq("status","approved")) also
// makes it idempotent against a double-click.
export async function recordVerifiedPayment(
  id: string,
  input: { reference: string; paidBy: string; method?: string },
): Promise<void> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const { data: entry, error: readErr } = await db
    .from("ledger_entries")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!entry) throw new Error("Ledger entry not found");

  const check = canMarkPaid(
    (entry as { status: LedgerStatus }).status,
    "admin_verified",
    { hasReference: !!input.reference?.trim() },
  );
  if (!check.ok) throw new Error(check.reason ?? "Cannot mark paid");

  const { error } = await db
    .from("ledger_entries")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_by: input.paidBy,
      payment_reference: input.reference,
      payment_method: input.method || "manual",
    })
    .eq("id", id)
    .eq("status", "approved");
  if (error) throw new Error(error.message);
}

// Admin resolves a disputed obligation to approved (payable) or failed.
export async function resolveDispute(
  id: string,
  to: "approved" | "failed",
): Promise<void> {
  const db = createServiceSupabase();
  if (!db) throw new Error("Database not configured");

  const { data: entry, error: readErr } = await db
    .from("ledger_entries")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!entry) throw new Error("Ledger entry not found");

  const check = canResolveDispute(
    (entry as { status: LedgerStatus }).status,
    to,
  );
  if (!check.ok) throw new Error(check.reason ?? "Cannot resolve");

  const { error } = await db
    .from("ledger_entries")
    .update({ status: to })
    .eq("id", id)
    .eq("status", "disputed");
  if (error) throw new Error(error.message);
}
