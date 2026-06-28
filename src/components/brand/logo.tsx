import { cn } from "@/lib/utils";

// SHFTD wordmark with the silver "double-S / infinity" brand mark.
// The mark is drawn as a metallic-gradient infinity stroke (an interpretation
// of the supplied logo) so it scales crisply at any size on a light theme.
//
// To use a pixel-exact PNG instead: drop the file at /public/logo.png and
// swap <LogoMark/> below for <img src="/logo.png" className="h-8 w-auto" />.
export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8" />
      <div className="leading-none">
        <span className="text-lg font-bold tracking-tight text-slate-900">
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

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 44"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="shftd-silver" x1="0" y1="0" x2="64" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4f5f8" />
          <stop offset="0.4" stopColor="#c2c6cf" />
          <stop offset="0.7" stopColor="#7d828e" />
          <stop offset="1" stopColor="#b9bdc7" />
        </linearGradient>
      </defs>
      {/* Interlocking double-S / infinity stroke */}
      <path
        d="M32 22
           C32 9 13 9 13 22
           C13 35 32 35 32 22
           C32 9 51 9 51 22
           C51 35 32 35 32 22 Z"
        stroke="url(#shftd-silver)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
