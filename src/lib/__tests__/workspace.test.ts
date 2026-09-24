import { describe, it, expect } from "vitest";
import {
  deriveDashboardTotals,
  parseWorkspace,
  isWorkspace,
  isDemoWorkspace,
} from "@/lib/workspace";
import { METRICS, CAMPAIGNS } from "@/lib/mock/data";

describe("workspace parsing", () => {
  it("accepts only known workspaces", () => {
    expect(isWorkspace("demo")).toBe(true);
    expect(isWorkspace("real")).toBe(true);
    expect(isWorkspace("nova")).toBe(false);
    expect(isWorkspace(null)).toBe(false);
  });

  it("falls back to demo for garbage input", () => {
    expect(parseWorkspace("real")).toBe("real");
    expect(parseWorkspace("demo")).toBe("demo");
    expect(parseWorkspace("hacker")).toBe("demo");
    expect(parseWorkspace(undefined)).toBe("demo");
  });

  it("flags the demo workspace", () => {
    expect(isDemoWorkspace("demo")).toBe(true);
    expect(isDemoWorkspace("real")).toBe(false);
  });
});

describe("deriveDashboardTotals — real vs demo analytics", () => {
  it("returns NO revenue/ROAS/reach for an empty (real) workspace", () => {
    const t = deriveDashboardTotals([], []);
    expect(t.revenue).toBeNull();
    expect(t.reach).toBeNull();
    expect(t.avgRoas).toBeNull();
    expect(t.hasMetrics).toBe(false);
    expect(t.totalCampaigns).toBe(0);
    expect(t.liveCampaigns).toBe(0);
  });

  it("never fabricates figures when campaigns exist but metrics do not", () => {
    // A real brand with a draft campaign but no recorded results.
    const campaigns = [{ status: "draft" }, { status: "live" }];
    const t = deriveDashboardTotals(campaigns, []);
    expect(t.revenue).toBeNull();
    expect(t.avgRoas).toBeNull();
    expect(t.totalCampaigns).toBe(2);
    expect(t.liveCampaigns).toBe(1);
  });

  it("computes real totals only from the metrics provided", () => {
    const metrics = [
      { revenue: 100, views: 1000, roas: 2 },
      { revenue: 300, views: 3000, roas: 4 },
    ];
    const t = deriveDashboardTotals([{ status: "live" }], metrics);
    expect(t.revenue).toBe(400);
    expect(t.reach).toBe(4000);
    expect(t.avgRoas).toBe(3);
    expect(t.hasMetrics).toBe(true);
  });

  it("demo dataset produces non-null totals (the sample workspace)", () => {
    const t = deriveDashboardTotals(CAMPAIGNS, METRICS);
    expect(t.hasMetrics).toBe(true);
    expect(t.revenue).not.toBeNull();
    expect((t.revenue as number) > 0).toBe(true);
  });

  it("isolation: the same derive function yields empty for real and rich for demo", () => {
    const real = deriveDashboardTotals(CAMPAIGNS, []); // real workspace: metrics gated to []
    const demo = deriveDashboardTotals(CAMPAIGNS, METRICS);
    expect(real.revenue).toBeNull();
    expect(demo.revenue).not.toBeNull();
  });
});
