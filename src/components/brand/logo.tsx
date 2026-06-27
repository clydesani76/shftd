import { cn } from "@/lib/utils";

// SHFTD wordmark. The chevron glyph nods to "shift / forward".
export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-electric-gradient shadow-glow">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17L12 12L7 7" />
          <path d="M13 17L18 12L13 7" />
        </svg>
      </span>
      <div className="leading-none">
        <span className="text-lg font-bold tracking-tight text-white">
          SHFTD
        </span>
        {showTagline && (
          <span className="block text-[10px] uppercase tracking-widest text-slate-500">
            Marketing OS
          </span>
        )}
      </div>
    </div>
  );
}
