// ─────────────────────────────────────────────────────────────
// SHFTD mock dataset
// Drives the entire demo when DEMO MODE is on (no Supabase required).
// Realistic, cross-referenced data so every page feels alive.
// Example brand: "Nova Hydration" — a DTC functional-beverage startup.
// ─────────────────────────────────────────────────────────────

import type {
  AppUser,
  BrandMemoryNote,
  BusinessProfile,
  Campaign,
  CampaignApplication,
  CampaignMetrics,
  Competitor,
  CopyVariant,
  CreatorProfile,
  Evidence,
  Insight,
  LedgerEntry,
  MarketplaceListing,
  Org,
  StrategyRecommendation,
  Submission,
} from "@/types";

const now = Date.parse("2026-06-20T12:00:00Z");
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

// ── Org & users ───────────────────────────────────────────────
export const ORG: Org = {
  id: "org_nova",
  name: "Nova Hydration",
  slug: "nova-hydration",
  industry: "DTC Functional Beverages",
  website: "novahydration.com",
  createdAt: daysAgo(210),
};

export const BUSINESS_PROFILE: BusinessProfile = {
  id: "bp_nova",
  orgId: ORG.id,
  brandVoice: "Energetic, science-backed, a little rebellious. Speaks to ambitious people who refuse to feel sluggish.",
  targetAudience: "25–40 urban professionals & athletes who optimize their performance and distrust sugary energy drinks.",
  primaryGoals: ["Grow DTC revenue", "Lower CAC", "Build brand category leadership"],
  monthlyBudget: 60000,
  channels: ["Instagram", "TikTok", "YouTube", "Email", "Paid Search"],
};

export const USERS: AppUser[] = [
  {
    id: "user_business",
    email: "founder@novahydration.com",
    fullName: "Maya Okafor",
    role: "business",
    orgId: ORG.id,
    createdAt: daysAgo(210),
  },
  {
    id: "user_creator",
    email: "creator@example.com",
    fullName: "Devon Reyes",
    role: "creator",
    orgId: null,
    createdAt: daysAgo(120),
  },
  {
    id: "user_admin",
    email: "admin@shftd.app",
    fullName: "SHFTD Admin",
    role: "admin",
    orgId: ORG.id,
    createdAt: daysAgo(300),
  },
];

// ── Creators ──────────────────────────────────────────────────
export const CREATORS: CreatorProfile[] = [
  {
    id: "cr_devon",
    userId: "user_creator",
    name: "Devon Reyes",
    niches: ["Fitness", "Productivity", "Wellness"],
    socialHandles: [
      { platform: "TikTok", handle: "@devonmoves", followers: 184000 },
      { platform: "Instagram", handle: "@devon.reyes", followers: 96000 },
    ],
    trustScore: 92,
    totalEarnings: 48200,
    completedCampaigns: 14,
    avgEngagementRate: 6.4,
    roles: ["igniter", "amplifier"],
    bio: "Ex-D1 athlete turned creator. I make performance content that converts.",
  },
  {
    id: "cr_lena",
    userId: "user_lena",
    name: "Lena Park",
    niches: ["Beauty", "Wellness", "Lifestyle"],
    socialHandles: [
      { platform: "Instagram", handle: "@lenaparkco", followers: 312000 },
      { platform: "YouTube", handle: "Lena Park", followers: 140000 },
    ],
    trustScore: 88,
    totalEarnings: 71500,
    completedCampaigns: 22,
    avgEngagementRate: 4.9,
    roles: ["amplifier", "closer"],
    bio: "Storytelling-first creator. I turn products into rituals.",
  },
  {
    id: "cr_marco",
    userId: "user_marco",
    name: "Marco Ling",
    niches: ["Tech", "Biohacking", "Finance"],
    socialHandles: [
      { platform: "YouTube", handle: "Marco Ling", followers: 420000 },
      { platform: "TikTok", handle: "@marcobiohacks", followers: 230000 },
    ],
    trustScore: 95,
    totalEarnings: 102300,
    completedCampaigns: 31,
    avgEngagementRate: 5.7,
    roles: ["igniter", "closer"],
    bio: "Data-driven reviews. My audience buys what I test.",
  },
  {
    id: "cr_aisha",
    userId: "user_aisha",
    name: "Aisha Bello",
    niches: ["Wellness", "Mindfulness", "Lifestyle"],
    socialHandles: [
      { platform: "Instagram", handle: "@aisha.wellness", followers: 88000 },
      { platform: "TikTok", handle: "@aishabello", followers: 154000 },
    ],
    trustScore: 81,
    totalEarnings: 23400,
    completedCampaigns: 9,
    avgEngagementRate: 7.2,
    roles: ["amplifier"],
    bio: "Calm, relatable wellness content with sky-high engagement.",
  },
];

