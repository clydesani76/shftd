// Central runtime configuration + capability flags.
// The app is designed to run fully in DEMO MODE (mock data, mock AI) with
// zero external services, then progressively light up as keys are added.

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

export const config = {
  // Demo mode is ON when explicitly set, OR whenever Supabase isn't configured.
  demoMode:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !hasSupabase,
  hasSupabase,
  // AI providers. Anthropic is preferred when present (see src/lib/ai/index.ts).
  hasAnthropic,
  hasAI: !!process.env.OPENAI_API_KEY,
  hasStripe: !!process.env.STRIPE_SECRET_KEY,
  // Single model override used by whichever provider is active. Defaults to
  // claude-sonnet-4-6 when Anthropic is configured, else gpt-4o-mini.
  aiModel:
    process.env.SHFTD_AI_MODEL ||
    (hasAnthropic ? "claude-sonnet-4-6" : "gpt-4o-mini"),
  brand: {
    name: "SHFTD",
    positioning: "The Marketing Operating System",
    tagline: "Stop chasing trends. Start setting them.",
  },
} as const;
