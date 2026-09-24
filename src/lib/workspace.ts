// ─────────────────────────────────────────────────────────────
// Workspace model — the hard line between the DEMO experience and a
// user's own REAL workspace.
//
//   demo  → the Nova Hydration sample org. ALL data is in-memory mock and is
//           always labeled "Demo data". It never reads or writes the database.
//   real  → the user's own workspace, backed by Supabase. Starts EMPTY. Only
//           shows data the user actually created — never sample figures.
//
// This module holds pure helpers (no React, no browser) so the rules can be
// unit-tested and shared by client and server.
// ─────────────────────────────────────────────────────────────

export type Workspace = "demo" | "real";

export const WORKSPACE_STORAGE_KEY = "shftd:workspace";
export const WORKSPACE_COOKIE = "shftd_ws";
export const DEFAULT_WORKSPACE: Workspace = "demo";

export function isWorkspace(v: unknown): v is Workspace {
  return v === "demo" || v === "real";
}

export function isDemoWorkspace(w: Workspace): boolean {
  return w === "demo";
}

// Totals for the dashboard hero stats. `null` means "no data yet" — the UI
// must render an empty state (e.g. "—"), never a sample figure.
export interface DashboardTotals {
  revenue: number | null;
  reach: number | null;
  avgRoas: number | null;
  liveCampaigns: number;
  totalCampaigns: number;
  hasMetrics: boolean;
}

interface CampaignLike {
  status: string;
}
interface MetricLike {
  revenue: number;
  views: number;
  roas: number;
}

// Derive dashboard totals from the CURRENT workspace's own records only.
// Critical rule: revenue/ROAS/reach are computed strictly from the metrics
// passed in. With zero metrics (e.g. a brand-new real workspace) they are
// null — the caller must not fall back to sample numbers.
export function deriveDashboardTotals(
  campaigns: CampaignLike[],
  metrics: MetricLike[],
): DashboardTotals {
  const totalCampaigns = campaigns.length;
  const liveCampaigns = campaigns.filter((c) => c.status === "live").length;

  if (metrics.length === 0) {
    return {
      revenue: null,
      reach: null,
      avgRoas: null,
      liveCampaigns,
      totalCampaigns,
      hasMetrics: false,
    };
  }

  const revenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const reach = metrics.reduce((s, m) => s + m.views, 0);
  const avgRoas =
    metrics.reduce((s, m) => s + m.roas, 0) / metrics.length;

  return {
    revenue,
    reach,
    avgRoas,
    liveCampaigns,
    totalCampaigns,
    hasMetrics: true,
  };
}

// Parse a workspace value coming from an untrusted source (cookie header,
// query string), falling back to the default.
export function parseWorkspace(v: string | null | undefined): Workspace {
  return isWorkspace(v) ? v : DEFAULT_WORKSPACE;
}
