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
        // SHFTD brand palette — minimal, futuristic, dark.
        ink: {
          900: "#06070d", // page background
          800: "#0a0c16", // surface
          700: "#10131f", // card
          600: "#171b2b", // raised card
          500: "#1e2336", // border-ish
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
        glow: "0 0 40px -10px rgba(108, 92, 231, 0.45)",
        "glow-cyber": "0 0 40px -10px rgba(0, 224, 209, 0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "electric-gradient":
          "linear-gradient(135deg, #6c5ce7 0%, #00e0d1 100%)",
        "radial-glow":
          "radial-gradient(60% 60% at 50% 0%, rgba(108,92,231,0.18) 0%, rgba(6,7,13,0) 100%)",
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
