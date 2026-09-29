"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, SectionLabel } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrg } from "@/lib/data";
import { config } from "@/lib/config";
import { useSession } from "@/components/session";
import type { BusinessProfile } from "@/types";
import { Check, X } from "lucide-react";

export default function SettingsPage() {
  const { user } = useSession();
  const org = getOrg();
  const queryClient = useQueryClient();

  // Load the saved brand profile from the database.
  const { data: profile } = useQuery<BusinessProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      return data.profile;
    },
  });

  const [brandVoice, setBrandVoice] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState(0);
  const [saved, setSaved] = useState(false);

  // Seed the form once the profile arrives.
  useEffect(() => {
    if (profile) {
      setBrandVoice(profile.brandVoice);
      setAudience(profile.targetAudience);
      setBudget(profile.monthlyBudget);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandVoice,
          targetAudience: audience,
          monthlyBudget: budget,
          primaryGoals: profile?.primaryGoals,
          channels: profile?.channels,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const integrations = [
    { name: "Supabase (database & auth)", ok: config.hasSupabase },
    { name: "LLM provider (AI)", ok: config.hasAI },
    { name: "Stripe Connect (payouts)", ok: config.hasStripe },
    { name: "Meta / TikTok / GA4 (signals)", ok: false },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Brand profile, account, and integrations."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand profile</CardTitle>
              <p className="text-sm text-slate-500">
                Powers AI tone, audience targeting, and recommendations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Organization">
                <input
                  defaultValue={org.name}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 ring-focus"
                />
              </Field>
              <Field label="Brand voice">
                <textarea
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 py-2 text-sm text-slate-900 ring-focus"
                />
              </Field>
              <Field label="Target audience">
                <textarea
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 py-2 text-sm text-slate-900 ring-focus"
                />
              </Field>
              <Field label="Monthly budget (USD)">
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 ring-focus"
                />
              </Field>
              <div>
                <SectionLabel>Channels</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {(profile?.channels ?? []).map((c) => (
                    <Badge key={c} tone="cyber">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? "Saving…"
                  : saved
                    ? "Saved ✓"
                    : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Name" value={user.fullName} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role} />
            </CardContent>
          </Card>
        </div>

        {/* Integrations */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <p className="text-sm text-slate-500">
                {config.demoMode
                  ? "Running in demo mode with mock data."
                  : "Live services connected."}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {integrations.map((i) => (
                <div
                  key={i.name}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-ink-800/50 p-3"
                >
                  <span className="text-sm text-slate-600">{i.name}</span>
                  {i.ok ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <X className="h-3.5 w-3.5" /> Stubbed
                    </span>
                  )}
                </div>
              ))}
              <p className="pt-2 text-xs text-slate-500">
                Add API keys in <code className="text-slate-500">.env.local</code> to
                light these up. See <code className="text-slate-500">.env.example</code>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-200 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="capitalize text-slate-700">{value}</span>
    </div>
  );
}
