import {
  LayoutDashboard,
  Radar,
  BrainCircuit,
  PenLine,
  Megaphone,
  Users,
  Wallet,
  BarChart3,
  Database,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Which roles can see this item. Omitted => all roles.
  roles?: UserRole[];
  badge?: string;
}

// Primary navigation. Order matters — this is the sidebar.
export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Competitive Intelligence",
    href: "/intelligence",
    icon: Radar,
    roles: ["business", "admin"],
  },
  {
    label: "Strategy Engine",
    href: "/strategy",
    icon: BrainCircuit,
    roles: ["business", "admin"],
  },
  {
    label: "AI Copy Studio",
    href: "/copy-studio",
    icon: PenLine,
    roles: ["business", "admin"],
  },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Creator Marketplace", href: "/marketplace", icon: Users },
  { label: "Payouts", href: "/payouts", icon: Wallet },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["business", "admin"],
  },
  {
    label: "Marketing Memory",
    href: "/memory",
    icon: Database,
    roles: ["business", "admin"],
  },
  { label: "Settings", href: "/settings", icon: Settings },
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    roles: ["admin"],
  },
];

export function navForRole(role: UserRole): NavItem[] {
  return NAV.filter((item) => !item.roles || item.roles.includes(role));
}
