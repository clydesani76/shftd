import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Radar,
  BrainCircuit,
  PenLine,
  Users,
  BarChart3,
  Database,
  ArrowRight,
} from "lucide-react";

const LAYERS = [
  { icon: Radar, title: "Intelligence", href: "/intelligence", copy: "Scan competitors and surface winning patterns, overused angles, and white space." },
  { icon: BrainCircuit, title: "Strategy Engine", href: "/strategy", copy: "Get side-by-side Safe & Proven vs Bold & Original campaign recommendations." },
  { icon: PenLine, title: "AI Copy Studio", href: "/copy-studio", copy: "Generate scored hooks, captions, scripts, and ad copy in your brand voice." },
  { icon: Users, title: "Creator Marketplace", href: "/marketplace", copy: "Launch campaigns with Igniter, Amplifier, and Closer creators." },
  { icon: BarChart3, title: "Analytics & ROI", href: "/analytics", copy: "Track views, conversions, CAC, ROAS — Proven vs Original head to head." },
  { icon: Database, title: "Marketing Memory", href: "/memory", copy: "Remember what worked and failed so every recommendation gets smarter." },
];

// Capability stats — the shape of the product, not claimed traction.
const STATS = [
  { value: "6", label: "layers, one system", sub: "Intel → strategy → copy → creators → ROI → memory" },
  { value: "2", label: "strategic paths", sub: "Safe & Proven vs Bold & Original, side by side" },
  { value: "1", label: "decision layer", sub: "What to run next — not just who to pay" },
  { value: "∞", label: "compounding memory", sub: "Every campaign makes the next one smarter" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow flex items-center gap-2">
      <span className="text-electric-600" aria-hidden>
        {"//"}
      </span>
      {children}
    </p>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-900">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-ink-900/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="SHFTD home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            {[
              ["System", "#system"],
              ["Paths", "#paths"],
              ["Difference", "#difference"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="font-mono text-xs uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-slate-200">
        <div className="blueprint pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <Eyebrow>The Marketing Operating System</Eyebrow>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/wordmark.png"
            alt="SHFTD"
            className="mt-5 h-16 w-auto select-none sm:h-28"
          />
          <p className="mt-6 max-w-2xl text-pretty text-lg text-slate-600">
            SHFTD decides what marketing to do next, creates the campaigns,
            executes them with creators, tracks the results, and learns from
            every campaign — so you grow faster than your competitors.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Launch the demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">
                Create account
              </Button>
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs text-slate-500">
            <span className="text-emerald-600">●</span> no setup required —
            explore with realistic demo data
          </p>
        </div>
      </section>

      {/* Capability stat band */}
      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="border-slate-200 p-6 [&:not(:nth-child(2n))]:border-r lg:[&:not(:nth-child(4n))]:border-r [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+4)]:border-b"
            >
              <p className="font-mono text-[11px] text-slate-400">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-header">
                {s.value}
              </p>
              <p className="mt-2 text-sm font-semibold text-header">{s.label}</p>
              <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Layers */}
      <section id="system" className="border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Eyebrow>One system, end to end</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-header sm:text-3xl">
            Six layers. One decision loop.
          </h2>
          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {LAYERS.map((l, i) => (
                <Link
                  key={l.title}
                  href={l.href}
                  className="group bg-ink-700 p-6 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-ink-700 text-electric-600 transition-colors group-hover:border-electric-500/40">
                      <l.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 flex items-center gap-1.5 font-semibold text-header">
                    {l.title}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{l.copy}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section id="paths" className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Eyebrow>Every recommendation, two ways</Eyebrow>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2">
            <div className="bg-ink-700 p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-teal-700">
                [ Safe &amp; Proven ]
              </p>
              <h3 className="mt-3 text-xl font-semibold text-header">
                Optimization campaigns
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Lower-risk plays built on what competitors are already doing
                successfully — proven hooks, CTAs, offers, and formats.
              </p>
            </div>
            <div className="bg-ink-700 p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-electric-700">
                [ Bold &amp; Original ]
              </p>
              <h3 className="mt-3 text-xl font-semibold text-header">
                First-mover campaigns
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Higher-upside ideas built from trend synthesis and white-space
                detection — campaigns others may eventually copy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The difference / moat */}
      <section id="difference" className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Eyebrow>Why SHFTD is different</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-header sm:text-3xl">
            Not another marketplace or payout tool
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Most platforms help you get paid and find people to promote your
            offer. That&apos;s the easy part. SHFTD decides{" "}
            <span className="text-slate-900">what marketing to run</span> — and
            gets smarter every campaign.
          </p>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2">
            <div className="bg-ink-700 p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Marketplaces &amp; payout tools
              </p>
              <h3 className="mt-3 font-semibold text-slate-600">
                The distribution layer
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                <li>— Process payments &amp; payouts</li>
                <li>— List offers, match affiliates</li>
                <li>— Stop once the deal is done</li>
                <li>— No view of what to actually run</li>
              </ul>
            </div>
            <div className="bg-ink-700 p-6 ring-1 ring-inset ring-electric-500/30">
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-electric-700">
                SHFTD
              </p>
              <h3 className="mt-3 font-semibold text-header">
                The decision layer — your marketing brain
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>→ Reads competitors &amp; finds white space</li>
                <li>→ Recommends Proven vs Original plays, with the “why”</li>
                <li>→ Runs them end to end, then tracks ROI</li>
                <li>→ Remembers every win &amp; loss → smarter next time</li>
              </ul>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-base text-slate-600">
            They help you <span className="text-slate-500">get paid</span>. SHFTD
            tells you{" "}
            <span className="font-semibold text-header">what to do next</span> —
            and compounds that edge over time.
          </p>
        </div>
      </section>

      {/* Closing CTA — terminal block */}
      <section className="border-y border-slate-200 bg-ink-800">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">
            <span className="text-electric-600">$</span> shftd --launch
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-header sm:text-4xl">
            Ready to set the trend?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-slate-500">
            Explore the full system with realistic demo data — no signup, no
            setup. See what to run next in under a minute.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="lg">
                Launch the demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 font-mono text-xs text-slate-500 sm:flex-row">
        <span>SHFTD — The Marketing Operating System</span>
        <span className="text-slate-400">
          © {new Date().getFullYear()} · v1.0
        </span>
      </footer>
    </div>
  );
}
