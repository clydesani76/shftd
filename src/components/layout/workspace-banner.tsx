"use client";

import { useSession } from "@/components/session";
import { FlaskConical, ArrowRight } from "lucide-react";

// Persistent workspace banner. In the DEMO workspace it makes clear — on every
// screen — that all figures are sample data, and offers a one-click path to
// the user's own real workspace. Hidden in a real workspace.
export function WorkspaceBanner() {
  const { isDemo, hydrated, setWorkspace } = useSession();

  // Avoid flashing the demo banner before the persisted workspace is read.
  if (!hydrated || !isDemo) return null;

  return (
    <div className="border-b border-amber-500/25 bg-signal-amber/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-xs text-amber-200/90">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>
            <span className="font-mono font-semibold uppercase tracking-wider text-amber-300">
              Demo data
            </span>{" "}
            — you&apos;re exploring the Nova Hydration sample workspace. Every
            revenue, ROAS, creator, payout and chart here is illustrative.
          </span>
        </p>
        <button
          onClick={() => setWorkspace("real")}
          className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-500/10"
        >
          Set up my workspace <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
