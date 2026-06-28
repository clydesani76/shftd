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
        // SHFTD brand palette — minimal, futuristic, LIGHT.
        // (Token names kept as "ink" so existing bg-ink-* classes flip to
        // light surfaces app-wide. 900 = page background … 500 = borders.)
        ink: {
          900: "#ffffff", // page background
          800: "#f7f8fb", // subtle surface
          700: "#ffffff", // card
          600: "#f1f3f8", // raised card / hover
          500: "#e3e7ef", // border-ish
        },
        electric: {
          DEFAULT: "#6c5ce7",
          50: "#f0effe",
          100: "#e0ddfd",
          200: "#c2bbfb",
          300: "#a394f8",
          400: "#866ef2",
          500: "#6c5ce7",
          600: "#5640d6",
          700: "#4733b3",
          800: "#3a2c8f",
          900: "#312874",
        },
        cyber: {
          DEFAULT: "#00e0d1", // teal accent
          glow: "#22f5e6",
        },
        signal: {
          green: "#27e6a4",
          amber: "#ffb454",
          red: "#ff5a7a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 10px 40px -12px rgba(108, 92, 231, 0.35)",
        "glow-cyber": "0 10px 40px -12px rgba(0, 224, 209, 0.30)",
        card: "0 1px 2px 0 rgba(16,24,40,0.04), 0 8px 24px -16px rgba(16,24,40,0.18)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(16,24,40,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,24,40,0.04) 1px, transparent 1px)",
        "electric-gradient":
          "linear-gradient(135deg, #6c5ce7 0%, #00e0d1 100%)",
        "radial-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(108,92,231,0.10) 0%, rgba(255,255,255,0) 100%)",
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
