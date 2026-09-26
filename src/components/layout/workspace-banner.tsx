"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/session";
import { FlaskConical, ArrowRight, LogIn } from "lucide-react";

interface Me {
  authenticated: boolean;
  role: string | null;
  hasSupabase: boolean;
}

// Persistent workspace banner.
// - Demo workspace: makes clear every figure is sample data + offers the real
//   workspace path.
// - Real workspace, not signed in (with Supabase configured): prompts sign-in,
//   because a real workspace's data and actions require an authenticated,
//   isolated account (the server rejects unauthenticated writes).
export function WorkspaceBanner() {
  const { isDemo, hydrated, setWorkspace } = useSession();

  const { data: me } = useQuery<Me>({
    queryKey: ["me"],
    enabled: hydrated && !isDemo,
    queryFn: async () => (await fetch("/api/me")).json(),
    staleTime: 60_000,
  });

  if (!hydrated) return null;

  if (isDemo) {
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

  // Real workspace but not signed in — prompt authentication.
  if (me && me.hasSupabase && !me.authenticated) {
    return (
      <div className="border-b border-electric-500/25 bg-electric-500/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <p className="flex items-center gap-2 text-xs text-slate-300">
            <LogIn className="h-3.5 w-3.5 shrink-0 text-electric-600" />
            <span>
              Sign in to load and act on your own workspace. Your data is
              isolated to your account — nothing here is shared with the demo.
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md border border-electric-500/30 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-electric-700 transition-colors hover:bg-electric-500/10"
            >
              Sign in
            </Link>
            <button
              onClick={() => setWorkspace("demo")}
              className="font-mono text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300"
            >
              Back to demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