// ── Competitive Intelligence ──────────────────────────────────
export const COMPETITORS: Competitor[] = [
  {
    id: "comp_pulse",
    orgId: ORG.id,
    brandName: "Pulse Electrolytes",
    domain: "pulsehydration.com",
    socialHandle: "@drinkpulse",
    category: "Hydration / Electrolytes",
    addedAt: daysAgo(45),
  },
  {
    id: "comp_voltaid",
    orgId: ORG.id,
    brandName: "Voltaid",
    domain: "voltaid.co",
    socialHandle: "@voltaid",
    category: "Energy / Performance",
    addedAt: daysAgo(38),
  },
  {
    id: "comp_clearco",
    orgId: ORG.id,
    brandName: "ClearCo Water",
    domain: "clearco.com",
    socialHandle: "@clearco",
    category: "Functional Water",
    addedAt: daysAgo(20),
  },
];

export const EVIDENCE: Evidence[] = [
  {
    id: "ev_1",
    competitorId: "comp_pulse",
    type: "hook",
    channel: "TikTok",
    content: "\"I stopped drinking coffee for 30 days and replaced it with this...\" — POV transformation hook driving 2.1M views.",
    sourceUrl: "https://tiktok.com/@drinkpulse/video/example",
    capturedAt: daysAgo(12),
  },
  {
    id: "ev_2",
    competitorId: "comp_pulse",
    type: "offer",
    channel: "Landing Page",
    content: "Subscribe & save 25% + free shaker on first order. Strong urgency banner: 'Ships today if ordered in 3h'.",
    capturedAt: daysAgo(14),
  },
  {
    id: "ev_3",
    competitorId: "comp_voltaid",
    type: "ad",
    channel: "Instagram",
    content: "Heavy use of 'clean energy, zero crash' messaging with split-screen before/after energy graphs.",
    capturedAt: daysAgo(9),
  },
  {
    id: "ev_4",
    competitorId: "comp_voltaid",
    type: "caption",
    channel: "Instagram",
    content: "Overused: every post opens with 'Did you know...' factoid format. Engagement declining over last 6 weeks.",
    capturedAt: daysAgo(7),
  },
  {
    id: "ev_5",
    competitorId: "comp_clearco",
    type: "campaign",
    channel: "YouTube",
    content: "Long-form 'a day in the life of a founder' integrations. Authentic but low frequency — only 2 in 90 days.",
    capturedAt: daysAgo(5),
  },
  {
    id: "ev_6",
    competitorId: "comp_clearco",
    type: "cta",
    channel: "Email",
    content: "CTA: 'Join the 50,000 who switched.' Social proof anchored CTA, no functional/benefit angle.",
    capturedAt: daysAgo(4),
  },
];

