"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Badge,
  StatusBadge,
  SubmissionBadge,
} from "@/components/ui/badge";
import {
  getCampaign,
  getCampaigns,
  getCreator,
  getCreators,
  getEvidence,
  getLedger,
  getSubmissions,
  getUsers,
} from "@/lib/data";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import { useSession } from "@/components/session";
import { EmptyState } from "@/components/ui/misc";
import { ShieldAlert } from "lucide-react";

const TABS = [
  "Users",
  "Campaigns",
  "Submissions",
  "Evidence",
  "Payouts",
  "Disputes",
] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const { role } = useSession();
  const [tab, setTab] = useState<Tab>("Users");

  if (role !== "admin") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admin access required"
        description="Switch to the Admin role (top-right) to view the platform control panel."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Manage the platform — users, content, payouts, and disputes."
      />

      <div className="mb-6 flex flex-wrap gap-1 border-b border-white/5">
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

      {tab === "Users" && <UsersTab />}
      {tab === "Campaigns" && <CampaignsTab />}
      {tab === "Submissions" && <SubmissionsTab />}
      {tab === "Evidence" && <EvidenceTab />}
      {tab === "Payouts" && <PayoutsTab />}
      {tab === "Disputes" && (
        <EmptyState
          icon={ShieldAlert}
          title="No open disputes"
          description="Creator/business disputes will appear here for resolution."
        />
      )}
    </div>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">{children}</tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const users = getUsers();
  const creators = getCreators();
  return (
    <Table head={["Name", "Email / Handle", "Role", "Action"]}>
      {users.map((u) => (
        <tr key={u.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3 font-medium text-white">{u.fullName}</td>
          <td className="px-4 py-3 text-slate-400">{u.email}</td>
          <td className="px-4 py-3">
            <Badge tone="electric">{titleCase(u.role)}</Badge>
          </td>
          <td className="px-4 py-3">
            <Button size="sm" variant="ghost">
              Manage
            </Button>
          </td>
        </tr>
      ))}
      {creators.map((c) => (
        <tr key={c.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3 font-medium text-white">{c.name}</td>
          <td className="px-4 py-3 text-slate-400">
            {c.socialHandles[0]?.handle}
          </td>
          <td className="px-4 py-3">
            <Badge tone="cyber">Creator</Badge>
          </td>
          <td className="px-4 py-3">
            <Button size="sm" variant="ghost">
              Manage
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function CampaignsTab() {
  const campaigns = getCampaigns();
  return (
    <Table head={["Campaign", "Path", "Status", "Budget", "Action"]}>
      {campaigns.map((c) => (
        <tr key={c.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3 font-medium text-white">{c.name}</td>
          <td className="px-4 py-3 text-slate-300">
            {c.path === "proven" ? "Safe & Proven" : "Bold & Original"}
          </td>
          <td className="px-4 py-3">
            <StatusBadge status={c.status} />
          </td>
          <td className="px-4 py-3 text-slate-300">{formatCurrency(c.budget, true)}</td>
          <td className="px-4 py-3">
            <Button size="sm" variant="ghost">
              Review
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function SubmissionsTab() {
  const submissions = getSubmissions();
  return (
    <Table head={["Creator", "Campaign", "Note", "Status", "Action"]}>
      {submissions.map((s) => (
        <tr key={s.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3 font-medium text-white">
            {getCreator(s.creatorId)?.name}
          </td>
          <td className="px-4 py-3 text-slate-400">
            {getCampaign(s.campaignId)?.name}
          </td>
          <td className="max-w-xs truncate px-4 py-3 text-slate-400">{s.note}</td>
          <td className="px-4 py-3">
            <SubmissionBadge status={s.status} />
          </td>
          <td className="px-4 py-3">
            <Button size="sm" variant="ghost">
              Moderate
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function EvidenceTab() {
  const evidence = getEvidence();
  return (
    <Table head={["Type", "Channel", "Content", "Action"]}>
      {evidence.map((e) => (
        <tr key={e.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3">
            <Badge tone="cyber">{titleCase(e.type)}</Badge>
          </td>
          <td className="px-4 py-3 text-slate-400">{e.channel}</td>
          <td className="max-w-md truncate px-4 py-3 text-slate-300">{e.content}</td>
          <td className="px-4 py-3">
            <Button size="sm" variant="ghost">
              Flag
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

function PayoutsTab() {
  const ledger = getLedger();
  return (
    <Table head={["Creator", "Campaign", "Type", "Amount", "Status", "Action"]}>
      {ledger.map((l) => (
        <tr key={l.id} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3 font-medium text-white">
            {getCreator(l.creatorId)?.name}
          </td>
          <td className="px-4 py-3 text-slate-400">
            {getCampaign(l.campaignId)?.name}
          </td>
          <td className="px-4 py-3 text-slate-300">{titleCase(l.type)}</td>
          <td className="px-4 py-3 text-white">{formatCurrency(l.amount)}</td>
          <td className="px-4 py-3">
            <Badge
              tone={
                l.status === "paid" ? "green" : l.status === "approved" ? "cyber" : "amber"
              }
            >
              {l.status}
            </Badge>
          </td>
          <td className="px-4 py-3">
            {l.status !== "paid" && (
              <Button size="sm" variant="outline">
                {l.status === "pending" ? "Approve" : "Mark paid"}
              </Button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}
