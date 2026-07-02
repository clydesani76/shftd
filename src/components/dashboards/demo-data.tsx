"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RotateCcw, Check } from "lucide-react";

// One-click demo data control. When the workspace is empty it offers to load
// sample competitors + campaigns so a live pitch never shows a blank slate;
// a Reset action re-seeds a clean set. Backed by /api/seed.
export function DemoData({ empty }: { empty: boolean }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<"seed" | "reset" | null>(null);
  const [done, setDone] = useState(false);

  async function run(reset: boolean) {
    setBusy(reset ? "reset" : "seed");
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset }),
      });
      if (!res.ok) throw new Error("Failed to seed");
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      // Silent — the button can be retried.
    } finally {
      setBusy(null);
    }
  }

  if (empty) {
    return (
      <Card className="mb-6 flex flex-col items-start gap-3 border-electric-500/30 bg-electric-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/15 text-electric-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Your workspace is empty
            </p>
            <p className="text-xs text-slate-500">
              Load sample competitors and campaigns to explore SHFTD with
              realistic data.
            </p>
          </div>
        </div>
        <Button onClick={() => run(false)} disabled={busy !== null}>
          {done ? (
            <>
              <Check className="h-4 w-4" /> Loaded
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              {busy === "seed" ? "Loading…" : "Load sample data"}
            </>
          )}
        </Button>
      </Card>
    );
  }

  // Non-empty: quiet reset affordance for re-running a clean demo.
  return (
    <div className="mb-6 flex justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => run(true)}
        disabled={busy !== null}
        title="Replace all demo data with a fresh sample set"
      >
        {done ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" /> Reset
          </>
        ) : (
          <>
            <RotateCcw className="h-3.5 w-3.5" />
            {busy === "reset" ? "Resetting…" : "Reset demo data"}
          </>
        )}
      </Button>
    </div>
  );
}
