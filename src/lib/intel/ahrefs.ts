// Server-only: pull REAL, ground-truth SEO/search data from the Ahrefs API v3
// (Site Explorer) to power deep competitor analysis — organic traffic, keywords,
// top pages, backlinks, and domain rating. Requires AHREFS_API_KEY.
//
// Everything here is best-effort: any missing key, HTTP error, or timeout yields
// a null/degraded result so the analysis never hard-fails — it simply falls back
// to crawl + LLM. All numbers returned are MEASURED (not AI estimates); traffic
// value is converted from Ahrefs' USD cents to whole USD.

import type { DomainSeo, SeoComparison, SeoKeyword, SeoPage } from "@/lib/ai/types";
import { config } from "@/lib/config";

const BASE = "https://api.ahrefs.com/v3/site-explorer";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Strip protocol / path — Ahrefs wants a bare domain for a domain-mode read.
function bareDomain(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

interface CallOpts {
  params: Record<string, string>;
  timeoutMs?: number;
}

// One authenticated GET against a Site Explorer endpoint. Returns null on any
// failure (no key, non-200, timeout, parse error) — callers degrade gracefully.
async function ahrefsGet<T>(path: string, { params, timeoutMs = 9000 }: CallOpts): Promise<T | null> {
  const key = process.env.AHREFS_API_KEY;
  if (!key) return null;
  const qs = new URLSearchParams({ output: "json", ...params }).toString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${BASE}/${path}?${qs}`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const centsToUsd = (c: number | null | undefined): number | null =>
  typeof c === "number" ? Math.round(c / 100) : null;

// ── Measured SEO for a single domain ──────────────────────────
// Runs the five reads in parallel and assembles a DomainSeo. Individual reads
// that fail are simply left null.
export async function fetchDomainSeo(
  rawDomain: string,
  country = config.ahrefsCountry,
  keywordLimit = 20,
): Promise<DomainSeo | null> {
  if (!config.hasAhrefs || !rawDomain) return null;
  const target = bareDomain(rawDomain);
  if (!target) return null;
  const date = today();
  const common = { target, date, mode: "domain" as const };

  type DR = { domain_rating?: { domain_rating?: number; ahrefs_rank?: number } };
  type BL = { metrics?: { live?: number; all_time?: number; live_refdomains?: number; all_time_refdomains?: number } };
  type MX = {
    metrics?: {
      org_traffic?: number;
      org_keywords?: number;
      org_keywords_1_3?: number;
      org_cost?: number | null;
      paid_traffic?: number;
      paid_keywords?: number;
    };
  };
  type KW = {
    keywords?: {
      keyword?: string;
      volume?: number | null;
      best_position?: number | null;
      sum_traffic?: number | null;
      keyword_difficulty?: number | null;
      cpc?: number | null;
      is_branded?: boolean;
    }[];
  };
  type TP = {
    pages?: {
      url?: string | null;
      sum_traffic?: number | null;
      keywords?: number | null;
      top_keyword?: string | null;
    }[];
  };

  const [dr, bl, mx, kw, tp] = await Promise.all([
    ahrefsGet<DR>("domain-rating", { params: { target, date } }),
    ahrefsGet<BL>("backlinks-stats", { params: common }),
    ahrefsGet<MX>("metrics", { params: { ...common, country, volume_mode: "monthly" } }),
    ahrefsGet<KW>("organic-keywords", {
      params: {
        ...common,
        country,
        select: "keyword,volume,best_position,sum_traffic,keyword_difficulty,cpc,is_branded",
        order_by: "sum_traffic:desc",
        limit: String(keywordLimit),
      },
    }),
    ahrefsGet<TP>("top-pages", {
      params: {
        ...common,
        country,
        select: "url,sum_traffic,keywords,top_keyword",
        order_by: "sum_traffic:desc",
        limit: "10",
      },
    }),
  ]);

  // If literally nothing came back, treat the whole read as unavailable.
  if (!dr && !bl && !mx && !kw && !tp) return null;

  const topKeywords: SeoKeyword[] = (kw?.keywords ?? [])
    .filter((k) => k.keyword)
    .map((k) => ({
      keyword: k.keyword as string,
      volume: k.volume ?? null,
      position: k.best_position ?? null,
      traffic: k.sum_traffic ?? null,
      difficulty: k.keyword_difficulty ?? null,
      branded: k.is_branded ?? undefined,
    }));

  const topPages: SeoPage[] = (tp?.pages ?? [])
    .filter((p) => p.url)
    .map((p) => ({
      url: p.url as string,
      traffic: p.sum_traffic ?? null,
      keywords: p.keywords ?? null,
      topKeyword: p.top_keyword ?? null,
    }));

  return {
    domain: target,
    domainRating: dr?.domain_rating?.domain_rating ?? null,
    ahrefsRank: dr?.domain_rating?.ahrefs_rank ?? null,
    orgTraffic: mx?.metrics?.org_traffic ?? null,
    orgKeywords: mx?.metrics?.org_keywords ?? null,
    orgKeywordsTop3: mx?.metrics?.org_keywords_1_3 ?? null,
    orgTrafficValueUsd: centsToUsd(mx?.metrics?.org_cost),
    paidTraffic: mx?.metrics?.paid_traffic ?? null,
    paidKeywords: mx?.metrics?.paid_keywords ?? null,
    backlinks: bl?.metrics?.live ?? null,
    refDomains: bl?.metrics?.live_refdomains ?? null,
    topKeywords,
    topPages,
  };
}

// ── Competitor vs. us ─────────────────────────────────────────
// Fetches measured SEO for both domains and derives keyword gaps (terms the
// competitor ranks for among its top set that we don't) and shared keywords.
export async function fetchSeoComparison(input: {
  competitorDomain?: string;
  ourDomain?: string;
  country?: string;
}): Promise<SeoComparison> {
  const country = (input.country || config.ahrefsCountry).toLowerCase();
  const base: SeoComparison = {
    ok: false,
    country,
    competitor: null,
    ours: null,
    keywordGaps: [],
    sharedKeywords: [],
  };
  if (!config.hasAhrefs) {
    return { ...base, note: "Ahrefs not configured — SEO data unavailable." };
  }
  if (!input.competitorDomain) {
    return { ...base, note: "No competitor domain to analyze." };
  }

  const [competitor, ours] = await Promise.all([
    fetchDomainSeo(input.competitorDomain, country),
    input.ourDomain ? fetchDomainSeo(input.ourDomain, country) : Promise.resolve(null),
  ]);

  if (!competitor) {
    return { ...base, ours, note: "Ahrefs returned no data for the competitor domain." };
  }

  // Keyword gaps: within the fetched top sets, terms the competitor ranks for
  // that we don't. A genuine opening for our content/SEO.
  let keywordGaps: SeoKeyword[] = [];
  const sharedKeywords: string[] = [];
  if (ours) {
    const ourSet = new Set(ours.topKeywords.map((k) => k.keyword.toLowerCase()));
    for (const k of competitor.topKeywords) {
      if (ourSet.has(k.keyword.toLowerCase())) sharedKeywords.push(k.keyword);
      else if (!k.branded) keywordGaps.push(k);
    }
    keywordGaps = keywordGaps.slice(0, 12);
  }

  return {
    ok: true,
    country,
    competitor,
    ours,
    keywordGaps,
    sharedKeywords: sharedKeywords.slice(0, 12),
  };
}

// Compact, prompt-ready rendering of the measured SEO so the LLM reasons over
// FACTS (clearly labeled) rather than guessing metrics.
export function seoToPromptContext(seo: SeoComparison): string {
  if (!seo.ok || !seo.competitor) return "";
  const c = seo.competitor;
  const num = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString() : "n/a");
  const lines: string[] = [];
  lines.push(
    `MEASURED SEO (Ahrefs, ${seo.country.toUpperCase()}) — treat as VERIFIED FACT, not estimate:`,
  );
  lines.push(
    `Competitor ${c.domain}: Domain Rating ${num(c.domainRating)}, ~${num(c.orgTraffic)} monthly organic visits, ${num(c.orgKeywords)} ranking keywords (${num(c.orgKeywordsTop3)} in top 3), est. traffic value $${num(c.orgTrafficValueUsd)}/mo, ${num(c.backlinks)} backlinks from ${num(c.refDomains)} referring domains. Paid: ~${num(c.paidTraffic)} visits across ${num(c.paidKeywords)} paid keywords.`,
  );
  if (c.topKeywords.length) {
    lines.push(
      `Their top organic keywords: ${c.topKeywords
        .slice(0, 12)
        .map((k) => `"${k.keyword}" (#${k.position ?? "?"}, vol ${num(k.volume)})`)
        .join(", ")}.`,
    );
  }
  if (c.topPages.length) {
    lines.push(
      `Their top traffic pages: ${c.topPages
        .slice(0, 6)
        .map((p) => `${p.url} (~${num(p.traffic)} visits${p.topKeyword ? `, "${p.topKeyword}"` : ""})`)
        .join(" | ")}.`,
    );
  }
  if (seo.ours) {
    const o = seo.ours;
    lines.push(
      `Us (${o.domain}): Domain Rating ${num(o.domainRating)}, ~${num(o.orgTraffic)} organic visits, ${num(o.orgKeywords)} keywords, ${num(o.refDomains)} referring domains.`,
    );
  }
  if (seo.keywordGaps.length) {
    lines.push(
      `KEYWORD GAPS (they rank, we don't — our openings): ${seo.keywordGaps
        .map((k) => `"${k.keyword}" (vol ${num(k.volume)}, KD ${k.difficulty ?? "?"})`)
        .join(", ")}.`,
    );
  }
  return lines.join("\n");
}
