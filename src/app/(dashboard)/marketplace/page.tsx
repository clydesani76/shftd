"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/misc";
import { getCreators } from "@/lib/data";
import { useSession } from "@/components/session";
import { cn, formatCurrency, titleCase } from "@/lib/utils";
import type { Campaign, CreatorRole } from "@/types";
import { Star, Send, Check, Sparkles } from "lucide-react";

const ROLE_COPY: Record<CreatorRole, string> = {
  igniter: "Starts the campaign / movement",
  amplifier: "Expands and scales the idea",
  closer: "Drives conversions",
};
const ROLES: CreatorRole[] = ["igniter", "amplifier", "closer"];

export default function MarketplacePage() {
  const { role } = useSession();
  const creators = getCreators();
  const isCreator = role === "creator";

  // Open campaigns are real campaigns that have been published or gone live.
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      return (await res.json()).campaigns ?? [];
    },
  });
  const openCampaigns = campaigns.filter(
    (c) => c.status === "published" || c.status === "live",
  );

  return (
    <div>
      <PageHeader
        title="Creator Marketplace"
        subtitle={
          isCreator
            ? "Browse open campaigns and apply for Igniter, Amplifier, or Closer roles."
            : "Published campaigns and the creators who can execute them."
        }
      />

      {/* Role explainer */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLE_COPY) as CreatorRole[]).map((r) => (
          <Card key={r} className="p-4">
            <p className="font-medium text-slate-900">{titleCase(r)}</p>
            <p className="mt-1 text-xs text-slate-500">{ROLE_COPY[r]}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open campaigns */}
        <div>
          <SectionLabel>Open campaigns</SectionLabel>
          <div className="space-y-3">
            {openCampaigns.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No open campaigns yet. Publish a campaign (and set it live) to
                open it to creators.
              </p>
            )}
            {openCampaigns.map((camp) => (
              <OpenCampaignCard key={camp.id} campaign={camp} isCreator={isCreator} />
            ))}
          </div>
        </div>

        {/* Creators */}
        <div>
          <SectionLabel>
            {isCreator ? "Top creators (your peers)" : "Recommended creators"}
          </SectionLabel>
          <div className="space-y-3">
            {creators.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-electric-gradient text-sm font-bold text-white">
                      {c.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.niches.join(" · ")}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-signal-amber" /> {c.trustScore}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-500">{c.bio}</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Followers" value={shortFollowers(c)} />
                  <Stat label="Eng. rate" value={`${c.avgEngagementRate}%`} />
                  <Stat label="Earned" value={formatCurrency(c.totalEarnings, true)} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1">
                    {c.roles.map((r) => (
                      <Badge key={r} tone="cyber">
                        {titleCase(r)}
                      </Badge>
                    ))}
                  </div>
                  {!isCreator && (
                    <Button size="sm" variant="outline">
                      <Sparkles className="h-3.5 w-3.5" /> Invite
                    </Button>
                  )}
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Trust score</span>
                    <span>{c.trustScore}/100</span>
                  </div>
                  <ProgressBar value={c.trustScore} tone="green" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// A single open-campaign card. Creators pick a role and apply; if they're not
// logged in, the server returns 401 and we send them to sign in.
function OpenCampaignCard({
  campaign,
  isCreator,
}: {
  campaign: Campaign;
  isCreator: boolean;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<CreatorRole>("igniter");
  const [applied, setApplied] = useState(false);
  const [pending, setPending] = useState(false);

  async function apply() {
    setPending(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, role: selectedRole }),
      });
      if (res.status === 401) {
        // Not signed in — send the creator to log in.
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to apply");
      setApplied(true);
    } catch {
      // leave un-applied so they can retry
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{campaign.goal}</p>
        </div>
        <Badge tone="green">{formatCurrency(campaign.budget, true)} budget</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {campaign.platforms.map((p) => (
          <Badge key={p}>{p}</Badge>
        ))}
      </div>

      {isCreator && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                disabled={applied}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  selectedRole === r
                    ? "border-electric-400/60 bg-electric-500/15 text-slate-900"
                    : "border-slate-200 text-slate-500 hover:text-slate-900",
                )}
              >
                {titleCase(r)}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant={applied ? "secondary" : "primary"}
            disabled={applied || pending}
            onClick={apply}
          >
            {applied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Applied
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> {pending ? "Applying…" : "Apply"}
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

function shortFollowers(c: ReturnType<typeof getCreators>[number]) {
  const total = c.socialHandles.reduce((s, h) => s + h.followers, 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(total);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-ink-800/50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
