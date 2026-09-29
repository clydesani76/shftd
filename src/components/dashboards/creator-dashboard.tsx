"use client";

import Link from "next/link";
import { PageHeader, SectionLabel, ProgressBar } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppStatusBadge, Badge, SubmissionBadge } from "@/components/ui/badge";
import {
  getApplications,
  getCampaign,
  getCreators,
  getLedger,
  getMarketplace,
  getSubmissions,
} from "@/lib/data";
import { formatCurrency, titleCase } from "@/lib/utils";
import { useSession } from "@/components/session";
import { Wallet, Trophy, Star, Briefcase, ArrowRight } from "lucide-react";

export function CreatorDashboard() {
  useSession();
  // Demo: treat the first creator profile as the signed-in creator.
  const creator = getCreators()[0];
  const apps = getApplications().filter((a) => a.creatorId === creator.id);
  const submissions = getSubmissions().filter((s) => s.creatorId === creator.id);
  const ledger = getLedger().filter((l) => l.creatorId === creator.id);
  const openListings = getMarketplace().filter((m) => m.isOpen);

  const pending = ledger
    .filter((l) => l.status !== "paid")
    .reduce((s, l) => s + l.amount, 0);
  const bonusEarned = ledger
    .filter((l) => l.type === "performance_bonus")
    .reduce((s, l) => s + l.amount, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${creator.name.split(" ")[0]}`}
        subtitle="Your creator workspace — campaigns, submissions, and earnings."
        actions={
          <Link href="/marketplace">
            <Button>
              <Briefcase className="h-4 w-4" /> Browse campaigns
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total earnings"
          value={formatCurrency(creator.totalEarnings, true)}
          icon={Wallet}
          accent="green"
        />
        <StatCard
          label="Pending payout"
          value={formatCurrency(pending)}
          icon={DollarPending}
          accent="amber"
        />
        <StatCard
          label="Trust score"
          value={`${creator.trustScore}`}
          hint="out of 100"
          icon={Star}
          accent="cyber"
        />
        <StatCard
          label="Campaigns done"
          value={String(creator.completedCampaigns)}
          icon={Trophy}
          accent="electric"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Bonus progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Performance bonus</CardTitle>
            <p className="text-sm text-slate-500">Progress toward your bonus tier</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold text-slate-900">
                {formatCurrency(bonusEarned)}
              </span>
              <span className="text-xs text-slate-500">of {formatCurrency(3000)} cap</span>
            </div>
            <ProgressBar value={bonusEarned} max={3000} tone="green" className="mt-3" />
            <p className="mt-3 text-xs text-slate-500">
              Hit 1.5M views on the Coffee Swap campaign to unlock the next tier.
            </p>
          </CardContent>
        </Card>

        {/* My applications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {apps.map((a) => {
              const camp = getCampaign(a.campaignId);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-ink-800/50 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{camp?.name}</p>
                    <p className="text-xs text-slate-500">
                      Role: {titleCase(a.role)}
                    </p>
                  </div>
                  <AppStatusBadge status={a.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionLabel>My submissions</SectionLabel>
          <div className="space-y-2">
            {submissions.map((s) => {
              const camp = getCampaign(s.campaignId);
              return (
                <Card key={s.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{camp?.name}</p>
                    <SubmissionBadge status={s.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{s.note}</p>
                  {s.reviewerNote && (
                    <p className="mt-1 text-xs text-electric-600">
                      Reviewer: {s.reviewerNote}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Open opportunities</SectionLabel>
          <div className="space-y-2">
            {openListings.map((m) => {
              const camp = getCampaign(m.campaignId);
              return (
                <Card key={m.id} hover className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{camp?.name}</p>
                    <Badge tone="green">
                      {formatCurrency(m.payRange.min)}–{formatCurrency(m.payRange.max)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.rolesNeeded.map((r) => (
                      <Badge key={r}>{titleCase(r)}</Badge>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="mt-3">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Small inline icon to avoid an extra import name clash.
function DollarPending({ className }: { className?: string }) {
  return <Wallet className={className} />;
}
