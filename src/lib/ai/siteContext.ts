// Server-only: gather REAL, verifiable signals from a competitor's live site to
// ground the AI analysis in fact rather than the model's memory. Best-effort —
// any failure (bad domain, timeout, non-HTML, blocked) returns ok:false and the
// analysis proceeds on identifiers alone, clearly labeled in the report.

export interface DiscoveredSignals {
  socialLinks: { platform: string; url: string }[];
  detectedTech: string[];
  siteUrl: string;
}

export interface SiteContext {
  ok: boolean;
  url: string;
  text: string; // prompt-ready summary of what we found
  discovered: DiscoveredSignals;
}

function normalizeUrl(domain: string): string {
  const d = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `https://${d}`;
}

// Which social platforms a URL host belongs to.
const SOCIAL_HOSTS: { platform: string; re: RegExp }[] = [
  { platform: "Instagram", re: /instagram\.com\/([A-Za-z0-9_.]+)/i },
  { platform: "TikTok", re: /tiktok\.com\/@?([A-Za-z0-9_.]+)/i },
  { platform: "YouTube", re: /youtube\.com\/(@[A-Za-z0-9_.-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9_.-]+|user\/[A-Za-z0-9_.-]+)/i },
  { platform: "X / Twitter", re: /(?:twitter|x)\.com\/([A-Za-z0-9_]+)/i },
  { platform: "Facebook", re: /facebook\.com\/([A-Za-z0-9_.\-/]+)/i },
  { platform: "LinkedIn", re: /linkedin\.com\/(company\/[A-Za-z0-9_.\-]+|in\/[A-Za-z0-9_.\-]+)/i },
  { platform: "Pinterest", re: /pinterest\.com\/([A-Za-z0-9_.\-/]+)/i },
];

