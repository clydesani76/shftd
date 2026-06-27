"use client";

import { useState } from "react";
import { PageHeader, SectionLabel, ProgressBar } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCampaign,
  getCampaigns,
  getCreator,
  getLedger,
} from "@/lib/data";
import { config } from "@/lib/config";
import { useSession } from "@/components/session";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import type { LedgerStatus } from "@/types";
import { Wallet, TrendingUp, Clock, CreditCard, ArrowRight } from "lucide-react";

const ledgerTone: Record<LedgerStatus, Parameters<typeof Badge>[0]["tone"]> = {
  pending: "amber",
  approved: "cyber",
  paid: "green",
};

export default function PayoutsPage() {
  const { role } = useSession();
  const ledger = getLedger();
  const campaigns = getCampaigns();
  const [connected, setConnected] = useState(false);

  const isAdmin = role === "admin";

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
            <p className="text-sm text-slate-400">
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
                  : "border-white/10 bg-ink-800/50",
              )}
            >
              <div className="flex items-center gap-2">
                <CreditCard
                  className={cn("h-5 w-5", connected ? "text-signal-green" : "text-slate-400")}
                />
                <p className="text-sm font-medium text-white">
                  {connected ? "Stripe Connect linked" : "Not connected"}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-400">
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
              <p className="text-sm text-slate-400">Every base pay & bonus entry.</p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline">
                Approve all pending <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-y border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Creator</th>
                  <th className="px-4 py-2 font-medium">Campaign</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">{getCreator(l.creatorId)?.name}</td>
                    <td className="px-4 py-3 text-slate-400">{getCampaign(l.campaignId)?.name}</td>
                    <td className="px-4 py-3 text-slate-300">{titleCase(l.type)}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency(l.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={ledgerTone[l.status]}>{l.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Creator earnings breakdown */}
      <div className="mt-6">
        <SectionLabel>Creator earnings & bonus progress</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from(new Set(ledger.map((l) => l.creatorId))).map((cid) => {
            const creator = getCreator(cid);
            const entries = ledger.filter((l) => l.creatorId === cid);
            const earned = entries.reduce((s, l) => s + l.amount, 0);
            const bonus = entries
              .filter((l) => l.type === "performance_bonus")
              .reduce((s, l) => s + l.amount, 0);
            return (
              <Card key={cid} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{creator?.name}</p>
                  <span className="text-sm font-semibold text-signal-green">
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
      <span className="text-slate-400">{label}</span>
      <span className={tone === "green" ? "text-signal-green" : "text-signal-amber"}>
        {value}
      </span>
    </div>
  );
}
