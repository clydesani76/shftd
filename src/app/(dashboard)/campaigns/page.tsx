"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/misc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, PathBadge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/types";
import { Plus, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: (CampaignStatus | "all")[] = [
  "all",
  "draft",
  "published",
  "live",
  "review",
  "completed",
];

export default function CampaignsPage() {
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");

  // Campaigns come from the database (via /api/campaigns).
  const { data: all = [] } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      return data.campaigns ?? [];
    },
  });

  const campaigns = filter === "all" ? all : all.filter((c) => c.status === filter);

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Full campaign blueprints — from strategy to execution."
        actions={
          <Link href="/campaigns/new">
            <Button>
              <Plus className="h-4 w-4" /> New campaign
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "border-electric-400/60 bg-electric-500/15 text-slate-900"
                : "border-slate-200 text-slate-500 hover:text-slate-900",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((c) => (
          <Link key={c.id} href={`/campaigns/${c.id}`}>
            <Card hover className="flex h-full flex-col p-5">
              <div className="mb-3 flex items-center justify-between">
                <PathBadge path={c.path} />
                <StatusBadge status={c.status} />
              </div>
              <h3 className="font-semibold text-header">{c.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                {c.goal}
              </p>
              <div className="mt-4 flex flex-wrap gap-1">
                {c.platforms.map((p) => (
                  <Badge key={p}>{p}</Badge>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                <span>{formatCurrency(c.budget, true)} budget</span>
                <span>{formatDate(c.timelineStart)}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {campaigns.length === 0 && (
        <Card className="p-12 text-center text-slate-500">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          No campaigns in this view.
        </Card>
      )}
    </div>
  );
}