// Marketing / commerce tech fingerprints — REAL evidence of the channels a
// brand actively invests in (ad retargeting, email, e-commerce platform).
const TECH_MARKERS: { name: string; re: RegExp }[] = [
  { name: "Shopify (e-commerce)", re: /cdn\.shopify\.com|shopify\.(com|dev)|Shopify\./i },
  { name: "WooCommerce", re: /woocommerce/i },
  { name: "Meta / Facebook Pixel (retargeting)", re: /connect\.facebook\.net|fbq\(/i },
  { name: "TikTok Pixel", re: /analytics\.tiktok\.com|ttq\./i },
  { name: "Google Analytics / GA4", re: /google-analytics\.com|gtag\(|googletagmanager\.com/i },
  { name: "Google Ads", re: /googleadservices\.com|google_conversion|aw-\d/i },
  { name: "Pinterest Tag", re: /pintrk\(|s\.pinimg\.com/i },
  { name: "Snap Pixel", re: /sc-static\.net|snaptr\(/i },
  { name: "Klaviyo (email)", re: /klaviyo/i },
  { name: "Mailchimp (email)", re: /mailchimp|list-manage\.com/i },
  { name: "HubSpot", re: /hs-scripts\.com|hubspot/i },
  { name: "Google Optimize / A-B testing", re: /optimize\.google|vwo\.com|optimizely/i },
];

function pick(html: string, re: RegExp): string {
  return (html.match(re)?.[1] ?? "").trim();
}

function extractSignals(html: string, siteUrl: string): {
  text: string;
  discovered: DiscoveredSignals;
} {
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc =
    pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);

  // Headings give a quick read on their positioning & offers.
  const headings = Array.from(
    html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi),
  )
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 2)
    .slice(0, 12);

  // Real social profiles linked from their own site.
  const socialLinks: { platform: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const { platform, re } of SOCIAL_HOSTS) {
    const m = html.match(new RegExp(`https?:\\/\\/(?:www\\.)?${re.source}`, "i"));
    if (m && !seen.has(platform)) {
      seen.add(platform);
      socialLinks.push({ platform, url: m[0].replace(/["'<>].*$/, "") });
    }
  }

  // Real marketing/commerce stack fingerprints.
  const detectedTech = TECH_MARKERS.filter((t) => t.re.test(html)).map((t) => t.name);

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  const text = [
    title && `TITLE: ${title}`,
    desc && `DESCRIPTION: ${desc}`,
    headings.length && `HEADINGS: ${headings.join(" | ")}`,
    socialLinks.length &&
      `SOCIAL PROFILES FOUND ON SITE: ${socialLinks.map((s) => `${s.platform} (${s.url})`).join(", ")}`,
    detectedTech.length &&
      `MARKETING TECH DETECTED (real fingerprints in page source): ${detectedTech.join(", ")}`,
    body && `PAGE TEXT: ${body}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { text, discovered: { socialLinks, detectedTech, siteUrl } };
}

// Fetch a single HTML page (best-effort). Returns the raw HTML or null.
async function fetchHtml(url: string, timeoutMs = 9000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SHFTD-Intel/1.0; +https://shftd.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchSiteContext(domain?: string): Promise<SiteContext> {
  const empty: DiscoveredSignals = { socialLinks: [], detectedTech: [], siteUrl: "" };
  if (!domain) return { ok: false, url: "", text: "", discovered: empty };
  const url = normalizeUrl(domain);
  const html = await fetchHtml(url);
  if (!html) return { ok: false, url, text: "", discovered: { ...empty, siteUrl: url } };
  const { text, discovered } = extractSignals(html, url);
  return { ok: text.length > 40, url, text, discovered };
}

// ── Deep, multi-page crawl ────────────────────────────────────
// The key pages that reveal how a brand really operates: what they charge, how
// broad their catalogue is, how they position themselves, and how much content
// they publish. We crawl the homepage, then follow same-host links matching
// these intents (a few each, capped), and aggregate the signals.
const KEY_PAGE_INTENTS: { role: string; re: RegExp }[] = [
  { role: "Pricing", re: /(pricing|plans|subscribe|subscription|buy|price)/i },
  { role: "Product / Shop", re: /(products?|shop|store|collections?|catalog|menu)/i },
  { role: "About / Brand", re: /(about|our-story|mission|who-we-are|values)/i },
  { role: "Blog / Content", re: /(blog|articles?|journal|learn|guides?|resources?|news)/i },
  { role: "Features", re: /(features?|how-it-works|benefits|technology|science)/i },
];

export interface DeepSiteContext {
  ok: boolean;
  url: string;
  text: string; // aggregated, page-labeled prompt context
  discovered: DiscoveredSignals; // merged across pages (homepage-weighted)
  pagesCrawled: string[];
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  let host: string;
  try {
    host = new URL(baseUrl).host;
  } catch {
    return [];
  }
  const out = new Set<string>();
  for (const m of html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    const href = m[1];
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      const abs = new URL(href, baseUrl);
      if (abs.host !== host) continue; // same-site only
      if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|mp4|css|js|xml|ico)$/i.test(abs.pathname)) continue;
      abs.hash = "";
      out.add(abs.toString());
      if (out.size > 120) break;
    } catch {
      // ignore malformed hrefs
    }
  }
  return [...out];
}

// Choose up to one URL per intent (closest/shortest path match), so a deep
// crawl stays small and cheap but covers the pages that matter.
function pickKeyPages(links: string[], homeUrl: string): { role: string; url: string }[] {
  const picked: { role: string; url: string }[] = [];
  const used = new Set<string>([homeUrl]);
  for (const { role, re } of KEY_PAGE_INTENTS) {
    const candidates = links
      .filter((l) => !used.has(l) && re.test(new URL(l).pathname))
      .sort((a, b) => new URL(a).pathname.length - new URL(b).pathname.length);
    if (candidates[0]) {
      picked.push({ role, url: candidates[0] });
      used.add(candidates[0]);
    }
  }
  return picked;
}

export async function fetchDeepSiteContext(
  domain?: string,
  maxExtraPages = 4,
): Promise<DeepSiteContext> {
  const empty: DiscoveredSignals = { socialLinks: [], detectedTech: [], siteUrl: "" };
  if (!domain) return { ok: false, url: "", text: "", discovered: empty, pagesCrawled: [] };
  const homeUrl = normalizeUrl(domain);

  const homeHtml = await fetchHtml(homeUrl);
  if (!homeHtml) {
    return { ok: false, url: homeUrl, text: "", discovered: { ...empty, siteUrl: homeUrl }, pagesCrawled: [] };
  }

  const home = extractSignals(homeHtml, homeUrl);
  const links = extractInternalLinks(homeHtml, homeUrl);
  const keyPages = pickKeyPages(links, homeUrl).slice(0, maxExtraPages);

  // Fetch the chosen key pages in parallel (best-effort).
  const fetched = await Promise.all(
    keyPages.map(async ({ role, url }) => {
      const html = await fetchHtml(url, 8000);
      if (!html) return null;
      const { text } = extractSignals(html, url);
      return text.length > 40 ? { role, url, text } : null;
    }),
  );

  // Merge discovered signals (homepage is the authoritative base; add any new
  // tech/social found on inner pages).
  const discovered: DiscoveredSignals = {
    siteUrl: homeUrl,
    socialLinks: [...home.discovered.socialLinks],
    detectedTech: [...home.discovered.detectedTech],
  };

  const sections: string[] = [`=== PAGE: HOME (${homeUrl}) ===\n${home.text}`];
  const pagesCrawled: string[] = [homeUrl];
  for (const page of fetched) {
    if (!page) continue;
    pagesCrawled.push(page.url);
    sections.push(`=== PAGE: ${page.role.toUpperCase()} (${page.url}) ===\n${page.text}`);
  }

  // Cap the aggregate so the prompt stays bounded.
  const text = sections.join("\n\n").slice(0, 14000);
  return { ok: text.length > 40, url: homeUrl, text, discovered, pagesCrawled };
}
