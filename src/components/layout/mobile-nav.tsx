"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForRole } from "@/lib/nav";
import { useSession } from "@/components/session";
import { cn } from "@/lib/utils";

// Horizontal scrolling nav shown on small screens (sidebar is hidden < lg).
export function MobileNav() {
  const pathname = usePathname();
  const { role } = useSession();
  const items = navForRole(role);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-ink-800/40 px-3 py-2 lg:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
              active
                ? "bg-electric-500/15 text-slate-900"
                : "text-slate-500 hover:text-slate-900",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
