// Server-only: pull a competitor's REAL, currently/previously running ads from
// the official Meta Ad Library API (graph.facebook.com/ads_archive). Requires a
// META_ACCESS_TOKEN (see the setup walkthrough). Best-effort: returns [] on any
// error, missing token, or empty result so the analysis never hard-fails.
//
// Coverage note: for ad_type=ALL, Meta returns the richest data for ads
// delivered in the EU (Digital Services Act transparency). Elsewhere results
// can be sparse. We surface exactly what the API returns, labeled as real.

import type { CompetitorLiveAd } from "@/lib/ai/types";

interface AdArchiveRow {
  id: string;
  page_name?: string;
  ad_snapshot_url?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time?: string;
  publisher_platforms?: string[];
}

const API = "https://graph.facebook.com/v21.0/ads_archive";
const FIELDS = [
  "id",
  "page_name",
  "ad_snapshot_url",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_delivery_start_time",
  "publisher_platforms",
].join(",");

export interface FetchAdsInput {
  brandName: string;
  limit?: number;
}

export async function fetchMetaAds({
  brandName,
  limit = 12,
}: FetchAdsInput): Promise<CompetitorLiveAd[]> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token || !brandName.trim()) return [];

  // Countries the ads reached. Comma-separated env, e.g. "US,GB,DE".
  const countries = (process.env.META_AD_COUNTRY || "US")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const params = new URLSearchParams({
    access_token: token,
    ad_type: "ALL",
    ad_active_status: "ALL",
    search_terms: brandName,
    ad_reached_countries: JSON.stringify(countries),
    fields: FIELDS,
    limit: String(Math.min(Math.max(limit, 1), 25)),
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(`${API}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = (await res.json()) as {
      data?: AdArchiveRow[];
      error?: { message?: string };
    };
    if (!res.ok || json.error || !Array.isArray(json.data)) return [];

    return json.data.map((r) => ({
      id: r.id,
      pageName: r.page_name ?? brandName,
      snapshotUrl: r.ad_snapshot_url ?? "",
      body: (r.ad_creative_bodies ?? []).join(" ").slice(0, 400),
      title: (r.ad_creative_link_titles ?? [])[0],
      startDate: r.ad_delivery_start_time,
      platforms: r.publisher_platforms ?? [],
    }));
  } catch {
    return [];
  }
}
