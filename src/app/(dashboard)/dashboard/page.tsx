"use client";

import { useSession } from "@/components/session";
import { BusinessDashboard } from "@/components/dashboards/business-dashboard";
import { CreatorDashboard } from "@/components/dashboards/creator-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";

// Role-based dashboard router. Each role gets a tailored home view.
export default function DashboardPage() {
  const { role } = useSession();
  if (role === "creator") return <CreatorDashboard />;
  if (role === "admin") return <AdminDashboard />;
  return <BusinessDashboard />;
}
