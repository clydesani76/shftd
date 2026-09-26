"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate, titleCase } from "@/lib/utils";
import type { RightsAgreement, RightsStatus, RightsUsage } from "@/types";
import { ShieldCheck, ChevronDown, Check, X } from "lucide-react";

const CHANNELS = ["Instagram", "TikTok", "YouTube", "Paid Social", "Email", "Website"];
const USAGES: RightsUsage[] = ["organic", "paid", "both"];

const rightsTone: Record<RightsStatus, Parameters<typeof Badge>[0]["tone"]> = {
  proposed: "amber",
  accepted: "green",
  declined: "red",
  revoked: "red",
  expired: "neutral",
};

// Per-deliverable UGC rights: propose (brand), consent (creator), and the full
// license history both sides can see. Real workspace only — demo is read-only.
export function RightsPanel({
  submissionId,
  isBrand,
  isCreator,
  userName,
}: {
  submissionId: string;
  isBrand: boolean;
  isCreator: boolean;
  userName: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [proposing, setProposing] = useState(false);

  const { data: rights = [] } = useQuery<RightsAgreement[]>({
    queryKey: ["rights", submissionId],
    enabled: open,
    queryFn: async () => {
      const res = await fetch(`/api/rights?submissionId=${submissionId}`);
      return (await res.json()).rights ?? [];
    },
  });

  const proposeMutation = useMutation({
    mutationFn: async (input: ProposeForm) => {
      const res = await fetch("/api/rights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, proposedBy: userName, ...input }),
      });
      if (!res.ok) throw new Error("Failed to propose");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rights", submissionId] });
      setProposing(false);
    },
  });

  const decideMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      decision: "accept" | "decline" | "revoke";
    }) => {
      const res = await fetch(`/api/rights/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: input.decision,
          consentedBy: userName,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rights", submissionId] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });

  const current = rights.find((r) => r.status === "accepted");
  const latestProposed = rights.find((r) => r.status === "proposed");

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" /> UGC rights
          {current && <Badge tone="green">Licensed</Badge>}
          {!current && latestProposed && <Badge tone="amber">Consent pending</Badge>}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Current license */}
          {current ? (
            <div className="rounded-md border border-signal-green/25 bg-signal-green/5 p-3 text-xs text-slate-600">
              <p className="font-medium text-emerald-300">Current license</p>
              <p className="mt-1">{describeRights(current)}</p>
              <p className="mt-1 text-slate-500">
                Consented by {current.consentedBy} ·{" "}
                {current.consentedAt ? formatDate(current.consentedAt) : ""}
              </p>
              {isCreator && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={decideMutation.isPending}
                  onClick={() =>
                    decideMutation.mutate({ id: current.id, decision: "revoke" })
                  }
                >
                  Revoke consent
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No rights granted yet. Content may not be used until the creator
              consents to a license.
            </p>
          )}

          {/* Creator consent on a pending proposal */}
          {isCreator && latestProposed && (
            <div className="rounded-md border border-signal-amber/25 bg-signal-amber/5 p-3 text-xs">
              <p className="font-medium text-amber-300">Rights proposed</p>
              <p className="mt-1 text-slate-600">{describeRights(latestProposed)}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  disabled={decideMutation.isPending}
                  onClick={() =>
                    decideMutation.mutate({ id: latestProposed.id, decision: "accept" })
                  }
                >
                  <Check className="h-3.5 w-3.5" /> Consent &amp; accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decideMutation.isPending}
                  onClick={() =>
                    decideMutation.mutate({ id: latestProposed.id, decision: "decline" })
                  }
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </Button>
              </div>
            </div>
          )}

          {/* Brand: propose rights */}
          {isBrand && !proposing && (
            <Button size="sm" variant="outline" onClick={() => setProposing(true)}>
              {current ? "Propose expanded rights" : "Propose rights"}
            </Button>
          )}
          {isBrand && proposing && (
            <ProposeForm
              onSubmit={(f) => proposeMutation.mutate(f)}
              onCancel={() => setProposing(false)}
              pending={proposeMutation.isPending}
            />
          )}

          {/* History */}
          {rights.length > 0 && (
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                License history
              </p>
              <ul className="space-y-1">
                {rights.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 text-xs text-slate-500"
                  >
                    <span>
                      {describeRights(r)}
                    </span>
                    <Badge tone={rightsTone[r.status]}>{r.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function describeRights(r: RightsAgreement): string {
  const parts = [
    r.channels.length ? r.channels.join(", ") : "no channels",
    `${titleCase(r.usage)} use`,
    r.durationDays ? `${r.durationDays}d` : "no term",
    r.territory || "no territory",
    r.editingAllowed ? "edits allowed" : "no edits",
    r.fee ? `${formatCurrency(r.fee)} fee` : "no fee",
    r.expiresAt ? `expires ${formatDate(r.expiresAt)}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

interface ProposeForm {
  channels: string[];
  usage: RightsUsage;
  durationDays: number;
  territory: string;
  editingAllowed: boolean;
  fee: number;
  expiresAt: string;
}

function ProposeForm({
  onSubmit,
  onCancel,
  pending,
}: {
  onSubmit: (f: ProposeForm) => void;
  onCancel: () => void;
  pending?: boolean;
}) {
  const [channels, setChannels] = useState<string[]>(["Instagram"]);
  const [usage, setUsage] = useState<RightsUsage>("organic");
  const [durationDays, setDurationDays] = useState("90");
  const [territory, setTerritory] = useState("Worldwide");
  const [editingAllowed, setEditingAllowed] = useState(false);
  const [fee, setFee] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const toggle = (c: string) =>
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

  const input =
    "h-8 rounded border border-slate-200 bg-ink-700 px-2 text-xs text-slate-900 placeholder:text-slate-400 ring-focus";

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2">
        <p className="mb-1 text-[11px] text-slate-500">Permitted channels</p>
        <div className="flex flex-wrap gap-1">
          {CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={cn(
                "rounded border px-2 py-0.5 text-[11px] transition-colors",
                channels.includes(c)
                  ? "border-electric-500/40 bg-electric-500/15 text-electric-700"
                  : "border-slate-200 text-slate-500",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-slate-500">
          Usage
          <select
            value={usage}
            onChange={(e) => setUsage(e.target.value as RightsUsage)}
            className={cn(input, "mt-1 block w-full")}
          >
            {USAGES.map((u) => (
              <option key={u} value={u}>
                {titleCase(u)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-slate-500">
          Duration (days)
          <input
            type="number"
            min={0}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className={cn(input, "mt-1 block w-full")}
          />
        </label>
        <label className="text-[11px] text-slate-500">
          Territory
          <input
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className={cn(input, "mt-1 block w-full")}
          />
        </label>
        <label className="text-[11px] text-slate-500">
          Licensing fee ($)
          <input
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className={cn(input, "mt-1 block w-full")}
          />
        </label>
        <label className="text-[11px] text-slate-500">
          Expires
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className={cn(input, "mt-1 block w-full")}
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={editingAllowed}
            onChange={(e) => setEditingAllowed(e.target.checked)}
          />
          Editing / derivatives allowed
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={pending || channels.length === 0}
          onClick={() =>
            onSubmit({
              channels,
              usage,
              durationDays: Number(durationDays || 0),
              territory,
              editingAllowed,
              fee: Number(fee || 0),
              expiresAt,
            })
          }
        >
          Propose to creator
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