export const INSIGHTS: Insight[] = [
  {
    id: "ins_winning_1",
    orgId: ORG.id,
    category: "winning_pattern",
    title: "POV transformation hooks dominate short-form",
    explanation:
      "Competitors using first-person '30-day swap' transformation hooks on TikTok are seeing 3–5x the views of standard product demos. The narrative invites the viewer to imagine their own outcome.",
    recommendation:
      "Build an Igniter-led TikTok series around a 30-day swap challenge. Lead with personal transformation, not product specs.",
    channel: "TikTok",
    confidence: 86,
    evidenceIds: ["ev_1"],
    createdAt: daysAgo(11),
  },
  {
    id: "ins_winning_2",
    orgId: ORG.id,
    category: "winning_pattern",
    title: "Subscribe-and-save + free accessory lifts AOV",
    explanation:
      "Pulse pairs a 25% subscription discount with a free shaker and aggressive ship-time urgency. This bundles habit formation with a tangible gift.",
    recommendation:
      "Test a 'first-order ritual kit' (free bottle) tied to subscription. Mirror the urgency banner on the landing page.",
    channel: "Landing Page",
    confidence: 79,
    evidenceIds: ["ev_2", "ev_6"],
    createdAt: daysAgo(10),
  },
  {
    id: "ins_overused_1",
    orgId: ORG.id,
    category: "overused_angle",
    title: "'Clean energy, zero crash' is saturated",
    explanation:
      "Voltaid and three other category players all anchor on identical 'clean energy / zero crash' language. The phrase no longer differentiates and engagement is declining.",
    recommendation:
      "Avoid 'zero crash' as a primary hook. If used, subvert it ('crashes are fine — staying flat all day is the real problem').",
    channel: "Instagram",
    confidence: 83,
    evidenceIds: ["ev_3", "ev_4"],
    createdAt: daysAgo(8),
  },
  {
    id: "ins_whitespace_1",
    orgId: ORG.id,
    category: "white_space",
    title: "No competitor owns the 'afternoon slump' moment",
    explanation:
      "Category messaging targets mornings and workouts. Nobody has claimed the 2–4pm cognitive slump — a high-intent, daily, emotionally relatable moment for the target audience.",
    recommendation:
      "Originate a 'Beat the 3PM Wall' movement. Own a daily moment competitors ignore. High first-mover potential.",
    channel: "Multi-channel",
    confidence: 74,
    evidenceIds: ["ev_4", "ev_5"],
    createdAt: daysAgo(6),
  },
  {
    id: "ins_whitespace_2",
    orgId: ORG.id,
    category: "white_space",
    title: "Long-form founder storytelling is under-used",
    explanation:
      "ClearCo's rare long-form founder integrations perform well but run only twice a quarter. The format is wide open at higher frequency.",
    recommendation:
      "Pair an Amplifier creator with the founder for a recurring long-form series. Low competition, high trust-building.",
    channel: "YouTube",
    confidence: 68,
    evidenceIds: ["ev_5"],
    createdAt: daysAgo(5),
  },
];

// ── Strategy recommendations ──────────────────────────────────
export const RECOMMENDATIONS: StrategyRecommendation[] = [
  {
    id: "rec_proven_1",
    orgId: ORG.id,
    insightId: "ins_winning_1",
    path: "proven",
    title: "The 30-Day Coffee Swap Challenge",
    concept:
      "Recruit Igniter creators to document swapping their morning coffee for Nova for 30 days, using proven POV transformation hooks already winning in-category.",
    rationale:
      "POV transformation hooks are demonstrably driving 3–5x views for competitors right now. This is a low-risk, pattern-matched play with predictable performance.",
    riskLevel: "low",
    expectedUpside: "Predictable reach lift; strong cold-traffic top-of-funnel. Est. 1.5–2.5M views.",
    platforms: ["TikTok", "Instagram"],
    creatorRoles: ["igniter", "amplifier"],
    kpis: ["Views", "Hook retention %", "Profile visits", "CTR to landing"],
    budgetSplit: [
      { label: "Igniter creators", percent: 50 },
      { label: "Amplifier creators", percent: 25 },
      { label: "Performance bonus pool", percent: 25 },
    ],
    createdAt: daysAgo(9),
  },
  {
    id: "rec_original_1",
    orgId: ORG.id,
    insightId: "ins_whitespace_1",
    path: "original",
    title: "Beat the 3PM Wall — A Daily Movement",
    concept:
      "Originate and own the 'afternoon slump' moment with a daily ritual movement. Creators post a synchronized 3PM check-in; brand builds a recurring cultural beat no competitor owns.",
    rationale:
      "White-space analysis shows no competitor owns the 2–4pm cognitive slump — a daily, high-intent, emotionally relatable moment. First-mover advantage could define the category beat others copy.",
    riskLevel: "high",
    expectedUpside: "Category ownership of a daily moment; compounding UGC; defensible brand association. Higher variance.",
    platforms: ["TikTok", "Instagram", "YouTube"],
    creatorRoles: ["igniter", "amplifier", "closer"],
    kpis: ["Branded hashtag volume", "Repeat UGC", "Search lift for 'afternoon slump'", "Conversions"],
    budgetSplit: [
      { label: "Igniter (movement seed)", percent: 40 },
      { label: "Amplifier (scale)", percent: 30 },
      { label: "Closer (conversion)", percent: 15 },
      { label: "Performance bonus pool", percent: 15 },
    ],
    createdAt: daysAgo(6),
  },
];

