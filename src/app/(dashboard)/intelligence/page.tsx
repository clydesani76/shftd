"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, SectionLabel, ProgressBar, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, InsightBadge } from "@/components/ui/badge";
import { CompetitorAnalysisPanel } from "@/components/intelligence/competitor-analysis";
import { timeAgo, titleCase } from "@/lib/utils";
import type { Competitor, Evidence, EvidenceType, Insight } from "@/types";
import { Plus, Radar, ArrowRight, Sparkles, Globe, AtSign, Gauge } from "lucide-react";

type NewCompetitor = Omit<Competitor, "id" | "orgId" | "addedAt">;
type NewEvidence = {
  competitorId: string;
  type: EvidenceType;
  channel: string;
  content: string;
};

export default function IntelligencePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [analysisFor, setAnalysisFor] = useState<Competitor | null>(null);

  // Competitors, evidence and insights all come from the database.
  const { data: competitors = [] } = useQuery<Competitor[]>({
    queryKey: ["competitors"],
    queryFn: async () => {
      const res = await fetch("/api/competitors");
      return (await res.json()).competitors ?? [];
    },
  });

  const { data: evidence = [] } = useQuery<Evidence[]>({
    queryKey: ["evidence"],
    queryFn: async () => {
      const res = await fetch("/api/evidence");
      return (await res.json()).evidence ?? [];
    },
  });

  const { data: insights = [] } = useQuery<Insight[]>({
    queryKey: ["insights"],
    queryFn: async () => {
      const res = await fetch("/api/insights");
      return (await res.json()).insights ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (c: NewCompetitor) => {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (!res.ok) throw new Error("Failed to add competitor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      setShowAdd(false);
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: async (e: NewEvidence) => {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(e),
      });
      if (!res.ok) throw new Error("Failed to add evidence");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
      setShowAddEvidence(false);
    },
  });

  // Re-analyze: generate insights from stored evidence and persist them.
  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/insights", { method: "POST" });
      if (!res.ok) throw new Error("Failed to analyze");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["insights"] }),
  });

  function addCompetitor(c: NewCompetitor) {
    addMutation.mutate(c);
  }

  const buckets = {
    winning_pattern: insights.filter((i) => i.category === "winning_pattern"),
    overused_angle: insights.filter((i) => i.category === "overused_angle"),
    white_space: insights.filter((i) => i.category === "white_space"),
  };

  return (
    <div>
      <PageHeader
        title="Competitive Intelligence"
        subtitle="Observe the market. See what's winning, what's overused, and where the white space is."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => reanalyzeMutation.mutate()}
              disabled={reanalyzeMutation.isPending}
            >
              <Sparkles className="h-4 w-4" />
              {reanalyzeMutation.isPending ? "Analyzing…" : "Re-analyze"}
            </Button>
            <Button onClick={() => setShowAdd((s) => !s)}>
              <Plus className="h-4 w-4" /> Add competitor
            </Button>
          </>
        }
      />

      {showAdd && (
        <AddCompetitorForm
          onAdd={addCompetitor}
          onCancel={() => setShowAdd(false)}
          pending={addMutation.isPending}
        />
      )}

      {showAddEvidence && (
        <AddEvidenceForm
          competitors={competitors}
          onAdd={(e) => addEvidenceMutation.mutate(e)}
          onCancel={() => setShowAddEvidence(false)}
          pending={addEvidenceMutation.isPending}
        />
      )}

      {analysisFor && (
        <CompetitorAnalysisPanel
          competitor={analysisFor}
          onClose={() => setAnalysisFor(null)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Competitors + evidence */}
        <div className="lg:col-span-1">
          <SectionLabel>Tracked competitors</SectionLabel>
          <div className="space-y-3">
            {competitors.map((c) => {
              const signals = evidence.filter((e) => e.competitorId === c.id);
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{c.brandName}</p>
                      <p className="text-xs text-slate-500">{c.category}</p>
                    </div>
                    <Badge>{signals.length} signals</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {c.domain && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {c.domain}
                      </span>
                    )}
                    {c.socialHandle && (
                      <span className="inline-flex items-center gap-1">
                        <AtSign className="h-3 w-3" /> {c.socialHandle}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={analysisFor?.id === c.id ? "secondary" : "outline"}
                    className="mt-3 w-full"
                    onClick={() =>
                      setAnalysisFor((cur) => (cur?.id === c.id ? null : c))
                    }
                  >
                    <Gauge className="h-3.5 w-3.5" />
                    {analysisFor?.id === c.id ? "Hide analysis" : "Deep analysis"}
                  </Button>
                </Card>
              );
            })}
          </div>

          <div className="mb-3 mt-6 flex items-center justify-between">
            <SectionLabel>Captured evidence</SectionLabel>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddEvidence((s) => !s)}
              disabled={competitors.length === 0}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {evidence.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No evidence captured yet. Add a competitor, then attach the ads,
                hooks, or offers you observe.
              </p>
            )}
            {evidence.slice(0, 6).map((e) => (
              <Card key={e.id} className="p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone="cyber">{titleCase(e.type)}</Badge>
                  <span className="text-xs text-slate-500">{e.channel}</span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-600">{e.content}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Insight buckets */}
        <div className="lg:col-span-2">
          <SectionLabel>AI-categorized insights</SectionLabel>
          {insights.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="No insights yet"
              description="Add competitors and evidence, then run analysis to generate AI insights."
              action={
                <Button
                  onClick={() => reanalyzeMutation.mutate()}
                  disabled={reanalyzeMutation.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  {reanalyzeMutation.isPending ? "Analyzing…" : "Run analysis"}
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              <InsightBucket
                title="Winning Patterns"
                hint="Proven plays you can pattern-match"
                items={buckets.winning_pattern}
                onTurnIntoStrategy={() => router.push("/strategy")}
              />
              <InsightBucket
                title="Overused Angles"
                hint="Saturated — avoid or subvert"
                items={buckets.overused_angle}
                onTurnIntoStrategy={() => router.push("/strategy")}
              />
              <InsightBucket
                title="White Space Opportunities"
                hint="Unclaimed territory — first-mover upside"
                items={buckets.white_space}
                onTurnIntoStrategy={() => router.push("/strategy")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InsightBucket({
  title,
  hint,
  items,
  onTurnIntoStrategy,
}: {
  title: string;
  hint: string;
  items: Insight[];
  onTurnIntoStrategy: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-header">{title}</h3>
        <span className="text-xs text-slate-500">{hint}</span>
      </div>
      <div className="space-y-3">
        {items.map((i) => (
          <Card key={i.id} hover className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <InsightBadge category={i.category} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{i.channel}</span>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-500">{timeAgo(i.createdAt)}</span>
              </div>
            </div>
            <p className="font-medium text-slate-900">{i.title}</p>
            <p className="mt-1 text-sm text-slate-500">{i.explanation}</p>

            <div className="mt-3 rounded-lg border border-slate-200 bg-ink-800/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-electric-600">
                Recommendation
              </p>
              <p className="mt-1 text-sm text-slate-600">{i.recommendation}</p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Confidence</span>
                <div className="w-24">
                  <ProgressBar value={i.confidence} tone="cyber" />
                </div>
                <span className="text-xs text-slate-500">{i.confidence}%</span>
              </div>
              <Button size="sm" onClick={onTurnIntoStrategy}>
                Turn into strategy <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddCompetitorForm({
  onAdd,
  onCancel,
  pending,
}: {
  onAdd: (c: Omit<Competitor, "id" | "orgId" | "addedAt">) => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const [brandName, setBrandName] = useState("");
  const [domain, setDomain] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [category, setCategory] = useState("");

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add a competitor</CardTitle>
        <p className="text-sm text-slate-500">
          Track by brand name, domain, or social handle. Evidence and AI
          insights build from here.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Brand name" value={brandName} onChange={setBrandName} placeholder="Pulse Electrolytes" />
          <Input label="Category" value={category} onChange={setCategory} placeholder="Hydration" />
          <Input label="Domain" value={domain} onChange={setDomain} placeholder="example.com" />
          <Input label="Social handle" value={socialHandle} onChange={setSocialHandle} placeholder="@brand" />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            disabled={!brandName || pending}
            onClick={() => onAdd({ brandName, domain, socialHandle, category })}
          >
            {pending ? "Saving…" : "Add competitor"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const EVIDENCE_TYPES: EvidenceType[] = [
  "ad",
  "caption",
  "landing_page",
  "campaign",
  "offer",
  "hook",
  "cta",
];

function AddEvidenceForm({
  competitors,
  onAdd,
  onCancel,
  pending,
}: {
  competitors: Competitor[];
  onAdd: (e: NewEvidence) => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id ?? "");
  const [type, setType] = useState<EvidenceType>("hook");
  const [channel, setChannel] = useState("");
  const [content, setContent] = useState("");

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add evidence</CardTitle>
        <p className="text-sm text-slate-500">
          Capture a competitor signal — an ad, hook, offer, or caption you
          observed. These feed the AI analysis.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Competitor
            </label>
            <select
              value={competitorId}
              onChange={(e) => setCompetitorId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 ring-focus"
            >
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brandName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EvidenceType)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 ring-focus"
            >
              {EVIDENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Channel"
            value={channel}
            onChange={setChannel}
            placeholder="TikTok, Email…"
          />
        </div>
        <div className="mt-3">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            What you observed
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="e.g. POV transformation hook driving 2M views…"
            className="w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 ring-focus"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            disabled={!competitorId || !content || pending}
            onClick={() => onAdd({ competitorId, type, channel, content })}
          >
            {pending ? "Saving…" : "Add evidence"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 placeholder:text-slate-500 ring-focus"
      />
    </div>
  );
}
