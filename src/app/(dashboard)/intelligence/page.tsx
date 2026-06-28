"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, SectionLabel, ProgressBar, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, InsightBadge } from "@/components/ui/badge";
import { getEvidence, getEvidenceForCompetitor, getInsights } from "@/lib/data";
import { timeAgo, titleCase } from "@/lib/utils";
import type { Competitor, Insight } from "@/types";
import { Plus, Radar, ArrowRight, Sparkles, Globe, AtSign } from "lucide-react";

type NewCompetitor = Omit<Competitor, "id" | "orgId" | "addedAt">;

export default function IntelligencePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [insights] = useState<Insight[]>(getInsights());
  const [showAdd, setShowAdd] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Competitors now come from the database (via /api/competitors). React
  // Query handles loading + caching; adds persist to Supabase.
  const { data: competitors = [] } = useQuery<Competitor[]>({
    queryKey: ["competitors"],
    queryFn: async () => {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      return data.competitors ?? [];
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
      // Re-pull the saved list from the database.
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      setShowAdd(false);
    },
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
              onClick={() => {
                // Simulated re-analysis pass over stored evidence.
                setAnalyzing(true);
                setTimeout(() => setAnalyzing(false), 1100);
              }}
            >
              <Sparkles className="h-4 w-4" />
              {analyzing ? "Analyzing…" : "Re-analyze"}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Competitors + evidence */}
        <div className="lg:col-span-1">
          <SectionLabel>Tracked competitors</SectionLabel>
          <div className="space-y-3">
            {competitors.map((c) => {
              const evidence = getEvidenceForCompetitor(c.id);
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{c.brandName}</p>
                      <p className="text-xs text-slate-500">{c.category}</p>
                    </div>
                    <Badge>{evidence.length} signals</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
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
                </Card>
              );
            })}
          </div>

          <SectionLabel>
            <span className="mt-6 block">Captured evidence</span>
          </SectionLabel>
          <div className="space-y-2">
            {getEvidence()
              .slice(0, 4)
              .map((e) => (
                <Card key={e.id} className="p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="cyber">{titleCase(e.type)}</Badge>
                    <span className="text-xs text-slate-500">{e.channel}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-300">{e.content}</p>
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
              description="Add competitors and evidence, then run analysis."
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
        <h3 className="text-sm font-semibold text-white">{title}</h3>
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
            <p className="font-medium text-white">{i.title}</p>
            <p className="mt-1 text-sm text-slate-400">{i.explanation}</p>

            <div className="mt-3 rounded-lg border border-white/5 bg-ink-800/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-electric-300">
                Recommendation
              </p>
              <p className="mt-1 text-sm text-slate-300">{i.recommendation}</p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Confidence</span>
                <div className="w-24">
                  <ProgressBar value={i.confidence} tone="cyber" />
                </div>
                <span className="text-xs text-slate-400">{i.confidence}%</span>
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
        <p className="text-sm text-slate-400">
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
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-white/10 bg-ink-700/60 px-3 text-sm text-white placeholder:text-slate-500 ring-focus"
      />
    </div>
  );
}