// ── Campaigns ─────────────────────────────────────────────────
export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp_swap",
    orgId: ORG.id,
    recommendationId: "rec_proven_1",
    name: "30-Day Coffee Swap Challenge",
    goal: "Drive 2M top-of-funnel views and 1,500 first orders",
    path: "proven",
    status: "live",
    narrativeAngle: "Personal transformation: 'what happened when I swapped coffee for Nova for 30 days'",
    targetAudience: "25–40 professionals reliant on coffee who feel afternoon crashes",
    offer: "First-order ritual kit (free bottle) + subscribe & save 25%",
    deliverables: ["1x 30–45s TikTok", "3x IG Stories", "1x IG Reel recap"],
    platforms: ["TikTok", "Instagram"],
    creatorInstructions:
      "Lead with a first-person POV hook in the first 2 seconds. Show the swap moment. Be honest about days 1–3 being hard. End with a soft CTA to the ritual kit.",
    timelineStart: daysAgo(20),
    timelineEnd: daysAgo(-10),
    kpis: ["Views", "Hook retention %", "CTR to landing", "First orders"],
    budget: 24000,
    basePayPool: 14000,
    performanceBonusPool: 10000,
    createdAt: daysAgo(20),
  },
  {
    id: "camp_3pm",
    orgId: ORG.id,
    recommendationId: "rec_original_1",
    name: "Beat the 3PM Wall",
    goal: "Establish brand ownership of the afternoon-slump moment",
    path: "original",
    status: "published",
    narrativeAngle: "A daily movement: everyone hits the wall at 3PM — here's the ritual that beats it",
    targetAudience: "Urban professionals & creatives who experience daily cognitive slumps",
    offer: "Join the 3PM Club — early access + member pricing",
    deliverables: ["1x movement-seed video", "Daily 3PM check-in series", "1x conversion-focused post"],
    platforms: ["TikTok", "Instagram", "YouTube"],
    creatorInstructions:
      "Post your real 3PM moment. Make it a ritual, not an ad. Use #Beat3PM. Igniters seed the idea, Amplifiers scale it, Closers tie it to the offer.",
    timelineStart: daysAgo(2),
    timelineEnd: daysAgo(-40),
    kpis: ["#Beat3PM volume", "Repeat UGC", "Search lift", "Conversions"],
    budget: 36000,
    basePayPool: 20000,
    performanceBonusPool: 16000,
    createdAt: daysAgo(4),
  },
  {
    id: "camp_founder",
    orgId: ORG.id,
    name: "Founder Story Long-Form Series",
    goal: "Build brand trust via recurring founder storytelling",
    path: "original",
    status: "draft",
    narrativeAngle: "Why I built Nova after burning out — recurring founder series",
    targetAudience: "Brand-curious YouTube audiences who value authenticity",
    offer: "N/A — trust-building, top of funnel",
    deliverables: ["1x 8–12 min YouTube integration / month"],
    platforms: ["YouTube"],
    creatorInstructions: "Co-create with founder. Long-form, authentic, no hard sell.",
    timelineStart: daysAgo(-5),
    timelineEnd: daysAgo(-95),
    kpis: ["Watch time", "Subscriber lift", "Brand search"],
    budget: 18000,
    basePayPool: 14000,
    performanceBonusPool: 4000,
    createdAt: daysAgo(3),
  },
  {
    id: "camp_q1",
    orgId: ORG.id,
    name: "Q1 New Year Reset",
    goal: "Capitalize on Jan resolution intent",
    path: "proven",
    status: "completed",
    narrativeAngle: "New year, no crash — reset your energy",
    targetAudience: "Resolution-driven buyers",
    offer: "New Year bundle 30% off",
    deliverables: ["TikTok + IG Reels"],
    platforms: ["TikTok", "Instagram"],
    creatorInstructions: "Resolution framing, fresh-start energy.",
    timelineStart: daysAgo(170),
    timelineEnd: daysAgo(140),
    kpis: ["Conversions", "ROAS"],
    budget: 30000,
    basePayPool: 18000,
    performanceBonusPool: 12000,
    createdAt: daysAgo(175),
  },
];

