"use client";

import Link from "next/link";
import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, InsightBadge, PathBadge, StatusBadge } from "@/components/ui/badge";
import { TrendArea } from "@/components/charts/charts";
import { useQuery } from "@tanstack/react-query";
import {
  getInsights,
  getMetrics,
  getRecommendations,
} from "@/lib/data";
import type { Campaign } from "@/types";
import { formatCompact, formatCurrency, timeAgo } from "@/lib/utils";
import {
  Eye,
  DollarSign,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// 8-week synthetic reach trend for the hero chart.
const TREND = [
  { label: "W1", views: 120 },
  { label: "W2", views: 180 },
  { label: "W3", views: 240 },
  { label: "W4", views: 360 },
  { label: "W5", views: 520 },
  { label: "W6", views: 690 },
  { label: "W7", views: 910 },
  { label: "W8", views: 1180 },
];

export function BusinessDashboard() {
  // Campaigns are real (from the database); insights, recommendations and
  // performance metrics remain illustrative until those modules are migrated.
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      return data.campaigns ?? [];
    },
  });
  const insights = getInsights();
  const recs = getRecommendations();
  const metrics = getMetrics();

  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalViews = metrics.reduce((s, m) => s + m.views, 0);
  const avgRoas = metrics.reduce((s, m) => s + m.roas, 0) / metrics.length;
  const liveCount = campaigns.filter((c) => c.status === "live").length;

  return (
    <div>
      <PageHeader
        title="What should we do next?"
        subtitle="Your Marketing OS — observe the market, decide, execute, and learn."
        actions={
          <Link href="/strategy">
            <Button>
              <Sparkles className="h-4 w-4" /> Generate strategy
            </Button>
          </Link>
        }
      />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (attributed)"
          value={formatCurrency(totalRevenue, true)}
          delta={18}
          hint="vs last period"
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Total reach"
          value={formatCompact(totalViews)}
          delta={32}
          hint="views across campaigns"
          icon={Eye}
          accent="cyber"
        />
        <StatCard
          label="Avg ROAS"
          value={`${avgRoas.toFixed(2)}x`}
          delta={6}
          hint="return on ad spend"
          icon={TrendingUp}
          accent="electric"
        />
        <StatCard
          label="Live campaigns"
          value={String(liveCount)}
          hint={`${campaigns.length} total`}
          icon={Target}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Reach trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reach momentum</CardTitle>
            <p className="text-sm text-slate-400">
              Cumulative views (thousands) across active campaigns
            </p>
          </CardHeader>
          <CardContent>
            <TrendArea data={TREND} dataKey="views" />
          </CardContent>
        </Card>

        {/* Next best actions */}
        <Card>
          <CardHeader>
            <CardTitle>Next best actions</CardTitle>
            <p className="text-sm text-slate-400">AI-recommended moves</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.map((r) => (
              <Link
                key={r.id}
                href="/strategy"
                className="block rounded-lg border border-white/5 bg-ink-800/50 p-3 transition-colors hover:border-white/10"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <PathBadge path={r.path} />
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-white">{r.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {r.concept}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Insights + campaigns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionLabel>Fresh intelligence</SectionLabel>
          <div className="space-y-3">
            {insights.slice(0, 3).map((i) => (
              <Card key={i.id} hover className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <InsightBadge category={i.category} />
                  <span className="text-xs text-slate-500">
                    {timeAgo(i.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{i.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                  {i.recommendation}
                </p>
              </Card>
            ))}
          </div>
          <Link href="/intelligence">
            <Button variant="ghost" size="sm" className="mt-3">
              View all intelligence <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div>
          <SectionLabel>Active campaigns</SectionLabel>
          <div className="space-y-3">
            {campaigns
              .filter((c) => ["live", "published", "review"].includes(c.status))
              .map((c) => (
                <Link key={c.id} href={`/campaigns/${c.id}`}>
                  <Card hover className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <PathBadge path={c.path} />
                      <Badge>{formatCurrency(c.budget, true)} budget</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
          <Link href="/campaigns">
            <Button variant="ghost" size="sm" className="mt-3">
              All campaigns <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
