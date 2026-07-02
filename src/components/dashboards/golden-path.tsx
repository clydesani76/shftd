"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Radar, BrainCircuit, Rocket, PenLine, Sparkles, X } from "lucide-react";

// Guided "golden path" — the demo/onboarding sequence that showcases the live
// AI end to end. Dismissible (persisted to localStorage) so it stays out of
// the way once a user knows the flow.
const STEPS = [
  {
    n: 1,
    icon: Radar,
    title: "Add a competitor",
    copy: "Track a rival by name, domain, or handle.",
    href: "/intelligence",
  },
  {
    n: 2,
    icon: BrainCircuit,
    title: "Generate AI insights",
    copy: "Hit Re-analyze — Claude finds winning patterns & white space.",
    href: "/intelligence",
  },
  {
    n: 3,
    icon: Rocket,
    title: "Build a strategy",
    copy: "Get Safe & Proven vs Bold & Original plays, side by side.",
    href: "/strategy",
  },
  {
    n: 4,
    icon: PenLine,
    title: "Generate copy",
    copy: "Turn the plan into scored, on-brand copy in the Studio.",
    href: "/copy-studio",
  },
];

const STORAGE_KEY = "shftd:golden-path-dismissed";

export function GoldenPath() {
  const [dismissed, setDismissed] = useState(true); // default hidden until hydrated

  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <Card className="relative mb-6 overflow-hidden border-electric-500/30 bg-electric-500/[0.04] p-5 shadow-glow">
      <button
        onClick={dismiss}
        aria-label="Dismiss guide"
        className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-4 flex items-center gap-2">
        <Badge tone="electric">
          <Sparkles className="h-3 w-3" /> Live AI
        </Badge>
        <h2 className="text-lg font-semibold text-header">
          Run your first AI-powered campaign in 4 steps
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <Link
            key={s.n}
            href={s.href}
            className={cn(
              "group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition-all",
              "hover:border-electric-400 hover:shadow-md",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-500/15 text-xs font-bold text-electric-700">
                {s.n}
              </span>
              <s.icon className="h-4 w-4 text-electric-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">{s.title}</p>
            <p className="mt-1 text-xs text-slate-500">{s.copy}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
