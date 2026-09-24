"use client";

// Workspace-aware client data hooks.
// In the DEMO workspace these return the Nova sample dataset (in-memory mock).
// In a REAL workspace they read the user's own Supabase-backed data via the
// API, and return EMPTY for data types that have no real backend yet — never
// sample figures. This is the boundary that keeps demo data out of real
// accounts (Priority 1).

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/session";
import * as mock from "@/lib/mock/data";
import type {
  BrandMemoryNote,
  Campaign,
  CampaignMetrics,
  CreatorProfile,
  Insight,
  LedgerEntry,
  MarketplaceListing,
  StrategyRecommendation,
} from "@/types";

interface Result<T> {
  data: T;
  isLoading: boolean;
  isDemo: boolean;
}

async function getArray<T>(url: string, key: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json[key] as T[]) ?? [];
}

// Campaigns — real workspaces read the database; demo uses the sample set.
export function useCampaignsData(): Result<Campaign[]> {
  const { workspace, isDemo } = useSession();
  const q = useQuery<Campaign[]>({
    queryKey: ["campaigns", workspace],
    enabled: !isDemo,
    queryFn: () => getArray<Campaign>("/api/campaigns", "campaigns"),
  });
  return {
    data: isDemo ? mock.CAMPAIGNS : q.data ?? [],
    isLoading: isDemo ? false : q.isLoading,
    isDemo,
  };
}

// Performance metrics — no real metrics backend yet, so a real workspace has
// NONE (revenue/ROAS must not fall back to sample numbers).
export function useMetricsData(): Result<CampaignMetrics[]> {
  const { isDemo } = useSession();
  return { data: isDemo ? mock.METRICS : [], isLoading: false, isDemo };
}

export function useInsightsData(): Result<Insight[]> {
  const { workspace, isDemo } = useSession();
  const q = useQuery<Insight[]>({
    queryKey: ["insights", workspace],
    enabled: !isDemo,
    queryFn: () => getArray<Insight>("/api/insights", "insights"),
  });
  return {
    data: isDemo ? mock.INSIGHTS : q.data ?? [],
    isLoading: isDemo ? false : q.isLoading,
    isDemo,
  };
}

// Strategy recommendations are generated on demand; a real workspace starts
// with none.
export function useRecommendationsData(): Result<StrategyRecommendation[]> {
  const { isDemo } = useSession();
  return { data: isDemo ? mock.RECOMMENDATIONS : [], isLoading: false, isDemo };
}

export function useMemoryData(): Result<BrandMemoryNote[]> {
  const { workspace, isDemo } = useSession();
  const q = useQuery<BrandMemoryNote[]>({
    queryKey: ["memory", workspace],
    enabled: !isDemo,
    queryFn: () => getArray<BrandMemoryNote>("/api/memory", "notes"),
  });
  return {
    data: isDemo ? mock.MEMORY : q.data ?? [],
    isLoading: isDemo ? false : q.isLoading,
    isDemo,
  };
}

// Payout ledger — real workspaces read obligations created by approving
// deliverables; demo shows the sample ledger. (Entries are never marked "paid"
// without a verified payment — enforced server-side.)
export function useLedgerData(): Result<
  (LedgerEntry & { creatorName?: string; campaignName?: string })[]
> {
  const { workspace, isDemo } = useSession();
  const q = useQuery<(LedgerEntry & { creatorName?: string; campaignName?: string })[]>({
    queryKey: ["ledger", workspace],
    enabled: !isDemo,
    queryFn: () => getArray("/api/ledger", "ledger"),
  });
  return {
    data: isDemo ? mock.LEDGER : q.data ?? [],
    isLoading: isDemo ? false : q.isLoading,
    isDemo,
  };
}

export function useMarketplaceData(): Result<MarketplaceListing[]> {
  const { isDemo } = useSession();
  return { data: isDemo ? mock.MARKETPLACE : [], isLoading: false, isDemo };
}

export function useCreatorsData(): Result<CreatorProfile[]> {
  const { isDemo } = useSession();
  return { data: isDemo ? mock.CREATORS : [], isLoading: false, isDemo };
}
