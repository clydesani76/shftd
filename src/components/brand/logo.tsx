"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// SHFTD wordmark + brand mark.
//
// The mark uses your exact uploaded image at /public/logo.png if present.
// Until that file exists, it falls back to a silver SVG interpretation so the
// UI never shows a broken image. To use your exact logo: add the file at
// `public/logo.png` (see chat instructions) — no code change needed.
export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  const [useFallback, setUseFallback] = useState(false);

  // Subtle hover: a soft brand glow + slight lift on the mark. Scale is
  // gated behind motion-safe so reduced-motion users only get the glow.
  const markFx =
    "h-8 w-8 transition duration-300 ease-out group-hover:drop-shadow-[0_0_10px_rgba(108,92,231,0.45)] motion-safe:group-hover:scale-110";

  return (
    <div className={cn("group flex items-center gap-2.5", className)}>
      {useFallback ? (
        <LogoMark className={markFx} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt="SHFTD"
          className={cn(markFx, "object-contain")}
          onError={() => setUseFallback(true)}
        />
      )}
      <div className="leading-none">
        <span className="text-lg font-bold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-header">
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
    <svg viewBox="0 0 64 44" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="shftd-silver"
          x1="0"
          y1="0"
          x2="64"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f4f5f8" />
          <stop offset="0.4" stopColor="#c2c6cf" />
          <stop offset="0.7" stopColor="#7d828e" />
          <stop offset="1" stopColor="#b9bdc7" />
        </linearGradient>
      </defs>
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
