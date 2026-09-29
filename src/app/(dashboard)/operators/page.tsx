"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { PageHeader, SectionLabel, EmptyState } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/session";
import { config } from "@/lib/config";
import { formatCurrency, titleCase } from "@/lib/utils";
import { AlertTriangle, FileText } from "lucide-react";
import type {
  EngagementStatus,
  OperatorPermission,
  ProposalStatus,
  ProposalType,
  QualificationStatus,
} from "@/lib/operator-flow";

// ── shared fetch helpers ──────────────────────────────────────
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
  return res.json();
}
async function patchJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
  return res.json();
}
async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
  return res.json();
}

const qualTone: Record<QualificationStatus, Parameters<typeof Badge>[0]["tone"]> = {
  applicant: "neutral",
  under_review: "amber",
  approved: "green",
  suspended: "red",
};
const engTone: Record<EngagementStatus, Parameters<typeof Badge>[0]["tone"]> = {
  proposed: "amber",
  active: "green",
  expired: "neutral",
  revoked: "red",
  completed: "cyber",
};
const propTone: Record<ProposalStatus, Parameters<typeof Badge>[0]["tone"]> = {
  draft: "neutral",
  submitted: "amber",
  approved: "green",
  rejected: "red",
  withdrawn: "neutral",
};

const ALL_PERMISSIONS: OperatorPermission[] = [
  "view_campaign",
  "view_analytics",
  "draft_brief",
  "content_directions",
  "propose_creators",
  "prepare_budget",
  "review_deliverables",
];

