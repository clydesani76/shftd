"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, SectionLabel, ProgressBar } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCampaign, getCreator } from "@/lib/data";
import { useLedgerData, useCampaignsData, type LedgerRowView } from "@/lib/workspace-data";
import { config } from "@/lib/config";
import { useSession } from "@/components/session";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import type { LedgerStatus } from "@/types";
import { Wallet, TrendingUp, Clock, CreditCard, ShieldCheck } from "lucide-react";

const ledgerTone: Record<LedgerStatus, Parameters<typeof Badge>[0]["tone"]> = {
  pending: "amber",
  approved: "cyber",
  paid: "green",
  failed: "red",
  disputed: "red",
};

export default function PayoutsPage() {
  const { role, user, isDemo } = useSession();
  const queryClient = useQueryClient();
  const { data: ledger } = useLedgerData();
  const { data: campaigns } = useCampaignsData();
  const [connected, setConnected] = useState(false);

  const isAdmin = role === "admin";

  // Admin: record a verified manual payment, or resolve a disputed obligation.
  const ledgerMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      action: "mark_paid" | "resolve_dispute";
      reference?: string;
      resolution?: "approved" | "failed";
    }) => {
      const res = await fetch(`/api/ledger/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, paidBy: user.fullName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed");
      }
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ledger"] }),
  });
  const canAct = isAdmin && !isDemo;

  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalBase = campaigns.reduce((s, c) => s + c.basePayPool, 0);
  const totalBonus = campaigns.reduce((s, c) => s + c.performanceBonusPool, 0);
  const paid = ledger.filter((l) => l.status === "paid").reduce((s, l) => s + l.amount, 0);
  const pending = ledger
    .filter((l) => l.status !== "paid")
    .reduce((s, l) => s + l.amount, 0);

  return (
    <div>
      <PageHeader
        title="Payouts & Incentives"
        subtitle="Base pay, performance bonuses, and a transparent ledger. Stripe Connect-ready."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Allocated budget" value={formatCurrency(totalBudget, true)} icon={Wallet} accent="electric" />
        <StatCard label="Base pay pool" value={formatCurrency(totalBase, true)} icon={CreditCard} accent="cyber" />
        <StatCard label="Performance bonus pool" value={formatCurrency(totalBonus, true)} icon={TrendingUp} accent="green" />
        <StatCard label="Pending payouts" value={formatCurrency(pending)} icon={Clock} accent="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Stripe Connect onboarding (stub) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Payout method</CardTitle>
            <p className="text-sm text-slate-500">
              {role === "creator"
                ? "Connect your account to receive payouts."
                : "Creators onboard via Stripe Connect."}
            </p>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "rounded-lg border p-4",
                connected
                  ? "border-signal-green/30 bg-signal-green/5"
                  : "border-slate-200 bg-ink-800/50",
              )}
            >
              <div className="flex items-center gap-2">
                <CreditCard
                  className={cn("h-5 w-5", connected ? "text-emerald-600" : "text-slate-500")}
                />
                <p className="text-sm font-medium text-slate-900">
                  {connected ? "Stripe Connect linked" : "Not connected"}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {/* TODO: replace stub with real Stripe Connect onboarding via
                    Account Links + webhook to update payout eligibility. */}
                {config.hasStripe
                  ? "Stripe keys detected — wire up Account Links to go live."
                  : "Stripe is stubbed in this build. Add STRIPE_SECRET_KEY to enable."}
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                variant={connected ? "secondary" : "primary"}
                onClick={() => setConnected((v) => !v)}
              >
                {connected ? "Connected ✓" : "Connect with Stripe"}
              </Button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <Row label="Paid out" value={formatCurrency(paid)} tone="green" />
              <Row label="Pending" value={formatCurrency(pending)} tone="amber" />
            </div>
          </CardContent>
        </Card>

        {/* Ledger */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Payment ledger</CardTitle>
              <p className="text-sm text-slate-500">
                Base pay, bonuses &amp; licensing — separate entries. Paid only
                on verified payment.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-y border-slate-200 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Creator</th>
                  <th className="px-4 py-2 font-medium">Campaign</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledger.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No payout activity yet. Payout obligations are created when
                      you approve a creator&apos;s deliverable — and stay pending
                      until a payment is genuinely verified.
                    </td>
                  </tr>
                )}
                {ledger.map((l) => (
                  <tr key={l.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{l.creatorName ?? getCreator(l.creatorId)?.name ?? "Creator"}</td>
                    <td className="px-4 py-3 text-slate-500">{l.campaignName ?? getCampaign(l.campaignId)?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{titleCase(l.type)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(l.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={ledgerTone[l.status]}>{l.status}</Badge>
                      {l.status === "paid" && l.paymentReference && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                          <ShieldCheck className="h-3 w-3" /> ref{" "}
                          {l.paymentReference}
                          {l.paidBy ? ` · ${l.paidBy}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canAct ? (
                        <PaymentControls
                          entry={l}
                          onPay={(reference) =>
                            ledgerMutation.mutate({
                              id: l.id,
                              action: "mark_paid",
                              reference,
                            })
                          }
                          onResolve={(resolution) =>
                            ledgerMutation.mutate({
                              id: l.id,
                              action: "resolve_dispute",
                              resolution,
                            })
                          }
                          pending={ledgerMutation.isPending}
                        />
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ledgerMutation.isError && (
              <p className="px-4 py-2 text-xs text-rose-300">
                {(ledgerMutation.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Creator earnings breakdown */}
      <div className="mt-6">
        <SectionLabel>Creator earnings & bonus progress</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from(new Set(ledger.map((l) => l.creatorId))).map((cid) => {
            const entries = ledger.filter((l) => l.creatorId === cid);
            const creatorName =
              entries.find((l) => l.creatorName)?.creatorName ??
              getCreator(cid)?.name ??
              "Creator";
            const earned = entries.reduce((s, l) => s + l.amount, 0);
            const bonus = entries
              .filter((l) => l.type === "performance_bonus")
              .reduce((s, l) => s + l.amount, 0);
            return (
              <Card key={cid} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{creatorName}</p>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(earned)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Bonus progress</span>
                    <span>{formatCurrency(bonus)} / {formatCurrency(3000)}</span>
                  </div>
                  <ProgressBar value={bonus} max={3000} tone="green" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={tone === "green" ? "text-emerald-600" : "text-amber-600"}>
        {value}
      </span>
    </div>
  );
}

// Admin controls for a single obligation: record a verified manual payment
// (approved → paid, reference required) or resolve a dispute.
function PaymentControls({
  entry,
  onPay,
  onResolve,
  pending,
}: {
  entry: LedgerRowView;
  onPay: (reference: string) => void;
  onResolve: (resolution: "approved" | "failed") => void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState("");

  if (entry.status === "disputed") {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onResolve("approved")}>
          Approve
        </Button>
        <Button size="sm" variant="danger" disabled={pending} onClick={() => onResolve("failed")}>
          Fail
        </Button>
      </div>
    );
  }

  if (entry.status !== "approved") {
    return <span className="text-xs text-slate-500">—</span>;
  }

  if (!open) {
    return (
      <Button size="sm" disabled={pending} onClick={() => setOpen(true)}>
        Record payment
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Payment reference"
        className="h-8 w-40 rounded border border-slate-200 bg-ink-700 px-2 text-xs text-slate-900 placeholder:text-slate-400 ring-focus"
      />
      <Button
        size="sm"
        disabled={pending || !reference.trim()}
        onClick={() => onPay(reference.trim())}
      >
        Confirm
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
