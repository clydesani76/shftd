// Server-only: fetch a competitor's homepage and extract readable context to
// ground the AI analysis in REAL page content (title, meta description, visible
// text) rather than the model's memory alone. Best-effort — any failure (bad
// domain, timeout, non-HTML, blocked) returns an empty result and the analysis
// proceeds without it, clearly labeled in the report's `sources`.

export interface SiteContext {
  ok: boolean;
  url: string;
  text: string;
}

function normalizeUrl(domain: string): string {
  const d = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `https://${d}`;
}

// Very small HTML → text reducer. Pulls the <title> and meta description, then
// strips tags/scripts/styles from the body and collapses whitespace.
function extractReadable(html: string): string {
  const pick = (re: RegExp) => (html.match(re)?.[1] ?? "").trim();
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc = pick(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  const ogDesc = pick(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  );

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return [
    title && `TITLE: ${title}`,
    (desc || ogDesc) && `DESCRIPTION: ${desc || ogDesc}`,
    body && `PAGE TEXT: ${body}`,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);
}

export async function fetchSiteContext(domain?: string): Promise<SiteContext> {
  if (!domain) return { ok: false, url: "", text: "" };
  const url = normalizeUrl(domain);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
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
      return { ok: false, url, text: "" };
    }

    const html = await res.text();
    const text = extractReadable(html);
    return { ok: text.length > 40, url, text };
  } catch {
    return { ok: false, url, text: "" };
  }
}