export const MARKETPLACE: MarketplaceListing[] = [
  {
    id: "mk_swap",
    campaignId: "camp_swap",
    isOpen: true,
    rolesNeeded: ["igniter", "amplifier"],
    payRange: { min: 800, max: 2500 },
    publishedAt: daysAgo(19),
  },
  {
    id: "mk_3pm",
    campaignId: "camp_3pm",
    isOpen: true,
    rolesNeeded: ["igniter", "amplifier", "closer"],
    payRange: { min: 1000, max: 4000 },
    publishedAt: daysAgo(2),
  },
];

export const APPLICATIONS: CampaignApplication[] = [
  {
    id: "app_1",
    campaignId: "camp_swap",
    creatorId: "cr_devon",
    role: "igniter",
    status: "accepted",
    pitch: "Ex-athlete, my audience trusts performance swaps. I'll document the real first-week struggle.",
    appliedAt: daysAgo(18),
  },
  {
    id: "app_2",
    campaignId: "camp_swap",
    creatorId: "cr_aisha",
    role: "amplifier",
    status: "accepted",
    pitch: "My wellness audience over-indexes on afternoon energy content. 7.2% engagement.",
    appliedAt: daysAgo(17),
  },
  {
    id: "app_3",
    campaignId: "camp_3pm",
    creatorId: "cr_marco",
    role: "igniter",
    status: "invited",
    pitch: "Data-driven framing of the 3PM cognitive dip — my audience loves the science angle.",
    appliedAt: daysAgo(1),
  },
  {
    id: "app_4",
    campaignId: "camp_3pm",
    creatorId: "cr_lena",
    role: "closer",
    status: "applied",
    pitch: "I turn movements into rituals and rituals into purchases.",
    appliedAt: daysAgo(1),
  },
];

export const SUBMISSIONS: Submission[] = [
  {
    id: "sub_1",
    campaignId: "camp_swap",
    creatorId: "cr_devon",
    contentUrl: "https://tiktok.com/@devonmoves/video/swap-day1",
    note: "Day 1 hook video. Leaned into the honest 'this is hard' angle per brief.",
    status: "approved",
    reviewerNote: "Love the hook. Approved — strong retention.",
    submittedAt: daysAgo(14),
  },
  {
    id: "sub_2",
    campaignId: "camp_swap",
    creatorId: "cr_aisha",
    contentUrl: "https://instagram.com/reel/swap-recap",
    note: "Reel recap of week 1.",
    status: "revision_requested",
    reviewerNote: "Great energy — can you make the CTA to the ritual kit clearer in the last 3s?",
    submittedAt: daysAgo(9),
  },
  {
    id: "sub_3",
    campaignId: "camp_swap",
    creatorId: "cr_devon",
    contentUrl: "https://instagram.com/stories/swap-update",
    note: "Stories set, mid-challenge update.",
    status: "submitted",
    submittedAt: daysAgo(3),
  },
];

// ── Copy variants ─────────────────────────────────────────────
export const COPY_VARIANTS: CopyVariant[] = [
  {
    id: "cp_1",
    orgId: ORG.id,
    campaignId: "camp_swap",
    type: "hook",
    platform: "TikTok",
    tone: "Bold",
    content: "I quit coffee for 30 days. Day 3 nearly broke me — then everything changed.",
    score: 91,
    createdAt: daysAgo(15),
  },
  {
    id: "cp_2",
    orgId: ORG.id,
    campaignId: "camp_swap",
    type: "hook",
    platform: "TikTok",
    tone: "Curious",
    content: "Nobody tells you what happens to your energy when you swap coffee for this.",
    score: 84,
    createdAt: daysAgo(15),
  },
  {
    id: "cp_3",
    orgId: ORG.id,
    campaignId: "camp_3pm",
    type: "caption",
    platform: "Instagram",
    tone: "Rebellious",
    content: "3PM doesn't have to win. Join the people who refuse to flatline at their desks. #Beat3PM",
    score: 88,
    createdAt: daysAgo(2),
  },
  {
    id: "cp_4",
    orgId: ORG.id,
    type: "cta",
    platform: "Landing Page",
    tone: "Confident",
    content: "Start your ritual kit — free bottle, first order ships today.",
    score: 79,
    createdAt: daysAgo(7),
  },
];

