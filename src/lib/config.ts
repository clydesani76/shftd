// Central runtime configuration + capability flags.
// The app is designed to run fully in DEMO MODE (mock data, mock AI) with
// zero external services, then progressively light up as keys are added.

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasMetaAds = !!process.env.META_ACCESS_TOKEN;

export const config = {
  // Demo mode is ON when explicitly set, OR whenever Supabase isn't configured.
  demoMode:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !hasSupabase,
  hasSupabase,
  // AI is "live" when either provider key is present. Anthropic is preferred.
  hasAI: hasAnthropic || hasOpenAI,
  hasAnthropic,
  hasOpenAI,
  // Meta Ad Library — pulls a competitor's real, live ads when a token is set.
  hasMetaAds,
  // Ahrefs — ground-truth SEO/backlink/traffic data for deep competitor
  // analysis. When absent, the analyzer degrades to crawl + LLM only.
  hasAhrefs: !!process.env.AHREFS_API_KEY,
  // Default market for Ahrefs organic data (ISO 3166-1 alpha-2, lowercase).
  ahrefsCountry: (process.env.AHREFS_COUNTRY || "us").toLowerCase(),
  // Our own domain, used to compute keyword/SEO gaps vs. a competitor.
  ownDomain: process.env.SHFTD_OWN_DOMAIN || "",
  hasStripe: !!process.env.STRIPE_SECRET_KEY,
  // Campaign Operator Network — surfaces operator/engagement/proposal UX.
  // On by default; approving a proposal records + audits the decision but does
  // NOT auto-execute the underlying consequential change in this first release.
  operatorNetwork: process.env.NEXT_PUBLIC_OPERATOR_NETWORK !== "false",
  // Performance-based operator compensation is intentionally gated OFF for the
  // first release (fixed / milestone fees only).
  operatorPerformanceComp: process.env.NEXT_PUBLIC_OPERATOR_PERF_COMP === "true",
  aiModel:
    process.env.SHFTD_AI_MODEL ||
    (hasAnthropic ? "claude-sonnet-4-6" : "gpt-4o-mini"),
  brand: {
    name: "SHFTD",
    positioning: "The Marketing Operating System",
    tagline: "Stop chasing trends. Start setting them.",
  },
} as const;
