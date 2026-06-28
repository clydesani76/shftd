"use client";

import { useSession } from "@/components/session";
import { getOrg, isDemo } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { cn, titleCase } from "@/lib/utils";
import { Search, Sparkles } from "lucide-react";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["business", "creator", "admin"];

export function Topbar() {
  const { user, role, setRole } = useSession();
  const org = getOrg();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-ink-900/70 px-4 backdrop-blur-md sm:px-6">
      {/* Org context */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-600 text-sm font-bold text-teal-600">
          {org.name.charAt(0)}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-slate-900">{org.name}</p>
          <p className="text-[11px] text-slate-500">{org.industry}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Search campaigns, creators, insights…"
          className="h-9 w-full rounded-lg border border-slate-200 bg-ink-700/60 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-500 ring-focus"
        />
      </div>

      {isDemo && (
        <Badge tone="amber" className="hidden sm:inline-flex">
          <Sparkles className="h-3 w-3" /> Demo data
        </Badge>
      )}

      {/* Role switcher (demo only) */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-ink-700/60 p-0.5">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              role === r
                ? "bg-electric-500/20 text-slate-900"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            {titleCase(r)}
          </button>
        ))}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-gradient text-xs font-bold text-white">
          {user.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
      </div>
    </header>
  );
}