// ── Ledger ────────────────────────────────────────────────────
export const LEDGER: LedgerEntry[] = [
  { id: "le_1", campaignId: "camp_swap", creatorId: "cr_devon", type: "base_pay", amount: 2000, status: "paid", note: "Igniter base", createdAt: daysAgo(14) },
  { id: "le_2", campaignId: "camp_swap", creatorId: "cr_devon", type: "performance_bonus", amount: 1200, status: "approved", note: "Hit 1M views", createdAt: daysAgo(6) },
  { id: "le_3", campaignId: "camp_swap", creatorId: "cr_aisha", type: "base_pay", amount: 1200, status: "paid", note: "Amplifier base", createdAt: daysAgo(13) },
  { id: "le_4", campaignId: "camp_swap", creatorId: "cr_aisha", type: "performance_bonus", amount: 0, status: "pending", note: "Pending revision approval", createdAt: daysAgo(3) },
  { id: "le_5", campaignId: "camp_3pm", creatorId: "cr_marco", type: "base_pay", amount: 2500, status: "pending", note: "Igniter base (invited)", createdAt: daysAgo(1) },
];

// ── Metrics ───────────────────────────────────────────────────
export const METRICS: CampaignMetrics[] = [
  {
    id: "m_swap",
    campaignId: "camp_swap",
    views: 1840000,
    engagement: 132000,
    clicks: 41000,
    ctr: 2.2,
    conversions: 1280,
    revenue: 89600,
    cac: 18.75,
    roas: 3.73,
    recordedAt: daysAgo(1),
  },
  {
    id: "m_3pm",
    campaignId: "camp_3pm",
    views: 210000,
    engagement: 28000,
    clicks: 6400,
    ctr: 3.0,
    conversions: 190,
    revenue: 14250,
    cac: 22.1,
    roas: 2.4,
    recordedAt: daysAgo(1),
  },
  {
    id: "m_q1",
    campaignId: "camp_q1",
    views: 2600000,
    engagement: 187000,
    clicks: 58000,
    ctr: 2.2,
    conversions: 2140,
    revenue: 167000,
    cac: 14.0,
    roas: 5.57,
    recordedAt: daysAgo(140),
  },
];

// ── Marketing memory ──────────────────────────────────────────
export const MEMORY: BrandMemoryNote[] = [
  {
    id: "mem_1",
    orgId: ORG.id,
    campaignId: "camp_q1",
    kind: "winning_hook",
    insight: "Resolution / fresh-start framing in January drove our best-ever ROAS (5.57). Reuse seasonal fresh-start moments.",
    outcome: "win",
    metricRef: "ROAS 5.57",
    createdAt: daysAgo(138),
  },
  {
    id: "mem_2",
    orgId: ORG.id,
    campaignId: "camp_swap",
    kind: "winning_hook",
    insight: "Honest 'day 3 nearly broke me' POV hooks outperform polished product demos by ~40% on retention.",
    outcome: "win",
    metricRef: "Hook retention +40%",
    createdAt: daysAgo(10),
  },
  {
    id: "mem_3",
    orgId: ORG.id,
    kind: "failed_angle",
    insight: "'Zero crash' messaging underperformed and felt generic against saturated category language. Avoid as primary hook.",
    outcome: "loss",
    metricRef: "CTR 0.8% (below 1.5% benchmark)",
    createdAt: daysAgo(60),
  },
  {
    id: "mem_4",
    orgId: ORG.id,
    kind: "best_creator_type",
    insight: "Ex-athlete / performance-credible Igniters (e.g. Devon) convert our audience best. Prioritize credibility over follower count.",
    outcome: "win",
    metricRef: "3.73 ROAS via Igniter-led",
    createdAt: daysAgo(8),
  },
  {
    id: "mem_5",
    orgId: ORG.id,
    kind: "best_platform",
    insight: "TikTok drives top-of-funnel reach cheaply; Email closes. Treat TikTok as discovery, Email as conversion.",
    outcome: "neutral",
    createdAt: daysAgo(30),
  },
];
