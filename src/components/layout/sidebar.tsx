"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/lib/nav";
import { useSession } from "@/components/session";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useSession();
  const items = navForRole(role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-ink-800/60 lg:flex">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/" aria-label="SHFTD home">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                active
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-electric-600" : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto h-1 w-1 rounded-full bg-electric-600" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-md border border-slate-200 bg-ink-700 p-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-electric-700">
            {role === "creator" ? "Creator workspace" : "Marketing OS"}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Stop chasing trends. Start setting them.
          </p>
        </div>
      </div>
    </aside>
  );
}