export default function OperatorsPage() {
  const { role, isDemo, hydrated } = useSession();

  if (!config.operatorNetwork) {
    return (
      <div>
        <PageHeader title="Campaign Operators" subtitle="This module is disabled." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Campaign Operators"
        subtitle="Agencies and consultants manage brand campaigns with scoped access, brand approval on every consequential change, and transparent, separate compensation."
      />
      {isDemo && hydrated && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-slate-200 bg-ink-800/50 p-4 text-sm text-slate-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>
            You&apos;re in the <strong className="text-slate-900">demo workspace</strong>.
            The Operator Network runs against your real, Supabase-backed workspace —
            switch workspaces (top-right) and sign in to invite operators, accept
            engagements, and route proposals.
          </p>
        </div>
      )}
      {role === "operator" && <OperatorView />}
      {role === "business" && <BrandView />}
      {role === "admin" && <AdminView />}
      {role === "creator" && (
        <EmptyState
          title="Operators aren't part of the creator workspace"
          description="Creators are paid directly and separately from any operator fees. Nothing here affects your earnings."
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPERATOR VIEW — profile/application, engagements, proposals
// ─────────────────────────────────────────────────────────────
interface OperatorProfile {
  id: string;
  userId: string;
  displayName: string;
  status: QualificationStatus;
  specialties?: string[];
  portfolioUrl?: string;
  serviceFeeNote?: string;
  verifiedOutcomes?: number;
  repeatBrands?: number;
}
interface Engagement {
  id: string;
  orgId: string;
  operatorUserId: string;
  operatorName?: string;
  scopeNote?: string;
  campaignIds: string[];
  permissions: OperatorPermission[];
  serviceFee: number;
  feeModel: string;
  startAt?: string;
  expiresAt?: string;
  status: EngagementStatus;
  acceptedAt?: string;
}
interface Proposal {
  id: string;
  engagementId: string;
  campaignId?: string;
  type: ProposalType;
  title: string;
  version: number;
  status: ProposalStatus;
  financialImpact: number;
  rightsImpact?: string;
}

function OperatorView() {
  const qc = useQueryClient();
  const { data: prof } = useQuery({
    queryKey: ["operator-profile"],
    queryFn: () => getJSON<{ profile: OperatorProfile | null }>("/api/operators"),
  });
  const { data: engs } = useQuery({
    queryKey: ["engagements"],
    queryFn: () => getJSON<{ engagements: Engagement[] }>("/api/engagements"),
  });

  const profile = prof?.profile ?? null;
  const engagements = engs?.engagements ?? [];

  const accept = useMutation({
    mutationFn: (id: string) => patchJSON(`/api/engagements/${id}`, { action: "accept" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["engagements"] }),
  });

  return (
    <div className="space-y-8">
      <ApplicationCard profile={profile} />

      <div>
        <SectionLabel>Your engagements</SectionLabel>
        {engagements.length === 0 ? (
          <EmptyState
            title="No engagements yet"
            description="Once you're approved, brands can invite you with a specific scope. You get access to a campaign only after you accept — and only for what the brand granted."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {engagements.map((e) => (
              <Card key={e.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">
                    {e.scopeNote || `Engagement ${e.id.slice(0, 8)}`}
                  </p>
                  <Badge tone={engTone[e.status]}>{e.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {e.campaignIds.length} campaign(s) · {e.feeModel} fee ·{" "}
                  {formatCurrency(e.serviceFee)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.permissions.map((p) => (
                    <Badge key={p} tone="neutral">{p.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
                {e.status === "proposed" && (
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={accept.isPending}
                    onClick={() => accept.mutate(e.id)}
                  >
                    Accept engagement
                  </Button>
                )}
                {e.status === "active" && (
                  <ProposalComposer engagement={e} />
                )}
              </Card>
            ))}
          </div>
        )}
        {accept.isError && (
          <p className="mt-2 text-xs text-rose-300">{(accept.error as Error).message}</p>
        )}
      </div>

      <OperatorProposals />
    </div>
  );
}

function ApplicationCard({ profile }: { profile: OperatorProfile | null }) {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [specialties, setSpecialties] = useState(profile?.specialties?.join(", ") ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl ?? "");
  const [serviceFeeNote, setServiceFeeNote] = useState(profile?.serviceFeeNote ?? "");

  const apply = useMutation({
    mutationFn: () =>
      postJSON("/api/operators", {
        displayName,
        specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
        portfolioUrl,
        serviceFeeNote,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-profile"] }),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Operator profile</CardTitle>
          <p className="text-sm text-slate-500">
            Self-reported details. Admin approval is required before you can
            accept engagements — there is no paid certification.
          </p>
        </div>
        {profile && <Badge tone={qualTone[profile.status]}>{profile.status.replace(/_/g, " ")}</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {profile?.status === "approved" && (
          <div className="rounded-lg border border-signal-green/25 bg-signal-green/5 p-3 text-sm text-emerald-300">
            You&apos;re approved. Brands can now invite you.
          </div>
        )}
        {(profile?.verifiedOutcomes != null || profile?.repeatBrands != null) && (
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">Platform-verified:</span>{" "}
            {profile?.verifiedOutcomes ?? 0} verified outcomes ·{" "}
            {profile?.repeatBrands ?? 0} repeat brands. All other details above are
            self-reported.
          </p>
        )}
        <Field label="Display / agency name">
          <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Northwind Studio" />
        </Field>
        <Field label="Specialties (comma-separated)">
          <input className={inputCls} value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="UGC, paid social, TikTok" />
        </Field>
        <Field label="Portfolio URL">
          <input className={inputCls} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Service fee note (self-reported)">
          <input className={inputCls} value={serviceFeeNote} onChange={(e) => setServiceFeeNote(e.target.value)} placeholder="e.g. Flat retainer or per-campaign fee" />
        </Field>
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={apply.isPending || !displayName.trim()} onClick={() => apply.mutate()}>
            {profile ? "Update application" : "Apply as operator"}
          </Button>
          {apply.isSuccess && <span className="text-xs text-emerald-400">Saved.</span>}
          {apply.isError && <span className="text-xs text-rose-300">{(apply.error as Error).message}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

const PROPOSAL_TYPES: ProposalType[] = [
  "brief_draft",
  "content_directions",
  "creator_shortlist",
  "budget_change",
  "creator_comp_change",
  "operator_comp_change",
  "publish_campaign",
  "payout_release",
  "rights_grant",
];

function ProposalComposer({ engagement }: { engagement: Engagement }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ProposalType>("brief_draft");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: () =>
      postJSON("/api/proposals", {
        engagementId: engagement.id,
        campaignId: engagement.campaignIds[0],
        type,
        title,
        content: { notes },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["operator-proposals"] });
      setOpen(false);
      setTitle("");
      setNotes("");
    },
  });

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}>
        Draft a proposal
      </Button>
    );
  }
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3">
      <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as ProposalType)}>
        {PROPOSAL_TYPES.map((t) => (
          <option key={t} value={t}>{titleCase(t)}</option>
        ))}
      </select>
      <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proposal title" />
      <textarea className={inputCls} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Details for the brand to review" />
      <p className="text-[11px] text-slate-500">
        Consequential changes (budget, publish, payout, rights, compensation) are
        proposals only — they take effect after brand approval.
      </p>
      <div className="flex gap-2">
        <Button size="sm" disabled={create.isPending || !title.trim()} onClick={() => create.mutate()}>
          Submit for approval
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      {create.isError && <p className="text-xs text-rose-300">{(create.error as Error).message}</p>}
    </div>
  );
}

function OperatorProposals() {
  const qc = useQueryClient();
  const { data: engs } = useQuery({
    queryKey: ["engagements"],
    queryFn: () => getJSON<{ engagements: Engagement[] }>("/api/engagements"),
  });
  const engagementIds = (engs?.engagements ?? []).map((e) => e.id);
  const { data } = useQuery({
    queryKey: ["operator-proposals", engagementIds],
    queryFn: async () => {
      const results = await Promise.all(
        engagementIds.map((id) =>
          getJSON<{ proposals: Proposal[] }>(`/api/proposals?engagementId=${id}`),
        ),
      );
      return results.flatMap((r) => r.proposals);
    },
    enabled: engagementIds.length > 0,
  });
  const proposals = data ?? [];

  const submit = useMutation({
    mutationFn: (id: string) => patchJSON(`/api/proposals/${id}`, { action: "submit" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["operator-proposals"] }),
  });

  if (proposals.length === 0) return null;
  return (
    <div>
      <SectionLabel>Your proposals</SectionLabel>
      <ProposalTable
        proposals={proposals}
        action={(p) =>
          p.status === "draft" || p.status === "rejected" ? (
            <Button size="sm" variant="outline" disabled={submit.isPending} onClick={() => submit.mutate(p.id)}>
              Submit
            </Button>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          )
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BRAND VIEW — engagements + invite, proposals awaiting approval
// ─────────────────────────────────────────────────────────────
function BrandView() {
  const qc = useQueryClient();
  const { data: engs } = useQuery({
    queryKey: ["brand-engagements"],
    queryFn: () => getJSON<{ engagements: Engagement[] }>("/api/engagements"),
  });
  const engagements = engs?.engagements ?? [];

  const revoke = useMutation({
    mutationFn: (id: string) => patchJSON(`/api/engagements/${id}`, { action: "revoke" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-engagements"] }),
  });

  return (
    <div className="space-y-8">
      <InviteCard />
      <div>
        <SectionLabel>Engagements</SectionLabel>
        {engagements.length === 0 ? (
          <EmptyState title="No operators engaged yet" description="Invite an approved operator above with an explicit scope, fee, and time window." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {engagements.map((e) => (
              <Card key={e.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{e.operatorName ?? `Operator ${e.operatorUserId.slice(0, 8)}`}</p>
                  <Badge tone={engTone[e.status]}>{e.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {e.campaignIds.length} campaign(s) · {e.feeModel} · {formatCurrency(e.serviceFee)}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.permissions.map((p) => (
                    <Badge key={p} tone="neutral">{p.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
                {(e.status === "proposed" || e.status === "active") && (
                  <Button size="sm" variant="danger" className="mt-3" disabled={revoke.isPending} onClick={() => revoke.mutate(e.id)}>
                    Revoke access
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
        {revoke.isError && <p className="mt-2 text-xs text-rose-300">{(revoke.error as Error).message}</p>}
      </div>
      <BrandProposals />
    </div>
  );
}

interface DirectoryEntry {
  userId: string;
  displayName: string;
  specialties: string[];
  portfolioUrl?: string;
  verifiedOutcomes: number;
  repeatBrands: number;
}

function InviteCard() {
  const qc = useQueryClient();
  const { data: dir } = useQuery({
    queryKey: ["operator-directory"],
    queryFn: () => getJSON<{ directory: DirectoryEntry[] }>("/api/operators?view=directory"),
  });
  const directory = dir?.directory ?? [];
  const [operatorUserId, setOperatorUserId] = useState("");
  const selected = directory.find((d) => d.userId === operatorUserId);
  const [scopeNote, setScopeNote] = useState("");
  const [campaignIds, setCampaignIds] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [feeModel, setFeeModel] = useState("fixed");
  const [expiresAt, setExpiresAt] = useState("");
  const [permissions, setPermissions] = useState<OperatorPermission[]>(["view_campaign"]);

  const invite = useMutation({
    mutationFn: () =>
      postJSON("/api/engagements", {
        operatorUserId,
        scopeNote,
        campaignIds: campaignIds.split(",").map((s) => s.trim()).filter(Boolean),
        permissions,
        serviceFee: Number(serviceFee || 0),
        feeModel,
        expiresAt: expiresAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-engagements"] });
      setOperatorUserId("");
      setScopeNote("");
    },
  });

  const toggle = (p: OperatorPermission) =>
    setPermissions((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite an operator</CardTitle>
        <p className="text-sm text-slate-500">
          The operator must be admin-approved. Access begins only after they
          accept, and stays limited to the scope you grant here.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Operator">
          {directory.length === 0 ? (
            <p className="rounded border border-slate-200 bg-ink-800/50 px-2 py-2 text-xs text-slate-500">
              No approved operators are available yet. Operators appear here once
              an admin approves their application.
            </p>
          ) : (
            <select className={inputCls} value={operatorUserId} onChange={(e) => setOperatorUserId(e.target.value)}>
              <option value="">Select an approved operator…</option>
              {directory.map((d) => (
                <option key={d.userId} value={d.userId}>
                  {d.displayName}
                  {d.specialties.length > 0 ? ` — ${d.specialties.join(", ")}` : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
        {selected && (
          <div className="rounded-lg border border-slate-200 bg-ink-800/50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-900">{selected.displayName}</p>
            <p className="mt-0.5">
              {selected.verifiedOutcomes} verified outcomes · {selected.repeatBrands} repeat brands
              {selected.specialties.length > 0 ? ` · ${selected.specialties.join(", ")}` : ""}
            </p>
            {selected.portfolioUrl && (
              <a href={selected.portfolioUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-electric-600 hover:underline">
                View portfolio ↗
              </a>
            )}
          </div>
        )}
        <Field label="Scope note">
          <input className={inputCls} value={scopeNote} onChange={(e) => setScopeNote(e.target.value)} placeholder="e.g. Q4 TikTok launch — drafting + creator shortlist only" />
        </Field>
        <Field label="Campaign IDs (comma-separated)">
          <input className={inputCls} value={campaignIds} onChange={(e) => setCampaignIds(e.target.value)} placeholder="campaign uuid(s)" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service fee">
            <input className={inputCls} type="number" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Fee model">
            <select className={inputCls} value={feeModel} onChange={(e) => setFeeModel(e.target.value)}>
              <option value="fixed">Fixed</option>
              <option value="milestone">Milestone</option>
              {config.operatorPerformanceComp && <option value="performance">Performance</option>}
            </select>
          </Field>
        </div>
        <Field label="Expires at (optional)">
          <input className={inputCls} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-700">Permissions granted</p>
          <div className="flex flex-wrap gap-2">
            {ALL_PERMISSIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                className={
                  "rounded border px-2 py-1 text-xs " +
                  (permissions.includes(p)
                    ? "border-electric-500/40 bg-electric-500/10 text-electric-600"
                    : "border-slate-200 text-slate-500 hover:border-slate-400")
                }
              >
                {p.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={invite.isPending || !operatorUserId.trim()} onClick={() => invite.mutate()}>
            Send invitation
          </Button>
          {invite.isSuccess && <span className="text-xs text-emerald-400">Invited.</span>}
          {invite.isError && <span className="text-xs text-rose-300">{(invite.error as Error).message}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function BrandProposals() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["brand-proposals"],
    queryFn: () => getJSON<{ proposals: Proposal[] }>("/api/proposals"),
  });
  const proposals = data?.proposals ?? [];

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: "approved" | "rejected" }) =>
      patchJSON(`/api/proposals/${input.id}`, { action: "decide", decision: input.decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-proposals"] }),
  });

  return (
    <div>
      <SectionLabel>Proposals</SectionLabel>
      {proposals.length === 0 ? (
        <EmptyState title="No proposals yet" description="When an operator submits a brief, shortlist, or a consequential change, it lands here for your approval. You cannot approve your own proposal." />
      ) : (
        <ProposalTable
          proposals={proposals}
          action={(p) =>
            p.status === "submitted" ? (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ id: p.id, decision: "approved" })}>Approve</Button>
                <Button size="sm" variant="danger" disabled={decide.isPending} onClick={() => decide.mutate({ id: p.id, decision: "rejected" })}>Reject</Button>
              </div>
            ) : (
              <span className="text-xs text-slate-500">—</span>
            )
          }
        />
      )}
      {decide.isError && <p className="mt-2 text-xs text-rose-300">{(decide.error as Error).message}</p>}
      {config.operatorNetwork && (
        <p className="mt-3 text-[11px] text-slate-500">
          Approving records and audits the decision. In this first release the
          underlying change (publish, budget, payout, rights) is still applied by
          you through its normal control — the approval does not auto-execute it.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN VIEW — qualification queue + risk signals
// ─────────────────────────────────────────────────────────────
interface RiskSignal {
  id: string;
  kind: string;
  severity: "low" | "medium" | "high";
  subjectId?: string;
  status: string;
  createdAt: string;
}

function AdminView() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-operators"],
    queryFn: () => getJSON<{ operators: OperatorProfile[] }>("/api/operators"),
  });
  const { data: risk } = useQuery({
    queryKey: ["risk-signals"],
    queryFn: () => getJSON<{ signals: RiskSignal[] }>("/api/risk"),
  });
  const operators = data?.operators ?? [];
  const signals = risk?.signals ?? [];

  const review = useMutation({
    mutationFn: (input: { id: string; to: QualificationStatus }) =>
      patchJSON(`/api/operators/${input.id}`, { to: input.to }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-operators"] }),
  });

  const nextActions: Record<QualificationStatus, { to: QualificationStatus; label: string; variant: "primary" | "outline" | "danger" }[]> = {
    applicant: [
      { to: "under_review", label: "Start review", variant: "outline" },
      { to: "suspended", label: "Decline", variant: "danger" },
    ],
    under_review: [
      { to: "approved", label: "Approve", variant: "primary" },
      { to: "suspended", label: "Suspend", variant: "danger" },
    ],
    approved: [{ to: "suspended", label: "Suspend", variant: "danger" }],
    suspended: [{ to: "under_review", label: "Reinstate review", variant: "outline" }],
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Operator qualification</SectionLabel>
        {operators.length === 0 ? (
          <EmptyState title="No operator applications" description="Approved operators can be engaged by brands. There is no paid certification — qualification is a manual admin review of self-reported and platform-verified signals." />
        ) : (
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Operator</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Verified</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {operators.map((o) => (
                  <tr key={o.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{o.displayName}</p>
                      {o.specialties && o.specialties.length > 0 && (
                        <p className="text-xs text-slate-500">{o.specialties.join(", ")}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge tone={qualTone[o.status]}>{o.status.replace(/_/g, " ")}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {o.verifiedOutcomes ?? 0} outcomes · {o.repeatBrands ?? 0} repeat
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {nextActions[o.status].map((a) => (
                          <Button key={a.to} size="sm" variant={a.variant} disabled={review.isPending} onClick={() => review.mutate({ id: o.id, to: a.to })}>
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        {review.isError && <p className="mt-2 text-xs text-rose-300">{(review.error as Error).message}</p>}
      </div>

      <div>
        <SectionLabel>Risk signals</SectionLabel>
        {signals.length === 0 ? (
          <EmptyState title="No risk signals" description="Signals (self-referral, related-party, anomalies) are observations for review — never automatic penalties." />
        ) : (
          <div className="space-y-2">
            {signals.map((s) => (
              <Card key={s.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={"h-4 w-4 " + (s.severity === "high" ? "text-rose-400" : s.severity === "medium" ? "text-amber-400" : "text-slate-400")} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{titleCase(s.kind)}</p>
                    <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <Badge tone={s.severity === "high" ? "red" : s.severity === "medium" ? "amber" : "neutral"}>{s.severity}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── small shared bits ─────────────────────────────────────────
const inputCls =
  "h-9 w-full rounded border border-slate-200 bg-ink-700 px-2 text-sm text-slate-900 placeholder:text-slate-400 ring-focus";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ProposalTable({
  proposals,
  action,
}: {
  proposals: Proposal[];
  action: (p: Proposal) => React.ReactNode;
}) {
  return (
    <Card className="p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Proposal</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">Impact</th>
            <th className="px-4 py-2 font-medium">v</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {proposals.map((p) => (
            <tr key={p.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />{p.title}
                </span>
                {p.rightsImpact && <p className="text-[11px] text-amber-400">rights: {p.rightsImpact}</p>}
              </td>
              <td className="px-4 py-3 text-slate-600">{titleCase(p.type)}</td>
              <td className="px-4 py-3 text-slate-600">{p.financialImpact ? formatCurrency(p.financialImpact) : "—"}</td>
              <td className="px-4 py-3 text-slate-500">{p.version}</td>
              <td className="px-4 py-3"><Badge tone={propTone[p.status]}>{p.status}</Badge></td>
              <td className="px-4 py-3">{action(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
