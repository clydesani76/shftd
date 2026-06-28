"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, ProgressBar } from "@/components/ui/misc";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, PathBadge, RiskBadge } from "@/components/ui/badge";
import { getRecommendations } from "@/lib/data";
import { titleCase } from "@/lib/utils";
import type { GeneratedStrategy } from "@/lib/ai/types";
import type { StrategyRecommendation } from "@/types";
import {
  Sparkles,
  ArrowRight,
  Target,
  Rocket,
  Users,
  BarChart2,
  Wallet,
} from "lucide-react";

// Normalize a stored recommendation into the same shape the AI returns so the
// card renders identically whether the data came from mock storage or a live
// generation call.
function toStrategy(r: StrategyRecommendation): GeneratedStrategy & { id?: string } {
  return {
    id: r.id,
    path: r.path,
    title: r.title,
    concept: r.concept,
    rationale: r.rationale,
    riskLevel: r.riskLevel,
    expectedUpside: r.expectedUpside,
    platforms: r.platforms,
    creatorRoles: r.creatorRoles,
    kpis: r.kpis,
    budgetSplit: r.budgetSplit,
  };
}

export default function StrategyPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState(
    getRecommendations().map(toStrategy),
  );
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setStrategies(data.strategies);
    } catch {
      // Keep existing strategies on error.
    } finally {
      setLoading(false);
    }
  }

  const proven = strategies.find((s) => s.path === "proven");
  const original = strategies.find((s) => s.path === "original");

  return (
    <div>
      <PageHeader
        title="Strategy Engine"
        subtitle="The decision-making brain. Two paths, side by side — choose one, or run both."
        actions={
          <Button onClick={generate} disabled={loading}>
            <Sparkles className="h-4 w-4" />
            {loading ? "Thinking…" : "Generate recommendations"}
          </Button>
        }
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-ink-800/40 p-4 text-sm text-slate-500">
        SHFTD weighs live competitor intelligence against your{" "}
        <span className="text-electric-600">Marketing Memory</span> to recommend
        a lower-risk proven play and a higher-upside original play. Every
        recommendation explains <span className="text-slate-900">why</span>.
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {proven && (
          <StrategyCard
            strategy={proven}
            onTurnIntoCampaign={() =>
              router.push(`/campaigns/new?path=proven`)
            }
          />
        )}
        {original && (
          <StrategyCard
            strategy={original}
            onTurnIntoCampaign={() =>
              router.push(`/campaigns/new?path=original`)
            }
          />
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/campaigns/new?path=both")}
        >
          Run both paths as a portfolio <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StrategyCard({
  strategy,
  onTurnIntoCampaign,
}: {
  strategy: GeneratedStrategy;
  onTurnIntoCampaign: () => void;
}) {
  const isProven = strategy.path === "proven";
  return (
    <Card
      className={
        isProven
          ? "border-cyber/20 shadow-glow-cyber"
          : "border-electric-500/20 shadow-glow"
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <PathBadge path={strategy.path} />
          <RiskBadge risk={strategy.riskLevel} />
        </div>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold text-header">
          {isProven ? (
            <Target className="h-5 w-5 text-teal-600" />
          ) : (
            <Rocket className="h-5 w-5 text-electric-600" />
          )}
          {strategy.title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">{strategy.concept}</p>

        <div className="rounded-lg border border-slate-200 bg-ink-800/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Why this is recommended
          </p>
          <p className="mt-1 text-sm text-slate-600">{strategy.rationale}</p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Expected upside
          </p>
          <p className="mt-1 text-sm text-slate-600">{strategy.expectedUpside}</p>
        </div>

        <Detail icon={BarChart2} label="Platforms">
          <div className="flex flex-wrap gap-1">
            {strategy.platforms.map((p) => (
              <Badge key={p}>{p}</Badge>
            ))}
          </div>
        </Detail>

        <Detail icon={Users} label="Creator roles">
          <div className="flex flex-wrap gap-1">
            {strategy.creatorRoles.map((r) => (
              <Badge key={r} tone={isProven ? "cyber" : "electric"}>
                {titleCase(r)}
              </Badge>
            ))}
          </div>
        </Detail>

        <Detail icon={Target} label="Suggested KPIs">
          <div className="flex flex-wrap gap-1">
            {strategy.kpis.map((k) => (
              <Badge key={k}>{k}</Badge>
            ))}
          </div>
        </Detail>

        <Detail icon={Wallet} label="Budget split">
          <div className="space-y-2">
            {strategy.budgetSplit.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{b.label}</span>
                  <span>{b.percent}%</span>
                </div>
                <ProgressBar
                  value={b.percent}
                  tone={isProven ? "cyber" : "electric"}
                />
              </div>
            ))}
          </div>
        </Detail>

        <Button
          className="w-full"
          variant={isProven ? "secondary" : "primary"}
          onClick={onTurnIntoCampaign}
        >
          Turn into campaign <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      {children}
    </div>
  );
}
