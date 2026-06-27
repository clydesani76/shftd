# SHFTD — The Marketing Operating System

> Stop chasing trends. Start setting them.

SHFTD is an AI-powered **Marketing Operating System**. It helps a business
decide what marketing to do next, create campaigns, execute them with creators,
track results, and learn from every campaign over time.

It is **not** just a content platform, an influencer marketplace, or an AI
copywriting tool — it's the full loop: **observe → decide → create → execute →
measure → remember.**

---

## ✨ What's inside

Every feature answers one question: *“What marketing should we do next to grow
faster than our competitors?”*

| Layer | What it does |
|---|---|
| **Competitive Intelligence** | Track competitors, capture evidence, categorize into Winning Patterns / Overused Angles / White Space. |
| **Strategy Engine** | Side-by-side **Safe & Proven** vs **Bold & Original** recommendations, each with rationale, risk, upside, platforms, creator roles, KPIs, and budget split. |
| **AI Copy Studio** | Generate scored hooks, headlines, captions, CTAs, scripts, landing-page & ad copy. |
| **Campaigns** | Full campaign blueprints + a build wizard. Statuses: draft → published → live → review → completed → archived. |
| **Creator Marketplace** | Publish campaigns; creators apply for **Igniter / Amplifier / Closer** roles; submit content; approve / reject / request revisions. |
| **Payouts** | Base pay + performance bonus pools, ledger, bonus progress, Stripe Connect-ready onboarding (stubbed). |
| **Analytics & ROI** | Views, CTR, conversions, CAC, ROAS, and **Proven vs Original** comparison + "what worked / what failed". |
| **Marketing Memory** | Stores wins/losses per brand; feeds the Strategy Engine so recommendations compound. |
| **Admin** | Manage users, campaigns, submissions, evidence, payouts, disputes. |

### Two campaign paths
- **Safe & Proven** — lower-risk plays built on what competitors already do successfully.
- **Bold & Original** — first-mover ideas from white-space detection and trend synthesis.

---

## 🧱 Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** — minimal, futuristic dark UI
- **Supabase** (Postgres + Auth) — schema in [`supabase/schema.sql`](supabase/schema.sql)
- **Stripe Connect-ready** payout architecture (stubbed)
- **OpenAI/LLM-ready** AI service layer (`src/lib/ai`)
- **Recharts** for charts, **React Query** for data/state

---

## 🚀 Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

### Demo mode (default)
The app runs **fully offline with realistic mock data** — no Supabase, no API
keys required. A **role switcher** (top-right) lets you experience the app as a
**Business**, **Creator**, or **Admin** user.

### Going live
Copy `.env.example` → `.env.local` and fill in keys:

1. **Supabase** — create a project, run `supabase/schema.sql`, paste the URL +
   keys. The app auto-detects them and leaves demo mode.
2. **LLM** — add `OPENAI_API_KEY`. The AI service layer swaps from the mock
   provider to the live provider automatically.
3. **Stripe Connect** — add Stripe keys to enable real creator payouts.

---

## 🗂️ Project structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login / signup           # Auth (Supabase-ready, demo bypass)
│   ├── (dashboard)/             # App shell (sidebar + topbar)
│   │   ├── dashboard/           # Role-based home
│   │   ├── intelligence/        # Competitive Intelligence
│   │   ├── strategy/            # Strategy Engine
│   │   ├── copy-studio/         # AI Copy Studio
│   │   ├── campaigns/           # List, builder wizard, detail
│   │   ├── marketplace/         # Creator marketplace
│   │   ├── payouts/             # Payouts & ledger
│   │   ├── analytics/           # Analytics & ROI
│   │   ├── memory/              # Marketing Memory
│   │   ├── settings/  admin/    # Settings & Admin
│   └── api/ai/                  # AI route handlers (insights/strategy/copy)
├── components/                  # UI, layout, dashboards, feature components
├── lib/
│   ├── ai/                      # AI provider abstraction (mock + openai)
│   ├── supabase/                # Browser/server/service clients
│   ├── mock/                    # Mock dataset (drives demo mode)
│   ├── data.ts                  # Data access layer (mock today, Supabase later)
│   ├── config.ts                # Capability flags / demo mode
│   └── nav.ts utils.ts          # Navigation + helpers
├── types/                       # Domain types (mirror the DB schema)
└── middleware.ts                # Supabase session refresh (inert in demo)
```

## 🔭 What's next (TODOs in code)

- Live competitor scanning / social + analytics connectors (Meta, TikTok, GA4, Shopify)
- Real LLM calls in `src/lib/ai/openaiProvider.ts`
- Stripe Connect onboarding + payout execution
- Persisting mutations through `src/lib/data.ts` to Supabase
- Tighter RLS policies for creator-facing tables

Search the codebase for `TODO` to find every integration point.
