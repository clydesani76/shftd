import { cn } from "@/lib/utils";
import { Card } from "./card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  accent = "electric",
}: {
  label: string;
  value: string;
  delta?: number; // percentage change; positive = up
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "electric" | "cyber" | "green" | "amber";
}) {
  const accents: Record<string, string> = {
    electric: "text-electric-300 bg-electric-500/10",
    cyber: "text-cyber bg-cyber/10",
    green: "text-signal-green bg-signal-green/10",
    amber: "text-signal-amber bg-signal-amber/10",
  };
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              accents[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              up ? "text-signal-green" : "text-signal-red",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </Card>
  );
}
