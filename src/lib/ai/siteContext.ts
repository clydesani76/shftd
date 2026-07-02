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

export async function fetchSiteContext(domain?: string): Promise<SiteContext> {
  const empty: DiscoveredSignals = { socialLinks: [], detectedTech: [], siteUrl: "" };
  if (!domain) return { ok: false, url: "", text: "", discovered: empty };
  const url = normalizeUrl(domain);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
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
    if (!res.ok || !type.includes("text/html")) {
      return { ok: false, url, text: "", discovered: { ...empty, siteUrl: url } };
    }

    const html = await res.text();
    const { text, discovered } = extractSignals(html, url);
    return { ok: text.length > 40, url, text, discovered };
  } catch {
    return { ok: false, url, text: "", discovered: { ...empty, siteUrl: url } };
  }
}
