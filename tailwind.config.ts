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
        // SHFTD — dark engineering-studio palette. Black primary surfaces,
        // warm cream (#eddeb7) headings/accent. Token names kept so existing
        // utility classes restyle app-wide.
        ink: {
          900: "#08080a", // page background (deeper black)
          800: "#101013", // subtle surface
          700: "#17171b", // card (lifted off the page)
          600: "#212128", // raised / hover
          500: "#34343d", // border-ish
        },
        // Neutral ramp REMAPPED to a dark-theme (inverted) scale so every
        // existing slate utility flips correctly: text-slate-900 = light text,
        // border-slate-200 = dark hairline, bg-slate-50 = lifted dark surface.
        slate: {
          50: "#1f1f24", // lifted nested surface (sits above cards)
          100: "#26262c",
          200: "#33333c", // main hairline border — brighter for separation
          300: "#44444e",
          400: "#78787f",
          500: "#a6a6ad",
          600: "#c7c7ce",
          700: "#dadade",
          800: "#ededf0",
          900: "#f6f6f7",
          950: "#ffffff",
        },
        // Secondary accent + heading color: warm cream. Used for headings (via
        // `header`) and as the single accent (links, active, focus, chips).
        electric: {
          DEFAULT: "#eddeb7",
          50: "#33301f",
          100: "#46412a",
          200: "#655c3b",
          300: "#9a8b5c",
          400: "#d0c091",
          500: "#eddeb7",
          600: "#eddeb7",
          700: "#f1e8cd",
          800: "#f6efdb",
          900: "#faf6e9",
        },
        // Tertiary accent: cool light steel to distinguish the "proven" path.
        cyber: {
          DEFAULT: "#cbd5e1",
          glow: "#e2e8f0",
        },
        // Headings: warm cream, legible on the black surfaces.
        header: {
          DEFAULT: "#eddeb7",
          light: "#f3e9cc",
        },
        // Status colors brightened for contrast on dark.
        signal: {
          green: "#34d399",
          amber: "#fbbf24",
          red: "#fb7185",
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
        // Subtle lift for depth against the deep-black page.
        glow: "0 1px 3px 0 rgba(0,0,0,0.5)",
        "glow-cyber": "0 1px 3px 0 rgba(0,0,0,0.5)",
        card: "0 1px 3px 0 rgba(0,0,0,0.5), 0 1px 0 0 rgba(255,255,255,0.02) inset",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        // Primary actions render as a warm cream fill (dark text on top).
        "electric-gradient":
          "linear-gradient(180deg, #f1e8cd 0%, #eddeb7 100%)",
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
