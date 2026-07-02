"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, PathBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { Competitor } from "@/types";
import type { CompetitorAnalysis, GeneratedStrategy } from "@/lib/ai/types";
import {
  Sparkles,
  X,
  ShieldAlert,
  Gauge,
  Globe,
  Search,
  Radio,
  Megaphone,
  ThumbsUp,
  Crosshair,
  Check,
  Plus,
  ArrowRight,
} from "lucide-react";

const THREAT: Record<string, { tone: "green" | "amber" | "electric"; label: string }> = {
  low: { tone: "green", label: "Low threat" },
  medium: { tone: "amber", label: "Medium threat" },
  high: { tone: "electric", label: "High threat" },
};

const INTENSITY: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-rose-600",
};

export function CompetitorAnalysisPanel({
  competitor,
  onClose,
}: {
  competitor: Competitor;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [meta, setMeta] = useState<{ provider: string; siteFetched: boolean } | null>(
    null,
  );

  const { data: analysis, isLoading } = useQuery<CompetitorAnalysis | null>({
    queryKey: ["analysis", competitor.id],
    queryFn: async () => {
      const res = await fetch(`/api/analyze?competitorId=${competitor.id}`);
      const data = await res.json();
      return data.analysis ?? null;
    },
  });

  const run = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId: competitor.id }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json() as Promise<{
        analysis: CompetitorAnalysis;
        provider: string;
        siteFetched: boolean;
      }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["analysis", competitor.id], data.analysis);
      setMeta({ provider: data.provider, siteFetched: data.siteFetched });
    },
  });

  return (
    <Card className="mb-6 border-electric-500/30 shadow-glow">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-electric-600" /> Deep analysis ·{" "}
            {competitor.brandName}
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Website, search, social, and campaign read — with campaigns to
            out-compete and grow the market.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => run.mutate()}
            disabled={run.isPending}
          >
            <Sparkles className="h-4 w-4" />
            {run.isPending
              ? "Analyzing…"
              : analysis
                ? "Re-run"
                : "Run analysis"}
          </Button>
          <button
            onClick={onClose}
            aria-label="Close analysis"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {run.isPending && (
          <p className="py-8 text-center text-sm text-slate-500">
            Fetching {competitor.domain || "the site"}, measuring channels, and
            drafting counter-campaigns…
          </p>
        )}

        {!run.isPending && !analysis && (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <ShieldAlert className="mx-auto mb-2 h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-900">
              No analysis yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              {isLoading
                ? "Loading…"
                : "Run a deep analysis to score this competitor across web, search, social, and campaigns — then generate campaigns to beat them."}
            </p>
          </div>
        )}

        {!run.isPending && analysis && (
          <Report
            analysis={analysis}
            meta={meta}
            onCreated={() =>
              queryClient.invalidateQueries({ queryKey: ["campaigns"] })
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function Report({
  analysis,
  meta,
  onCreated,
}: {
  analysis: CompetitorAnalysis;
  meta: { provider: string; siteFetched: boolean } | null;
  onCreated: () => void;
}) {
  const threat = THREAT[analysis.threatLevel] ?? THREAT.medium;

  return (
    <div className="space-y-6">
      {/* Headline: overall score + threat + summary */}
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-header">
              {analysis.overallScore}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Strength
            </p>
          </div>
          <Badge tone={threat.tone}>{threat.label}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          {analysis.summary}
        </p>
      </div>

      {meta && (
        <p className="text-xs text-slate-400">
          {meta.provider === "anthropic"
            ? "Analyzed with Claude"
            : meta.provider === "mock-fallback"
              ? "Analyzed with the offline demo model"
              : `Provider: ${meta.provider}`}
          {" · "}
          {meta.siteFetched
            ? "grounded in a live website fetch"
            : "website could not be fetched — estimates used"}
        </p>
      )}

      {/* Scorecard */}
      <Section icon={Gauge} title="Competitive scorecard">
        <div className="grid gap-3 sm:grid-cols-2">
          {analysis.scorecard.map((s) => (
            <div
              key={s.dimension}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {s.dimension}
                </span>
                <span className="text-sm font-semibold text-electric-600">
                  {s.score}
                </span>
              </div>
              <ProgressBar value={s.score} max={100} tone="cyber" />
              <p className="mt-2 text-xs text-slate-500">{s.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Channels */}
      <Section icon={Radio} title="Channel presence">
        <div className="space-y-2">
          {analysis.channels.map((c) => (
            <div
              key={c.channel}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
            >
              <ChannelIcon channel={c.channel} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {c.channel}
                  </span>
                  <span className="text-xs capitalize text-slate-500">
                    {c.presence} · {c.strength}
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={c.strength} max={100} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{c.assessment}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Campaign types */}
      <Section icon={Megaphone} title="Campaigns they run">
        <div className="grid gap-2 sm:grid-cols-2">
          {analysis.campaignTypes.map((c) => (
            <div
              key={c.type}
              className="rounded-lg border border-slate-200 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {c.type}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium capitalize",
                    INTENSITY[c.intensity] ?? "text-slate-500",
                  )}
                >
                  {c.intensity} intensity
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{c.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Strengths / gaps */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-signal-green/20 bg-signal-green/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <ThumbsUp className="h-4 w-4" /> Their strengths
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            {analysis.strengths.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-electric-500/20 bg-electric-500/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-electric-600">
            <Crosshair className="h-4 w-4" /> Gaps to exploit
          </p>
          <ul className="space-y-1 text-sm text-slate-600">
            {analysis.gaps.map((g, i) => (
              <li key={i}>• {g}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended counter-campaigns */}
      <Section icon={Sparkles} title="Campaigns to out-compete & grow">
        <div className="grid gap-4 lg:grid-cols-2">
          {analysis.recommendedCampaigns.map((c, i) => (
            <RecommendedCampaign key={i} strategy={c} onCreated={onCreated} />
          ))}
        </div>
      </Section>

      {/* Sources + disclaimer */}
      <div className="border-t border-slate-200 pt-3">
        <p className="text-xs text-slate-500">
          <span className="font-medium">Sources:</span>{" "}
          {analysis.sources.join(" · ")}
        </p>
        <p className="mt-1 text-xs text-slate-400">{analysis.disclaimer}</p>
      </div>
    </div>
  );
}

function RecommendedCampaign({
  strategy,
  onCreated,
}: {
  strategy: GeneratedStrategy;
  onCreated: () => void;
}) {
  const [created, setCreated] = useState(false);
  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: strategy.title,
          goal: strategy.expectedUpside,
          path: strategy.path,
          narrativeAngle: strategy.concept,
          creatorInstructions: strategy.rationale,
          platforms: strategy.platforms,
          kpis: strategy.kpis,
          budget: 15000,
        }),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      return res.json();
    },
    onSuccess: () => {
      setCreated(true);
      onCreated();
    },
  });

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <PathBadge path={strategy.path} />
        <Badge tone={strategy.riskLevel === "high" ? "amber" : "cyber"}>
          {strategy.riskLevel} risk
        </Badge>
      </div>
      <p className="font-semibold text-slate-900">{strategy.title}</p>
      <p className="mt-1 text-sm text-slate-600">{strategy.concept}</p>
      <p className="mt-2 text-xs text-slate-500">{strategy.rationale}</p>

      <div className="mt-3 flex flex-wrap gap-1">
        {strategy.platforms.map((p) => (
          <Badge key={p}>{p}</Badge>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {strategy.kpis.slice(0, 4).map((k) => (
          <Badge key={k} tone="cyber">
            {k}
          </Badge>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <Button
          size="sm"
          variant={created ? "secondary" : "primary"}
          className="w-full"
          onClick={() => create.mutate()}
          disabled={created || create.isPending}
        >
          {created ? (
            <>
              <Check className="h-3.5 w-3.5" /> Campaign created
            </>
          ) : create.isPending ? (
            "Creating…"
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> Create this campaign
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-header">
        <Icon className="h-4 w-4 text-electric-600" /> {title}
      </h3>
      {children}
    </div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const c = channel.toLowerCase();
  const Icon = c.includes("google") || c.includes("search")
    ? Search
    : c.includes("email")
      ? Globe
      : Radio;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600">
      <Icon className="h-4 w-4" />
    </div>
  );
}
