"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, ProgressBar, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AppStatusBadge,
  Badge,
  PathBadge,
  StatusBadge,
  SubmissionBadge,
} from "@/components/ui/badge";
import {
  getCreator,
  getMetricsForCampaign,
  getSubmissions,
} from "@/lib/data";

// Flattened application shape returned by /api/applications.
interface AppView {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  trustScore: number;
  role: import("@/types").CreatorRole;
  status: import("@/types").ApplicationStatus;
  pitch: string;
  appliedAt: string;
}
import { cn, formatCompact, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { Campaign, CopyVariant, Submission, SubmissionStatus } from "@/types";
import {
  Calendar,
  Users,
  FileText,
  BarChart3,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  Megaphone,
} from "lucide-react";

const TABS = ["Blueprint", "Applications", "Submissions", "Copy", "Performance"] as const;
type Tab = (typeof TABS)[number];

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("Blueprint");

  // Load the campaign from the API (real DB, with mock fallback).
  const { data: campaign, isLoading } = useQuery<Campaign | null>({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.status === 404) return null;
      const data = await res.json();
      return data.campaign ?? null;
    },
  });

  // Persist status changes (Publish / Go live) to the database.
  const statusMutation = useMutation({
    mutationFn: async (status: Campaign["status"]) => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  // Real applications for this campaign (from the database).
  const { data: applications = [] } = useQuery<AppView[]>({
    queryKey: ["applications", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/applications?campaignId=${campaignId}`);
      const data = await res.json();
      return data.applications ?? [];
    },
  });

  // Saved AI copy attached to this campaign (from the database).
  const { data: copy = [] } = useQuery<CopyVariant[]>({
    queryKey: ["copy", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/copy?campaignId=${campaignId}`);
      const data = await res.json();
      return data.copy ?? [];
    },
  });

  // Local submission state so review actions feel live in the demo. (Kept as
  // a hook above any early return so hook order stays stable.)
  const [submissions, setSubmissions] = useState<Submission[]>(
    getSubmissions(campaignId),
  );
  function review(id: string, next: SubmissionStatus) {
    // TODO(supabase): update submissions.status + notify creator.
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: next } : s)),
    );
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading campaign…</p>;
  }
  if (!campaign) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Campaign not found"
        description="It may have been removed, or the link is incorrect."
        action={
          <Link href="/campaigns">
            <Button variant="outline">Back to campaigns</Button>
          </Link>
        }
      />
    );
  }

  const status = campaign.status;
  const metrics = getMetricsForCampaign(campaignId);

  return (
    <div>
      <Link
        href="/campaigns"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
      >
        ← All campaigns
      </Link>
      <PageHeader
        title={campaign.name}
        subtitle={campaign.goal}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {status === "draft" && (
              <Button
                onClick={() => statusMutation.mutate("published")}
                disabled={statusMutation.isPending}
              >
                <Megaphone className="h-4 w-4" /> Publish to marketplace
              </Button>
            )}
            {status === "published" && (
              <Button
                onClick={() => statusMutation.mutate("live")}
                disabled={statusMutation.isPending}
              >
                Go live
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-5 flex items-center gap-2">
        <PathBadge path={campaign.path} />
        {campaign.platforms.map((p) => (
          <Badge key={p}>{p}</Badge>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-white/5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "text-white" : "text-slate-400 hover:text-white",
            )}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-electric-gradient" />
            )}
          </button>
        ))}
      </div>

      {tab === "Blueprint" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign blueprint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Narrative angle" value={campaign.narrativeAngle} />
                <Field label="Target audience" value={campaign.targetAudience} />
                <Field label="Offer" value={campaign.offer} />
                <Field label="Creator instructions" value={campaign.creatorInstructions} />
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Deliverables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.deliverables.map((d) => (
                      <Badge key={d}>{d}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    KPIs
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.kpis.map((k) => (
                      <Badge key={k} tone="cyber">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" /> Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                {formatDate(campaign.timelineStart)} → {formatDate(campaign.timelineEnd)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-semibold text-white">
                    {formatCurrency(campaign.budget)}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Base pay pool</span>
                    <span>{formatCurrency(campaign.basePayPool)}</span>
                  </div>
                  <ProgressBar value={campaign.basePayPool} max={campaign.budget} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>Performance bonus</span>
                    <span>{formatCurrency(campaign.performanceBonusPool)}</span>
                  </div>
                  <ProgressBar
                    value={campaign.performanceBonusPool}
                    max={campaign.budget}
                    tone="cyber"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "Applications" && (
        <div className="space-y-3">
          {applications.map((a) => {
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.creatorName} />
                    <div>
                      <p className="font-medium text-white">{a.creatorName}</p>
                      <p className="text-xs text-slate-500">
                        {titleCase(a.role)} · Trust {a.trustScore}
                      </p>
                    </div>
                  </div>
                  <AppStatusBadge status={a.status} />
                </div>
                {a.pitch && (
                  <p className="mt-3 text-sm text-slate-400">{a.pitch}</p>
                )}
                {a.status === "applied" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm">Accept</Button>
                    <Button size="sm" variant="outline">
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          {applications.length === 0 && (
            <Card className="p-8 text-center text-slate-400">
              <Users className="mx-auto mb-2 h-6 w-6 text-slate-600" />
              No applications yet. Publish to the marketplace to attract creators.
            </Card>
          )}
        </div>
      )}

      {tab === "Submissions" && (
        <div className="space-y-3">
          {submissions.map((s) => {
            const creator = getCreator(s.creatorId);
            return (
              <Card key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={creator?.name ?? "?"} />
                    <div>
                      <p className="font-medium text-white">{creator?.name}</p>
                      {s.contentUrl && (
                        <a
                          href={s.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-electric-300 hover:underline"
                        >
                          View content <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <SubmissionBadge status={s.status} />
                </div>
                <p className="mt-3 text-sm text-slate-400">{s.note}</p>
                {s.reviewerNote && (
                  <p className="mt-1 text-xs text-electric-300">
                    Reviewer: {s.reviewerNote}
                  </p>
                )}
                {(s.status === "submitted" || s.status === "revision_requested") && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => review(s.id, "approved")}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review(s.id, "revision_requested")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Request revision
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => review(s.id, "rejected")}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          {submissions.length === 0 && (
            <Card className="p-8 text-center text-slate-400">
              <FileText className="mx-auto mb-2 h-6 w-6 text-slate-600" />
              No submissions yet.
            </Card>
          )}
        </div>
      )}

      {tab === "Copy" && (
        <div className="grid gap-3 md:grid-cols-2">
          {copy.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <Badge tone="electric">{titleCase(c.type)}</Badge>
                <span className="text-xs text-slate-400">Score {c.score}</span>
              </div>
              <p className="text-sm text-slate-200">{c.content}</p>
              <div className="mt-2 text-xs text-slate-500">
                {c.platform} · {c.tone}
              </div>
            </Card>
          ))}
          <Link href="/copy-studio" className="md:col-span-2">
            <Button variant="outline" className="w-full">
              Generate more in Copy Studio
            </Button>
          </Link>
        </div>
      )}

      {tab === "Performance" && metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Views" value={formatCompact(metrics.views)} />
          <Metric label="Engagement" value={formatCompact(metrics.engagement)} />
          <Metric label="Clicks" value={formatCompact(metrics.clicks)} />
          <Metric label="CTR" value={`${metrics.ctr}%`} />
          <Metric label="Conversions" value={formatCompact(metrics.conversions)} />
          <Metric label="Revenue" value={formatCurrency(metrics.revenue, true)} />
          <Metric label="CAC" value={formatCurrency(metrics.cac)} />
          <Metric label="ROAS" value={`${metrics.roas}x`} accent />
        </div>
      )}
      {tab === "Performance" && !metrics && (
        <Card className="p-8 text-center text-slate-400">
          <BarChart3 className="mx-auto mb-2 h-6 w-6 text-slate-600" />
          No performance data yet — metrics appear once the campaign goes live.
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-300">{value}</p>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold", accent ? "text-cyber" : "text-white")}>
        {value}
      </p>
    </Card>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-gradient text-xs font-bold text-white">
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}
