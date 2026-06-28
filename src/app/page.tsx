import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Radar,
  BrainCircuit,
  PenLine,
  Users,
  BarChart3,
  Database,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const LAYERS = [
  { icon: Radar, title: "Intelligence", copy: "Scan competitors and surface winning patterns, overused angles, and white space." },
  { icon: BrainCircuit, title: "Strategy Engine", copy: "Get side-by-side Safe & Proven vs Bold & Original campaign recommendations." },
  { icon: PenLine, title: "AI Copy Studio", copy: "Generate scored hooks, captions, scripts, and ad copy in your brand voice." },
  { icon: Users, title: "Creator Marketplace", copy: "Launch campaigns with Igniter, Amplifier, and Closer creators." },
  { icon: BarChart3, title: "Analytics & ROI", copy: "Track views, conversions, CAC, ROAS — Proven vs Original head to head." },
  { icon: Database, title: "Marketing Memory", copy: "Remember what worked and failed so every recommendation gets smarter." },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-grid">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          The Marketing Operating System
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight text-header sm:text-6xl">
          Stop chasing trends.
          <br />
          <span className="gradient-text">Start setting them.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-500">
          SHFTD decides what marketing to do next, creates the campaigns,
          executes them with creators, tracks the results, and learns from every
          campaign — so you grow faster than your competitors.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
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
        <p className="mt-4 text-xs text-slate-500">
          No setup required — explore with realistic demo data.
        </p>
      </section>

      {/* Two paths */}
      <section className="relative z-10 mx-auto mt-20 max-w-5xl px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-cyber/20 bg-cyber/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Safe &amp; Proven
            </p>
            <h3 className="mt-2 text-xl font-semibold text-header">
              Optimization campaigns
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Lower-risk plays built on what competitors are already doing
              successfully — proven hooks, CTAs, offers, and formats.
            </p>
          </Card>
          <Card className="border-electric-500/20 bg-electric-500/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-electric-600">
              Bold &amp; Original
            </p>
            <h3 className="mt-2 text-xl font-semibold text-header">
              First-mover campaigns
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Higher-upside ideas built from trend synthesis and white-space
              detection — campaigns others may eventually copy.
            </p>
          </Card>
        </div>
      </section>

      {/* Layers */}
      <section className="relative z-10 mx-auto mt-20 max-w-6xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-semibold text-header">
          One system, end to end
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((l) => (
            <Card key={l.title} hover className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600">
                <l.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-header">{l.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{l.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* The difference / moat */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
            Why SHFTD is different
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-header">
            Not another marketplace or payout tool
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
            Most platforms help you get paid and find people to promote your
            offer. That&apos;s the easy part. SHFTD decides{" "}
            <span className="text-slate-900">what marketing to run</span> — and gets
            smarter every campaign.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Marketplaces &amp; payout tools
            </p>
            <h3 className="mt-2 font-semibold text-slate-600">
              The distribution layer
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>• Process payments &amp; payouts</li>
              <li>• List offers, match affiliates</li>
              <li>• Stop once the deal is done</li>
              <li>• No view of what to actually run</li>
            </ul>
          </Card>
          <Card className="border-electric-500/30 bg-electric-500/5 p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-widest text-electric-600">
              SHFTD
            </p>
            <h3 className="mt-2 font-semibold text-header">
              The decision layer — your marketing brain
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Reads competitors &amp; finds white space</li>
              <li>• Recommends Proven vs Original plays, with the “why”</li>
              <li>• Runs them end to end, then tracks ROI</li>
              <li>• Remembers every win &amp; loss → smarter next time</li>
            </ul>
          </Card>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-base text-slate-600">
          They help you <span className="text-slate-500">get paid</span>. SHFTD
          tells you <span className="gradient-text font-semibold">what to do
          next</span> — and compounds that edge over time.
        </p>
      </section>

      <footer className="relative z-10 border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        SHFTD — The Marketing Operating System. © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
