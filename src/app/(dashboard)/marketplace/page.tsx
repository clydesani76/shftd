"use client";

import { useState } from "react";
import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/misc";
import {
  getCampaign,
  getCreators,
  getMarketplace,
} from "@/lib/data";
import { useSession } from "@/components/session";
import { formatCurrency, titleCase } from "@/lib/utils";
import type { CreatorRole } from "@/types";
import { Star, Send, Check, Sparkles } from "lucide-react";

const ROLE_COPY: Record<CreatorRole, string> = {
  igniter: "Starts the campaign / movement",
  amplifier: "Expands and scales the idea",
  closer: "Drives conversions",
};

export default function MarketplacePage() {
  const { role } = useSession();
  const listings = getMarketplace();
  const creators = getCreators();
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const isCreator = role === "creator";

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
            <p className="font-medium text-white">{titleCase(r)}</p>
            <p className="mt-1 text-xs text-slate-400">{ROLE_COPY[r]}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open campaigns */}
        <div>
          <SectionLabel>Open campaigns</SectionLabel>
          <div className="space-y-3">
            {listings.map((m) => {
              const camp = getCampaign(m.campaignId);
              if (!camp) return null;
              const has = applied.has(m.id);
              return (
                <Card key={m.id} className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{camp.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{camp.goal}</p>
                    </div>
                    <Badge tone="green">
                      {formatCurrency(m.payRange.min)}–{formatCurrency(m.payRange.max)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.rolesNeeded.map((r) => (
                      <Badge key={r} tone="electric">
                        {titleCase(r)}
                      </Badge>
                    ))}
                    {camp.platforms.map((p) => (
                      <Badge key={p}>{p}</Badge>
                    ))}
                  </div>
                  {isCreator && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant={has ? "secondary" : "primary"}
                        disabled={has}
                        onClick={() =>
                          setApplied((prev) => new Set(prev).add(m.id))
                        }
                      >
                        {has ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Applied
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" /> Apply
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
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
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.niches.join(" · ")}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-signal-amber">
                    <Star className="h-3.5 w-3.5 fill-signal-amber" /> {c.trustScore}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-400">{c.bio}</p>

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

function shortFollowers(c: ReturnType<typeof getCreators>[number]) {
  const total = c.socialHandles.reduce((s, h) => s + h.followers, 0);
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(total);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-ink-800/50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
