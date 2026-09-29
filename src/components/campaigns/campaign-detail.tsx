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
import { useSession } from "@/components/session";
import { RightsPanel } from "@/components/campaigns/rights-panel";

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

// Submission shape returned by /api/submissions (includes creator display).
interface SubmissionView {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  contentUrl?: string;
  fileName?: string;
  note: string;
  publicationDate?: string;
  evidenceUrl?: string;
  status: import("@/types").SubmissionStatus;
  reviewerNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}
import { cn, formatCompact, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { Campaign, CampaignAsset, CopyVariant } from "@/types";
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
  Image as ImageIcon,
} from "lucide-react";

const TABS = [
  "Blueprint",
  "Applications",
  "Submissions",
  "Copy",
  "Images",
  "Performance",
] as const;
type Tab = (typeof TABS)[number];

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const queryClient = useQueryClient();
  const { role, isDemo, user } = useSession();
  const isBrand = role === "business" || role === "admin";
  const isCreator = role === "creator";
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

  // Persist status changes (Publish / Go live) to the database. The server
  // enforces the state machine and returns 409 with a reason on illegal moves.
  const statusMutation = useMutation({
    mutationFn: async (status: Campaign["status"]) => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update status");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  // Approve the brief — the gate that unlocks publishing.
  const approveBriefMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_brief" }),
      });
      if (!res.ok) throw new Error("Failed to approve brief");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] }),
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

  // AI-generated images saved to this campaign (from Storage + the database).
  const { data: assets = [] } = useQuery<CampaignAsset[]>({
    queryKey: ["assets", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/assets?campaignId=${campaignId}`);
      const data = await res.json();
      return data.assets ?? [];
    },
  });

  // Deliverables: demo shows the sample set; a real workspace reads its own
  // submissions from the database.
  const { data: realSubmissions = [] } = useQuery<SubmissionView[]>({
    queryKey: ["submissions", campaignId, isDemo],
    enabled: !isDemo,
    queryFn: async () => {
      const res = await fetch(`/api/submissions?campaignId=${campaignId}`);
      return (await res.json()).submissions ?? [];
    },
  });
  const submissions: SubmissionView[] = isDemo
    ? getSubmissions(campaignId).map((s) => ({
        ...s,
        creatorName: getCreator(s.creatorId)?.name ?? "Creator",
      }))
    : realSubmissions;

  // Brand reviews a deliverable (server-enforced transition + payout on approve).
  const reviewMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      decision: "approve" | "reject" | "revise";
      reviewerNote?: string;
    }) => {
      const res = await fetch(`/api/submissions/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: input.decision,
          reviewerNote: input.reviewerNote,
          reviewedBy: user.fullName,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", campaignId] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });

  // Creator submits a deliverable.
  const submitMutation = useMutation({
    mutationFn: async (input: {
      contentUrl: string;
      note: string;
      publicationDate: string;
      evidenceUrl: string;
    }) => {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, ...input }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error === "UNAUTHENTICATED" ? "Sign in as a creator to submit." : d.error ?? "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["submissions", campaignId] }),
  });

  // Brand accepts / rejects an applicant (with agreed pay terms on accept).
  const applicationMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      action: "accept" | "reject";
      agreedBasePay?: number;
      agreedBonus?: number;
    }) => {
      const res = await fetch(`/api/applications/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update application");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["applications", campaignId] }),
  });

  if (isLoading) {
    return <p className="text-slate-500">Loading campaign…</p>;
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
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        ← All campaigns
      </Link>
      <PageHeader
        title={campaign.name}
        subtitle={campaign.goal}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            {status === "draft" && !campaign.briefApprovedAt && (
              <Button
                onClick={() => approveBriefMutation.mutate()}
                disabled={approveBriefMutation.isPending}
              >
                <Check className="h-4 w-4" /> Approve brief
              </Button>
            )}
            {status === "draft" && campaign.briefApprovedAt && (
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

      {statusMutation.isError && (
        <div className="mb-4 rounded-md border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-sm text-rose-300">
          {(statusMutation.error as Error).message}
        </div>
      )}
      {status === "draft" && campaign.briefApprovedAt && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-emerald-400">
          <Check className="h-3.5 w-3.5" /> Brief approved — ready to publish.
        </p>
      )}

      <div className="mb-5 flex items-center gap-2">
        <PathBadge path={campaign.path} />
        {campaign.platforms.map((p) => (
          <Badge key={p}>{p}</Badge>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
              tab === t ? "text-slate-900" : "text-slate-500 hover:text-slate-900",
            )}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 bg-electric-600" />
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
                  <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    Deliverables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.deliverables.map((d) => (
                      <Badge key={d}>{d}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
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
              <CardContent className="text-sm text-slate-600">
                {formatDate(campaign.timelineStart)} → {formatDate(campaign.timelineEnd)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-semibold text-slate-900">
                    {formatCurrency(campaign.budget)}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Base pay pool</span>
                    <span>{formatCurrency(campaign.basePayPool)}</span>
                  </div>
                  <ProgressBar value={campaign.basePayPool} max={campaign.budget} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
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
          {applications.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={a.creatorName} />
                  <div>
                    <p className="font-medium text-slate-900">{a.creatorName}</p>
                    <p className="text-xs text-slate-500">
                      {titleCase(a.role)} · Trust {a.trustScore}
                    </p>
                  </div>
                </div>
                <AppStatusBadge status={a.status} />
              </div>
              {a.pitch && (
                <p className="mt-3 text-sm text-slate-500">{a.pitch}</p>
              )}
              {isBrand && !isDemo && (a.status === "applied" || a.status === "invited") && (
                <AcceptControls
                  onAccept={(agreedBasePay, agreedBonus) =>
                    applicationMutation.mutate({
                      id: a.id,
                      action: "accept",
                      agreedBasePay,
                      agreedBonus,
                    })
                  }
                  onReject={() =>
                    applicationMutation.mutate({ id: a.id, action: "reject" })
                  }
                  pending={applicationMutation.isPending}
                />
              )}
            </Card>
          ))}
          {applications.length === 0 && (
            <Card className="p-8 text-center text-slate-500">
              <Users className="mx-auto mb-2 h-6 w-6 text-slate-600" />
              No applications yet. Publish to the marketplace to attract creators.
            </Card>
          )}
        </div>
      )}

      {tab === "Submissions" && (
        <div className="space-y-3">
          {/* Creator: submit a deliverable (once the campaign is open). */}
          {isCreator && !isDemo && (status === "published" || status === "live") && (
            <SubmitDeliverableForm
              onSubmit={(input) => submitMutation.mutate(input)}
              pending={submitMutation.isPending}
              error={
                submitMutation.isError
                  ? (submitMutation.error as Error).message
                  : undefined
              }
            />
          )}

          {reviewMutation.isError && (
            <div className="rounded-md border border-signal-red/30 bg-signal-red/10 px-3 py-2 text-sm text-rose-300">
              {(reviewMutation.error as Error).message}
            </div>
          )}

          {submissions.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.creatorName} />
                  <div>
                    <p className="font-medium text-slate-900">{s.creatorName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {s.contentUrl && (
                        <a
                          href={s.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-electric-600 hover:underline"
                        >
                          View content <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {s.publicationDate && (
                        <span>Published {formatDate(s.publicationDate)}</span>
                      )}
                      {s.evidenceUrl && (
                        <a
                          href={s.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:underline"
                        >
                          Evidence <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <SubmissionBadge status={s.status} />
              </div>
              {s.note && <p className="mt-3 text-sm text-slate-500">{s.note}</p>}
              {s.reviewerNote && (
                <p className="mt-1 text-xs text-electric-600">
                  Reviewer note: {s.reviewerNote}
                </p>
              )}
              {s.reviewedBy && s.reviewedAt && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {titleCase(s.status)} by {s.reviewedBy} ·{" "}
                  {formatDate(s.reviewedAt)}
                </p>
              )}
              {isBrand && !isDemo &&
                (s.status === "submitted" ||
                  s.status === "revision_requested") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        reviewMutation.mutate({ id: s.id, decision: "approve" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        reviewMutation.mutate({
                          id: s.id,
                          decision: "revise",
                          reviewerNote: "Please revise and resubmit.",
                        })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Request revision
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        reviewMutation.mutate({ id: s.id, decision: "reject" })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              {s.status === "approved" && isBrand && (
                <p className="mt-2 text-xs text-emerald-400">
                  Approved — a payout obligation was created (pending until a
                  verified payment).
                </p>
              )}
              {!isDemo && (
                <RightsPanel
                  submissionId={s.id}
                  isBrand={isBrand}
                  isCreator={isCreator}
                  userName={user.fullName}
                />
              )}
            </Card>
          ))}
          {submissions.length === 0 && (
            <Card className="p-8 text-center text-slate-500">
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
                <span className="text-xs text-slate-500">Score {c.score}</span>
              </div>
              <p className="text-sm text-slate-700">{c.content}</p>
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

      {tab === "Images" && (
        <div>
          {assets.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 text-slate-600" />
              No images yet. Generate visuals in Copy Studio and save them here.
              <div className="mt-4">
                <Link href="/copy-studio">
                  <Button variant="outline">Open Copy Studio</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((a) => (
                <Card key={a.id} className="overflow-hidden p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={a.prompt}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-2 text-xs text-slate-600">
                      {a.prompt}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {a.size}
                      {a.provider ? ` · ${a.provider}` : ""}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
        <Card className="p-8 text-center text-slate-500">
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
      <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-600">{value}</p>
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
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", accent ? "text-teal-600" : "text-slate-900")}>
        {value}
      </p>
    </Card>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-electric-500 font-mono text-xs font-bold text-[#141310]">
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

// Brand: accept an applicant with agreed base pay + bonus terms.
function AcceptControls({
  onAccept,
  onReject,
  pending,
}: {
  onAccept: (basePay: number, bonus: number) => void;
  onReject: () => void;
  pending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [basePay, setBasePay] = useState("");
  const [bonus, setBonus] = useState("");

  if (!open) {
    return (
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => setOpen(true)} disabled={pending}>
          <Check className="h-3.5 w-3.5" /> Accept
        </Button>
        <Button size="sm" variant="outline" onClick={onReject} disabled={pending}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
        Agreed terms
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-500">
          Base pay ($)
          <input
            type="number"
            min={0}
            value={basePay}
            onChange={(e) => setBasePay(e.target.value)}
            className="mt-1 block h-8 w-28 rounded border border-slate-200 bg-ink-700 px-2 text-sm text-slate-900 ring-focus"
          />
        </label>
        <label className="text-xs text-slate-500">
          Bonus ($)
          <input
            type="number"
            min={0}
            value={bonus}
            onChange={(e) => setBonus(e.target.value)}
            className="mt-1 block h-8 w-28 rounded border border-slate-200 bg-ink-700 px-2 text-sm text-slate-900 ring-focus"
          />
        </label>
        <Button
          size="sm"
          onClick={() => onAccept(Number(basePay || 0), Number(bonus || 0))}
          disabled={pending}
        >
          Confirm accept
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Creator: submit a deliverable with a link, publication date and evidence.
function SubmitDeliverableForm({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (input: {
    contentUrl: string;
    note: string;
    publicationDate: string;
    evidenceUrl: string;
  }) => void;
  pending?: boolean;
  error?: string;
}) {
  const [contentUrl, setContentUrl] = useState("");
  const [note, setNote] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  return (
    <Card className="p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
        Submit a deliverable
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={contentUrl}
          onChange={(e) => setContentUrl(e.target.value)}
          placeholder="Content URL (TikTok, Reel, video…)"
          className="h-9 rounded-md border border-slate-200 bg-ink-700 px-3 text-sm text-slate-900 placeholder:text-slate-400 ring-focus"
        />
        <input
          type="date"
          value={publicationDate}
          onChange={(e) => setPublicationDate(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-ink-700 px-3 text-sm text-slate-900 ring-focus"
        />
        <input
          value={evidenceUrl}
          onChange={(e) => setEvidenceUrl(e.target.value)}
          placeholder="Evidence URL (analytics screenshot, insights…)"
          className="h-9 rounded-md border border-slate-200 bg-ink-700 px-3 text-sm text-slate-900 placeholder:text-slate-400 ring-focus sm:col-span-2"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Notes for the brand…"
          className="rounded-md border border-slate-200 bg-ink-700 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ring-focus sm:col-span-2"
        />
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      <Button
        size="sm"
        className="mt-3"
        disabled={pending || !contentUrl.trim()}
        onClick={() =>
          onSubmit({ contentUrl, note, publicationDate, evidenceUrl })
        }
      >
        {pending ? "Submitting…" : "Submit deliverable"}
      </Button>
    </Card>
  );
}
