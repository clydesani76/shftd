"use client";

import Link from "next/link";
import { PageHeader, SectionLabel, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, InsightBadge, PathBadge, StatusBadge } from "@/components/ui/badge";
import { TrendArea } from "@/components/charts/charts";
import { GoldenPath } from "@/components/dashboards/golden-path";
import { DemoData } from "@/components/dashboards/demo-data";
import { useSession } from "@/components/session";
import {
  useCampaignsData,
  useInsightsData,
  useMetricsData,
  useRecommendationsData,
} from "@/lib/workspace-data";
import { deriveDashboardTotals } from "@/lib/workspace";
import { formatCompact, formatCurrency, timeAgo } from "@/lib/utils";
import {
  Eye,
  DollarSign,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Radar,
  BarChart3,
  Lightbulb,
} from "lucide-react";

// 8-week reach trend — illustrative, shown only in the demo workspace.
const DEMO_TREND = [
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
  const { isDemo, hydrated } = useSession();
  const { data: campaigns } = useCampaignsData();
  const { data: metrics } = useMetricsData();
  const { data: insights } = useInsightsData();
  const { data: recs } = useRecommendationsData();

  const totals = deriveDashboardTotals(campaigns, metrics);
  const money = (v: number | null) => (v === null ? "—" : formatCurrency(v, true));

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

      {isDemo && <GoldenPath />}

      {/* Real workspaces may explicitly import the sample dataset when empty. */}
      {!isDemo && hydrated && campaigns.length === 0 && (
        <DemoData empty={true} />
      )}

      {/* Top stats — derived strictly from this workspace's own records. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (attributed)"
          value={money(totals.revenue)}
          delta={totals.hasMetrics ? 18 : undefined}
          hint={totals.hasMetrics ? "vs last period" : "no campaign data yet"}
          icon={DollarSign}
          accent="green"
        />
        <StatCard
          label="Total reach"
          value={totals.reach === null ? "—" : formatCompact(totals.reach)}
          delta={totals.hasMetrics ? 32 : undefined}
          hint={totals.hasMetrics ? "views across campaigns" : "no metrics yet"}
          icon={Eye}
          accent="cyber"
        />
        <StatCard
          label="Avg ROAS"
          value={totals.avgRoas === null ? "—" : `${totals.avgRoas.toFixed(2)}x`}
          delta={totals.hasMetrics ? 6 : undefined}
          hint={totals.hasMetrics ? "return on ad spend" : "needs live results"}
          icon={TrendingUp}
          accent="electric"
        />
        <StatCard
          label="Live campaigns"
          value={String(totals.liveCampaigns)}
          hint={`${totals.totalCampaigns} total`}
          icon={Target}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Reach trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reach momentum</CardTitle>
            <p className="text-sm text-slate-500">
              Cumulative views (thousands) across active campaigns
            </p>
          </CardHeader>
          <CardContent>
            {isDemo ? (
              <TrendArea data={DEMO_TREND} dataKey="views" />
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <BarChart3 className="mb-2 h-6 w-6 text-slate-500" />
                <p className="text-sm text-slate-500">
                  No performance data yet — reach appears once a campaign goes
                  live and metrics are recorded.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next best actions */}
        <Card>
          <CardHeader>
            <CardTitle>Next best actions</CardTitle>
            <p className="text-sm text-slate-500">AI-recommended moves</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Lightbulb className="h-5 w-5 text-slate-500" />
                <p className="text-sm text-slate-500">
                  No recommendations yet.
                </p>
                <Link href="/strategy">
                  <Button size="sm" variant="outline">
                    Generate a strategy
                  </Button>
                </Link>
              </div>
            ) : (
              recs.map((r) => (
                <Link
                  key={r.id}
                  href="/strategy"
                  className="block rounded-lg border border-slate-200 bg-ink-800/50 p-3 transition-colors hover:border-slate-300"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <PathBadge path={r.path} />
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">{r.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {r.concept}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights + campaigns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionLabel>Fresh intelligence</SectionLabel>
          {insights.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="No intelligence yet"
              description="Add competitors and run analysis to surface winning patterns and white space."
              action={
                <Link href="/intelligence">
                  <Button size="sm" variant="outline">
                    Go to Intelligence
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {insights.slice(0, 3).map((i) => (
                  <Card key={i.id} hover className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <InsightBadge category={i.category} />
                      <span className="text-xs text-slate-500">
                        {timeAgo(i.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{i.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
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
            </>
          )}
        </div>

        <div>
          <SectionLabel>Active campaigns</SectionLabel>
          {campaigns.filter((c) =>
            ["live", "published", "review"].includes(c.status),
          ).length === 0 ? (
            <EmptyState
              icon={Target}
              title="No active campaigns"
              description="Create a campaign and publish it to the marketplace to start working with creators."
              action={
                <Link href="/campaigns/new">
                  <Button size="sm" variant="outline">
                    New campaign
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {campaigns
                  .filter((c) =>
                    ["live", "published", "review"].includes(c.status),
                  )
                  .map((c) => (
                    <Link key={c.id} href={`/campaigns/${c.id}`}>
                      <Card hover className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {c.name}
                          </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
