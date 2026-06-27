import { cn } from "@/lib/utils";

// Progress bar (used for bonus tracking, confidence, budget split).
export function ProgressBar({
  value,
  max = 100,
  className,
  tone = "electric",
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "electric" | "cyber" | "green" | "amber";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const tones: Record<string, string> = {
    electric: "bg-electric-gradient",
    cyber: "bg-cyber",
    green: "bg-signal-green",
    amber: "bg-signal-amber",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/5", className)}>
      <div
        className={cn("h-full rounded-full transition-all", tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-ink-800/40 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-electric-300">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-medium text-white">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Page header used across dashboard pages.
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </p>
  );
}
