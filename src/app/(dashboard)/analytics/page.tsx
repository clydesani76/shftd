"use client";

import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, PathBadge } from "@/components/ui/badge";
import {
  CompareLines,
  Donut,
  SimpleBars,
  CHART_COLORS,
} from "@/components/charts/charts";
import { getCampaign, getCampaigns, getMetrics } from "@/lib/data";
import { formatCompact, formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Eye,
  Target,
  TrendingUp,
  Download,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

// Weekly proven vs original comparison (synthetic).
const COMPARE = [
  { label: "W1", proven: 1.8, original: 0.9 },
  { label: "W2", proven: 2.4, original: 1.4 },
  { label: "W3", proven: 3.1, original: 1.9 },
  { label: "W4", proven: 3.7, original: 2.4 },
];

export default function AnalyticsPage() {
  const metrics = getMetrics();
  const campaigns = getCampaigns();

  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalViews = metrics.reduce((s, m) => s + m.views, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const avgRoas = metrics.reduce((s, m) => s + m.roas, 0) / metrics.length;

  const revenueByCampaign = metrics.map((m) => ({
    label: getCampaign(m.campaignId)?.name.split(" ").slice(0, 2).join(" ") ?? "—",
    revenue: Math.round(m.revenue),
  }));

  const pathSplit = (["proven", "original"] as const).map((p) => ({
    name: p === "proven" ? "Safe & Proven" : "Bold & Original",
    value: metrics
      .filter((m) => getCampaign(m.campaignId)?.path === p)
      .reduce((s, m) => s + m.revenue, 0),
  }));

  return (
    <div>
      <PageHeader
        title="Analytics & ROI"
        subtitle="Did it work? Proven vs Original, head to head."
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(totalRevenue, true)} delta={18} icon={DollarSign} accent="green" />
        <StatCard label="Total views" value={formatCompact(totalViews)} delta={32} icon={Eye} accent="cyber" />
        <StatCard label="Conversions" value={formatCompact(totalConversions)} delta={11} icon={Target} accent="electric" />
        <StatCard label="Avg ROAS" value={`${avgRoas.toFixed(2)}x`} delta={6} icon={TrendingUp} accent="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proven vs Original — ROAS over time</CardTitle>
            <p className="text-sm text-slate-500">
              Proven plays deliver faster, predictable returns; original plays
              build slower but compound.
            </p>
          </CardHeader>
          <CardContent>
            <CompareLines
              data={COMPARE}
              series={[
                { key: "proven", name: "Safe & Proven", color: CHART_COLORS[1] },
                { key: "original", name: "Bold & Original", color: CHART_COLORS[0] },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by path</CardTitle>
          </CardHeader>
          <CardContent>
            <Donut data={pathSplit} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBars data={revenueByCampaign} dataKey="revenue" />
          </CardContent>
        </Card>

        {/* What worked / what failed */}
        <Card>
          <CardHeader>
            <CardTitle>What worked / what failed</CardTitle>
            <p className="text-sm text-slate-500">Auto-summarized from performance.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-signal-green/20 bg-signal-green/5 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <ThumbsUp className="h-4 w-4" /> What worked
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>• Honest POV hooks drove a 3.73x ROAS on the Coffee Swap.</li>
                <li>• Igniter-led top of funnel kept CAC under $19.</li>
                <li>• Q1 fresh-start framing hit the best ROAS on record (5.57x).</li>
              </ul>
            </div>
            <div className="rounded-lg border border-signal-red/20 bg-signal-red/5 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-rose-600">
                <ThumbsDown className="h-4 w-4" /> What failed
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>• &quot;Zero crash&quot; messaging underperformed (CTR 0.8%).</li>
                <li>• Original 3PM play is early — ROAS still ramping (2.4x).</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-campaign table */}
      <div className="mt-6">
        <SectionLabel>Campaign performance</SectionLabel>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">CTR</th>
                  <th className="px-4 py-3 font-medium">Conv.</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {metrics.map((m) => {
                  const c = getCampaign(m.campaignId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{c?.name}</td>
                      <td className="px-4 py-3">{c && <PathBadge path={c.path} />}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCompact(m.views)}</td>
                      <td className="px-4 py-3 text-slate-600">{m.ctr}%</td>
                      <td className="px-4 py-3 text-slate-600">{formatCompact(m.conversions)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(m.revenue, true)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={m.roas >= 3 ? "green" : "amber"}>{m.roas}x</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
