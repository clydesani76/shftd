// Placeholder image provider — generates branded SVG "creative" tiles as data
// URLs. Fully offline and free, so image generation is demoable before an
// OpenAI key is configured (and as a graceful fallback if a live call fails).

import type { GeneratedImage, GenerateImageInput, ImageProvider } from "./types";

function svgDataUrl(prompt: string, seed: number): string {
  // Wrap the prompt onto a few lines so it reads inside the tile.
  const words = prompt.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 28) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
    if (lines.length >= 4) break;
  }
  if (line && lines.length < 4) lines.push(line.trim());
  const shown = lines.slice(0, 4);

  const hue = (seed * 47) % 360;
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const textEls = shown
    .map(
      (l, i) =>
        `<text x="60" y="${360 + i * 44}" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="700" fill="#ffffff">${escape(
          l,
        )}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="hsl(${hue}, 70%, 55%)"/>
      <stop offset="0.55" stop-color="#6c5ce7"/>
      <stop offset="1" stop-color="#00e0d1"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <text x="60" y="120" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="3" fill="rgba(255,255,255,0.7)">SHFTD · AI IMAGE PLACEHOLDER</text>
  ${textEls}
  <text x="60" y="960" font-family="Inter, system-ui, sans-serif" font-size="18" fill="rgba(255,255,255,0.65)">Add OPENAI_API_KEY to generate real images</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const placeholderImages: ImageProvider = {
  name: "placeholder",
  async generate({ prompt, count = 1 }: GenerateImageInput): Promise<GeneratedImage[]> {
    const n = Math.min(Math.max(count, 1), 4);
    return Array.from({ length: n }, (_, i) => ({
      url: svgDataUrl(prompt, i + 1),
      prompt,
    }));
  },
};
