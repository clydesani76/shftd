"use client";

import Link from "next/link";
import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmissionBadge } from "@/components/ui/badge";
import { SimpleBars } from "@/components/charts/charts";
import {
  getCampaigns,
  getCreators,
  getLedger,
  getSubmissions,
  getUsers,
} from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Users, Megaphone, AlertTriangle, Wallet, ArrowRight } from "lucide-react";

export function AdminDashboard() {
  const users = getUsers();
  const creators = getCreators();
  const campaigns = getCampaigns();
  const submissions = getSubmissions();
  const ledger = getLedger();

  const pendingPayouts = ledger
    .filter((l) => l.status !== "paid")
    .reduce((s, l) => s + l.amount, 0);
  const needsReview = submissions.filter(
    (s) => s.status === "submitted" || s.status === "revision_requested",
  );

  const campaignsByStatus = ["draft", "published", "live", "review", "completed"].map(
    (status) => ({
      label: status,
      count: campaigns.filter((c) => c.status === status).length,
    }),
  );

  return (
    <div>
      <PageHeader
        title="Platform control"
        subtitle="Manage users, campaigns, submissions, payouts, and disputes."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={String(users.length + creators.length)}
          hint={`${creators.length} creators`}
          icon={Users}
          accent="cyber"
        />
        <StatCard
          label="Campaigns"
          value={String(campaigns.length)}
          icon={Megaphone}
          accent="electric"
        />
        <StatCard
          label="Needs review"
          value={String(needsReview.length)}
          hint="submissions / flags"
          icon={AlertTriangle}
          accent="amber"
        />
        <StatCard
          label="Pending payouts"
          value={formatCurrency(pendingPayouts)}
          icon={Wallet}
          accent="green"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaigns by status</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBars data={campaignsByStatus} dataKey="count" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation queue</CardTitle>
            <p className="text-sm text-slate-500">Submissions awaiting action</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {needsReview.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-ink-800/50 p-3"
              >
                <p className="line-clamp-1 text-sm text-slate-700">{s.note}</p>
                <SubmissionBadge status={s.status} />
              </div>
            ))}
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mt-1">
                Open admin <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <SectionLabel>Recent users</SectionLabel>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
