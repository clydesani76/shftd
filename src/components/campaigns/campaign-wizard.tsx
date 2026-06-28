"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PathBadge } from "@/components/ui/badge";
import { getRecommendations } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { CampaignPath } from "@/types";
import { Check, ChevronLeft, ChevronRight, Rocket } from "lucide-react";

const STEPS = ["Basics", "Audience & Offer", "Execution", "Budget", "Review"] as const;

interface Draft {
  name: string;
  goal: string;
  path: CampaignPath;
  narrativeAngle: string;
  targetAudience: string;
  offer: string;
  deliverables: string;
  platforms: string;
  creatorInstructions: string;
  timelineStart: string;
  timelineEnd: string;
  kpis: string;
  budget: number;
  basePct: number;
}

export function CampaignWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const pathParam = (params.get("path") as CampaignPath | "both") || "proven";
  const initialPath: CampaignPath = pathParam === "original" ? "original" : "proven";

  // Pre-fill from the matching strategy recommendation when available.
  const seed = getRecommendations().find((r) => r.path === initialPath);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    name: seed?.title ?? "",
    goal: seed?.expectedUpside ?? "",
    path: initialPath,
    narrativeAngle: seed?.concept ?? "",
    targetAudience: "",
    offer: "",
    deliverables: "",
    platforms: seed?.platforms.join(", ") ?? "",
    creatorInstructions: "",
    timelineStart: "",
    timelineEnd: "",
    kpis: seed?.kpis.join(", ") ?? "",
    budget: 24000,
    basePct: 60,
  });

  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const base = Math.round((draft.budget * draft.basePct) / 100);
  const bonus = draft.budget - base;

  // Split a comma-separated field into a clean string array.
  const toList = (s: string) =>
    s.split(",").map((x) => x.trim()).filter(Boolean);

  async function finish() {
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          goal: draft.goal,
          path: draft.path,
          narrativeAngle: draft.narrativeAngle,
          targetAudience: draft.targetAudience,
          offer: draft.offer,
          deliverables: toList(draft.deliverables),
          platforms: toList(draft.platforms),
          creatorInstructions: draft.creatorInstructions,
          timelineStart: draft.timelineStart || null,
          timelineEnd: draft.timelineEnd || null,
          kpis: toList(draft.kpis),
          budget: draft.budget,
          basePayPool: base,
          performanceBonusPool: bonus,
        }),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      // Land on the campaigns list, where the new draft now appears.
      router.push("/campaigns");
    } catch {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Campaign builder"
        subtitle="Turn a strategy into a full campaign blueprint — not just copy."
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                i === step
                  ? "bg-electric-500/15 text-slate-900"
                  : i < step
                    ? "text-teal-600"
                    : "text-slate-500",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                  i < step
                    ? "border-cyber bg-cyber/20 text-teal-600"
                    : i === step
                      ? "border-electric-400 text-slate-900"
                      : "border-slate-300",
                )}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-slate-600" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          {step === 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Campaign path:</span>
                <PathBadge path={draft.path} />
                <button
                  className="text-xs text-electric-600 hover:underline"
                  onClick={() =>
                    set("path", draft.path === "proven" ? "original" : "proven")
                  }
                >
                  switch
                </button>
              </div>
              <Field label="Campaign name" value={draft.name} onChange={(v) => set("name", v)} placeholder="30-Day Coffee Swap Challenge" />
              <Area label="Campaign goal" value={draft.goal} onChange={(v) => set("goal", v)} placeholder="Drive 2M views and 1,500 first orders" />
              <Area label="Narrative angle" value={draft.narrativeAngle} onChange={(v) => set("narrativeAngle", v)} placeholder="Personal transformation story" />
            </>
          )}

          {step === 1 && (
            <>
              <Area label="Target audience" value={draft.targetAudience} onChange={(v) => set("targetAudience", v)} placeholder="25–40 professionals who rely on coffee" />
              <Area label="Offer" value={draft.offer} onChange={(v) => set("offer", v)} placeholder="First-order ritual kit + subscribe & save 25%" />
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Platforms (comma separated)" value={draft.platforms} onChange={(v) => set("platforms", v)} placeholder="TikTok, Instagram" />
              <Field label="Deliverables (comma separated)" value={draft.deliverables} onChange={(v) => set("deliverables", v)} placeholder="1x TikTok, 3x Stories, 1x Reel" />
              <Area label="Creator instructions" value={draft.creatorInstructions} onChange={(v) => set("creatorInstructions", v)} placeholder="Lead with a first-person POV hook in 2s…" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" type="date" value={draft.timelineStart} onChange={(v) => set("timelineStart", v)} />
                <Field label="End date" type="date" value={draft.timelineEnd} onChange={(v) => set("timelineEnd", v)} />
              </div>
              <Field label="KPIs (comma separated)" value={draft.kpis} onChange={(v) => set("kpis", v)} placeholder="Views, CTR, First orders" />
            </>
          )}

          {step === 3 && (
            <>
              <Field
                label="Total budget (USD)"
                type="number"
                value={String(draft.budget)}
                onChange={(v) => set("budget", Number(v) || 0)}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Base pay vs performance bonus — {draft.basePct}% / {100 - draft.basePct}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft.basePct}
                  onChange={(e) => set("basePct", Number(e.target.value))}
                  className="w-full accent-electric-500"
                />
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-ink-800/50 p-3">
                    <p className="text-xs text-slate-500">Base pay pool</p>
                    <p className="text-lg font-semibold text-slate-900">${base.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-ink-800/50 p-3">
                    <p className="text-xs text-slate-500">Performance bonus pool</p>
                    <p className="text-lg font-semibold text-teal-600">${bonus.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Review label="Name" value={draft.name} />
              <Review label="Path" value={draft.path === "proven" ? "Safe & Proven" : "Bold & Original"} />
              <Review label="Goal" value={draft.goal} />
              <Review label="Audience" value={draft.targetAudience} />
              <Review label="Offer" value={draft.offer} />
              <Review label="Platforms" value={draft.platforms} />
              <Review label="Budget" value={`$${draft.budget.toLocaleString()} (base $${base.toLocaleString()} / bonus $${bonus.toLocaleString()})`} />
              <p className="pt-2 text-xs text-slate-500">
                Saving creates a <span className="text-slate-900">Draft</span> campaign.
                Publish it from the campaign page to open it to the marketplace.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={saving || !draft.name}>
                <Rocket className="h-4 w-4" />
                {saving ? "Creating…" : "Create campaign"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 placeholder:text-slate-500 ring-focus"
      />
    </div>
  );
}

function Area({
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
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 ring-focus"
      />
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-slate-200 pb-2 text-sm">
      <span className="w-28 shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-700">{value || "—"}</span>
    </div>
  );
}
