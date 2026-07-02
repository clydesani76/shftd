"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Radar,
  BrainCircuit,
  PenLine,
  Users,
  BarChart3,
  Database,
  Presentation,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

// Guided investor walkthrough of the 6 SHFTD layers. A floating button opens a
// stepped overlay; each step links to the live page for that layer so a pitch
// can jump straight into the product. Available across all dashboard pages.
const STEPS = [
  {
    icon: Radar,
    title: "1 · Competitive Intelligence",
    copy: "SHFTD scans competitors and surfaces winning patterns, overused angles, and untapped white space — the raw signal for every decision.",
    href: "/intelligence",
    cta: "Open Intelligence",
  },
  {
    icon: BrainCircuit,
    title: "2 · Strategy Engine",
    copy: "Signal becomes strategy: side-by-side Safe & Proven vs Bold & Original campaign recommendations, each with the 'why'.",
    href: "/strategy",
    cta: "Open Strategy",
  },
  {
    icon: PenLine,
    title: "3 · AI Copy Studio",
    copy: "Turn a chosen strategy into scored, on-brand hooks, captions, scripts, ad copy — and AI-generated imagery — in seconds.",
    href: "/copy-studio",
    cta: "Open Copy Studio",
  },
  {
    icon: Users,
    title: "4 · Creator Marketplace",
    copy: "Launch campaigns to Igniter, Amplifier, and Closer creators, review submissions, and approve the best work.",
    href: "/marketplace",
    cta: "Open Marketplace",
  },
  {
    icon: BarChart3,
    title: "5 · Analytics & ROI",
    copy: "Track views, conversions, CAC, and ROAS with Proven vs Original head-to-head — proving what actually drove growth.",
    href: "/analytics",
    cta: "Open Analytics",
  },
  {
    icon: Database,
    title: "6 · Marketing Memory",
    copy: "Every win and loss is remembered, so the next recommendation is sharper than the last. The edge compounds over time.",
    href: "/memory",
    cta: "Open Memory",
  },
];

export function InvestorTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function start() {
    setStep(0);
    setOpen(true);
  }

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = s.icon;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={start}
        className={cn(
          "fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full",
          "bg-electric-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow",
          "transition-transform hover:scale-[1.03] active:scale-95",
        )}
      >
        <Presentation className="h-4 w-4" /> Investor tour
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-fade-in w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
                <Icon className="h-6 w-6" />
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close tour"
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-xl font-semibold text-header">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.copy}</p>

            <Link href={s.href} onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="mt-4">
                {s.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {/* Progress dots */}
            <div className="mt-6 flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === step
                      ? "w-6 bg-electric-gradient"
                      : "w-1.5 bg-slate-200 hover:bg-slate-300",
                  )}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="mt-5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((n) => Math.max(0, n - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              {isLast ? (
                <Button size="sm" onClick={() => setOpen(false)}>
                  Finish
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStep((n) => n + 1)}>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
