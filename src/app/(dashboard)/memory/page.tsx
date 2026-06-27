"use client";

import { useState } from "react";
import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCampaign, getMemory } from "@/lib/data";
import { cn, timeAgo } from "@/lib/utils";
import type { BrandMemoryNote, MemoryKind } from "@/types";
import {
  Database,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  XCircle,
  Users,
  Radio,
  Gift,
  Plus,
} from "lucide-react";

const KIND_META: Record<MemoryKind, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  winning_hook: { icon: Zap, label: "Winning Hook" },
  failed_angle: { icon: XCircle, label: "Failed Angle" },
  best_creator_type: { icon: Users, label: "Best Creator Type" },
  best_platform: { icon: Radio, label: "Best Platform" },
  best_offer: { icon: Gift, label: "Best Offer" },
  general: { icon: Database, label: "General" },
};

export default function MemoryPage() {
  const [memory] = useState<BrandMemoryNote[]>(getMemory());

  const wins = memory.filter((m) => m.outcome === "win").length;
  const losses = memory.filter((m) => m.outcome === "loss").length;

  // Distill into quick-reference "what we know" chips per kind.
  const byKind = (Object.keys(KIND_META) as MemoryKind[])
    .map((k) => ({ kind: k, notes: memory.filter((m) => m.kind === k) }))
    .filter((g) => g.notes.length > 0);

  return (
    <div>
      <PageHeader
        title="Marketing Memory"
        subtitle="SHFTD's long-term advantage — every win and loss makes the next recommendation smarter."
        actions={
          <Button variant="outline">
            <Plus className="h-4 w-4" /> Add learning
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Learnings stored</p>
          <p className="mt-1 text-2xl font-semibold text-white">{memory.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Validated wins</p>
          <p className="mt-1 text-2xl font-semibold text-signal-green">{wins}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Logged failures</p>
          <p className="mt-1 text-2xl font-semibold text-signal-red">{losses}</p>
        </Card>
      </div>

      <div className="rounded-xl border border-electric-500/20 bg-electric-500/5 p-4 text-sm text-slate-300">
        <span className="font-medium text-electric-200">How this is used:</span>{" "}
        The Strategy Engine reads these notes when generating recommendations —
        reusing proven hooks, avoiding failed angles, and favoring the creator
        types and platforms that have worked for this brand.
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <SectionLabel>Memory timeline</SectionLabel>
          <div className="relative space-y-4 border-l border-white/10 pl-6">
            {memory.map((m) => {
              const meta = KIND_META[m.kind];
              const Icon = meta.icon;
              return (
                <div key={m.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-ink-800",
                      m.outcome === "win"
                        ? "border-signal-green/40 text-signal-green"
                        : m.outcome === "loss"
                          ? "border-signal-red/40 text-signal-red"
                          : "border-white/15 text-slate-400",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <Card className="p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Badge>{meta.label}</Badge>
                      <OutcomeBadge outcome={m.outcome} />
                    </div>
                    <p className="text-sm text-slate-200">{m.insight}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      {m.campaignId && <span>{getCampaign(m.campaignId)?.name}</span>}
                      {m.metricRef && (
                        <Badge tone="cyber">{m.metricRef}</Badge>
                      )}
                      <span className="ml-auto">{timeAgo(m.createdAt)}</span>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* What we know */}
        <div>
          <SectionLabel>What we know about this brand</SectionLabel>
          <div className="space-y-3">
            {byKind.map(({ kind, notes }) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              return (
                <Card key={kind} className="p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-white">
                    <Icon className="h-4 w-4 text-electric-300" /> {meta.label}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
                    {notes.map((n) => (
                      <li key={n.id} className="line-clamp-2">
                        • {n.insight}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: BrandMemoryNote["outcome"] }) {
  if (outcome === "win")
    return (
      <Badge tone="green">
        <TrendingUp className="h-3 w-3" /> Win
      </Badge>
    );
  if (outcome === "loss")
    return (
      <Badge tone="red">
        <TrendingDown className="h-3 w-3" /> Loss
      </Badge>
    );
  return (
    <Badge>
      <Minus className="h-3 w-3" /> Neutral
    </Badge>
  );
}
