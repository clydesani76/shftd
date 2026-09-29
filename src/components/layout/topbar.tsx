"use client";

import { useSession } from "@/components/session";
import { getOrg } from "@/lib/data";
import { cn, titleCase } from "@/lib/utils";
import { Search, FlaskConical } from "lucide-react";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["business", "creator", "admin"];

export function Topbar() {
  const { user, role, setRole, workspace, setWorkspace, isDemo } = useSession();
  const org = getOrg();

  const orgName = isDemo ? org.name : "My workspace";
  const orgSub = isDemo ? org.industry : "Real workspace";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-ink-700/90 px-4 backdrop-blur-sm sm:px-6">
      {/* Org context */}
      <div className="hidden items-center gap-2 md:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-electric-500 text-sm font-bold text-[#141310]">
          {orgName.charAt(0)}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium text-slate-900">{orgName}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            {orgSub}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search campaigns, creators, insights…"
          className="h-9 w-full rounded-md border border-slate-200 bg-ink-700 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 ring-focus"
        />
      </div>

      {/* Workspace switcher — demo vs. the user's real workspace. */}
      <div className="hidden items-center gap-0.5 rounded-md border border-slate-200 bg-ink-700 p-0.5 sm:flex">
        <button
          onClick={() => setWorkspace("demo")}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
            workspace === "demo"
              ? "bg-signal-amber/20 text-amber-300"
              : "text-slate-500 hover:text-slate-900",
          )}
          title="Explore the Nova sample workspace"
        >
          <FlaskConical className="h-3 w-3" /> Demo
        </button>
        <button
          onClick={() => setWorkspace("real")}
          className={cn(
            "rounded px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
            workspace === "real"
              ? "bg-electric-500 text-[#141310]"
              : "text-slate-500 hover:text-slate-900",
          )}
          title="Your own workspace"
        >
          Real
        </button>
      </div>

      {/* Role switcher (demo only) */}
      <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-ink-700 p-0.5">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
              role === r
                ? "bg-electric-500 text-[#141310]"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            {titleCase(r)}
          </button>
        ))}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-electric-gradient text-xs font-bold text-[#141310]">
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
