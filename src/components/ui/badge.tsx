import { cn } from "@/lib/utils";
import type {
  ApplicationStatus,
  CampaignPath,
  CampaignStatus,
  InsightCategory,
  RiskLevel,
  SubmissionStatus,
} from "@/types";

export function Badge({
  className,
  children,
  tone = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  tone?:
    | "neutral"
    | "electric"
    | "cyber"
    | "green"
    | "amber"
    | "red"
    | "violet";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/5 text-slate-300 border-white/10",
    electric: "bg-electric-500/15 text-electric-200 border-electric-500/30",
    cyber: "bg-cyber/10 text-cyber border-cyber/30",
    green: "bg-signal-green/10 text-signal-green border-signal-green/30",
    amber: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
    red: "bg-signal-red/10 text-signal-red border-signal-red/30",
    violet: "bg-electric-500/15 text-electric-200 border-electric-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Semantic badges ───────────────────────────────────────────

export function PathBadge({ path }: { path: CampaignPath }) {
  return path === "proven" ? (
    <Badge tone="cyber">Safe &amp; Proven</Badge>
  ) : (
    <Badge tone="electric">Bold &amp; Original</Badge>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const tone = risk === "low" ? "green" : risk === "medium" ? "amber" : "red";
  return <Badge tone={tone}>{risk} risk</Badge>;
}

const statusTone: Record<CampaignStatus, Parameters<typeof Badge>[0]["tone"]> = {
  draft: "neutral",
  published: "cyber",
  live: "green",
  review: "amber",
  completed: "violet",
  archived: "neutral",
};
export function StatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}

const insightTone: Record<InsightCategory, Parameters<typeof Badge>[0]["tone"]> =
  {
    winning_pattern: "green",
    overused_angle: "amber",
    white_space: "electric",
  };
const insightLabel: Record<InsightCategory, string> = {
  winning_pattern: "Winning Pattern",
  overused_angle: "Overused Angle",
  white_space: "White Space",
};
export function InsightBadge({ category }: { category: InsightCategory }) {
  return <Badge tone={insightTone[category]}>{insightLabel[category]}</Badge>;
}

export function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const tone =
    status === "accepted"
      ? "green"
      : status === "rejected"
        ? "red"
        : status === "invited"
          ? "cyber"
          : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  const tone =
    status === "approved"
      ? "green"
      : status === "rejected"
        ? "red"
        : status === "revision_requested"
          ? "amber"
          : "cyber";
  const label = status.replace(/_/g, " ");
  return <Badge tone={tone}>{label}</Badge>;
}
