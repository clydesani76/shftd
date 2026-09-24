import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SHFTD — engineering-studio palette. Monochrome, high-contrast,
        // hairline-defined. Token names kept (ink/electric/cyber/header) so
        // existing utility classes restyle app-wide without churn.
        ink: {
          900: "#ffffff", // page background
          800: "#fafafa", // subtle surface
          700: "#ffffff", // card
          600: "#f4f4f5", // raised / hover
          500: "#e4e4e7", // border-ish
        },
        // Primary accent: a restrained cobalt used sparingly (links, active,
        // focus). Primary ACTIONS render near-black via `electric-gradient`.
        electric: {
          DEFAULT: "#1d55e0",
          50: "#eef4ff",
          100: "#dce7fe",
          200: "#c0d3fd",
          300: "#93b4fb",
          400: "#608ff6",
          500: "#2f6bf0",
          600: "#1d55e0",
          700: "#1a44bd",
          800: "#1a3b99",
          900: "#1b3679",
        },
        // Secondary accent: muted teal (not neon) for the "proven" path etc.
        cyber: {
          DEFAULT: "#0d9488",
          glow: "#14b8a6",
        },
        // Headings: near-black for high-contrast, developer-built feel.
        header: {
          DEFAULT: "#0f172a",
          light: "#334155",
        },
        signal: {
          green: "#059669",
          amber: "#d97706",
          red: "#e11d48",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        // Tighter, more precise corners than the default SaaS-rounded look.
        lg: "0.5rem",
        xl: "0.625rem",
        "2xl": "0.75rem",
      },
      boxShadow: {
        // Flat, border-defined surfaces — no colored glows.
        glow: "0 1px 2px 0 rgba(15,23,42,0.06)",
        "glow-cyber": "0 1px 2px 0 rgba(15,23,42,0.06)",
        card: "0 1px 2px 0 rgba(15,23,42,0.05)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)",
        // Primary actions: near-black with a hair of depth (no purple gradient).
        "electric-gradient":
          "linear-gradient(180deg, #1e293b 0%, #0a0a0a 100%)",
        "radial-glow": "none",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
