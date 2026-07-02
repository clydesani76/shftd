"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBusinessProfile } from "@/lib/data";
import { cn, titleCase } from "@/lib/utils";
import type { Campaign, CopyType } from "@/types";
import type { GeneratedCopy } from "@/lib/ai/types";
import {
  Sparkles,
  Copy,
  Check,
  Bookmark,
  PenLine,
  Image as ImageIcon,
  Download,
} from "lucide-react";

const COPY_TYPES: CopyType[] = [
  "hook",
  "headline",
  "caption",
  "cta",
  "script",
  "landing_page",
  "ad",
];
const TONES = ["Bold", "Rebellious", "Confident", "Curious", "Playful", "Premium"];
const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Email", "Landing Page"];

export default function CopyStudioPage() {
  const profile = getBusinessProfile();

  // Real campaigns for the "attach to campaign" dropdown, so saved copy links
  // to an actual campaign in the database.
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      return data.campaigns ?? [];
    },
  });

  const [mode, setMode] = useState<"copy" | "image">("copy");
  const [type, setType] = useState<CopyType>("hook");
  const [platform, setPlatform] = useState("TikTok");
  const [tone, setTone] = useState("Bold");
  const [campaignId, setCampaignId] = useState<string>("");
  const [audience, setAudience] = useState(profile.targetAudience);
  const [offer, setOffer] = useState("First-order ritual kit + subscribe & save 25%");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<GeneratedCopy[]>([]);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);

  async function generate() {
    setLoading(true);
    setSaved(new Set());
    try {
      const res = await fetch("/api/ai/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          platform,
          tone,
          audience,
          offer,
          brandVoice: profile.brandVoice,
          campaignName: campaigns.find((c) => c.id === campaignId)?.name,
          count: 4,
        }),
      });
      const data = await res.json();
      setVariants(data.variants);
    } finally {
      setLoading(false);
    }
  }

  function copyText(i: number, text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  }

  async function save(i: number, variant: GeneratedCopy) {
    // Persist the chosen variant to the database (optionally attached to the
    // selected campaign). Mark as saved on success.
    try {
      const res = await fetch("/api/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId || undefined,
          type: variant.type,
          platform: variant.platform,
          tone: variant.tone,
          content: variant.content,
          score: variant.score,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved((prev) => new Set(prev).add(i));
    } catch {
      // Leave unsaved so the user can retry.
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Copy Studio"
        subtitle="Generate scored, on-brand copy and imagery for your campaigns."
      />

      {/* Copy / Images mode toggle */}
      <div className="mb-6 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
        <button
          onClick={() => setMode("copy")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "copy"
              ? "bg-electric-500/15 text-slate-900"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          <PenLine className="h-4 w-4" /> Copy
        </button>
        <button
          onClick={() => setMode("image")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "image"
              ? "bg-electric-500/15 text-slate-900"
              : "text-slate-500 hover:text-slate-900",
          )}
        >
          <ImageIcon className="h-4 w-4" /> Images
        </button>
      </div>

      <div className={cn("grid gap-6 lg:grid-cols-3", mode !== "copy" && "hidden")}>
        {/* Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Brief</CardTitle>
            <p className="text-sm text-slate-500">Tune the inputs, then generate.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Copy type</Label>
              <div className="flex flex-wrap gap-1.5">
                {COPY_TYPES.map((t) => (
                  <Chip key={t} active={type === t} onClick={() => setType(t)}>
                    {titleCase(t)}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label>Attach to campaign (optional)</Label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 ring-focus"
              >
                <option value="">None</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Platform</Label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <Chip key={p} active={platform === p} onClick={() => setPlatform(p)}>
                    {p}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label>Tone</Label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <Chip key={t} active={tone === t} onClick={() => setTone(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label>Audience</Label>
              <textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 py-2 text-sm text-slate-900 ring-focus"
              />
            </div>
            <div>
              <Label>Offer</Label>
              <input
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-ink-700/60 px-3 text-sm text-slate-900 ring-focus"
              />
            </div>

            <Button className="w-full" onClick={generate} disabled={loading}>
              <Sparkles className="h-4 w-4" />
              {loading ? "Generating…" : "Generate copy"}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="lg:col-span-2">
          {variants.length === 0 ? (
            <Card className="flex h-full min-h-[300px] flex-col items-center justify-center p-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
                <PenLine className="h-6 w-6" />
              </div>
              <p className="font-medium text-slate-900">Your variants will appear here</p>
              <p className="mt-1 text-sm text-slate-500">
                Set a brief and hit generate. Each variant is scored for fit.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {variants
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((v, i) => (
                  <Card key={i} hover className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone="electric">{titleCase(v.type)}</Badge>
                        <span className="text-xs text-slate-500">
                          {v.platform} · {v.tone}
                        </span>
                      </div>
                      <ScorePill score={v.score} />
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">
                      {v.content}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyText(i, v.content)}
                      >
                        {copied === i ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied === i ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        size="sm"
                        variant={saved.has(i) ? "secondary" : "outline"}
                        onClick={() => save(i, v)}
                        disabled={saved.has(i)}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {saved.has(i) ? "Saved" : "Save"}
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>

      {mode === "image" && <ImagePanel />}
    </div>
  );
}

function ImagePanel() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<
    "1024x1024" | "1536x1024" | "1024x1536"
  >("1024x1024");
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ url: string; prompt: string }[]>([]);
  const [provider, setProvider] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, count }),
      });
      const data = await res.json();
      setImages(data.images ?? []);
      setProvider(data.provider ?? null);
    } finally {
      setLoading(false);
    }
  }

  function download(url: string, i: number) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `shftd-image-${i + 1}.${
      url.startsWith("data:image/svg") ? "svg" : "png"
    }`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const providerNote =
    provider === "openai"
      ? "Generated with OpenAI gpt-image-1"
      : provider === "placeholder" || provider === "placeholder-fallback"
        ? "Placeholder images — add OPENAI_API_KEY for real generation"
        : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Image brief</CardTitle>
          <p className="text-sm text-slate-500">Describe the visual you want.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Prompt</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. A bright, modern dental office with a smiling patient, soft daylight, clean minimalist style, room for text on the left"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ring-focus"
            />
          </div>
          <div>
            <Label>Aspect</Label>
            <div className="flex flex-wrap gap-1.5">
              {(["1024x1024", "1536x1024", "1024x1536"] as const).map((s) => (
                <Chip key={s} active={size === s} onClick={() => setSize(s)}>
                  {s === "1024x1024"
                    ? "Square"
                    : s === "1536x1024"
                      ? "Landscape"
                      : "Portrait"}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <Label>How many</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <Chip key={n} active={count === n} onClick={() => setCount(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            onClick={generate}
            disabled={loading || !prompt.trim()}
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating…" : "Generate images"}
          </Button>
          {providerNote && (
            <p className="text-center text-xs text-slate-500">{providerNote}</p>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {images.length === 0 ? (
          <Card className="flex h-full min-h-[300px] flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="font-medium text-slate-900">
              Your images will appear here
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Describe the visual and hit generate.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((img, i) => (
              <Card key={i} className="overflow-hidden p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="aspect-square w-full object-cover"
                />
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs text-slate-500">{size}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => download(img.url, i)}
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-slate-600">
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-electric-400/60 bg-electric-500/15 text-slate-900"
          : "border-slate-200 text-slate-500 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 88 ? "text-emerald-600" : score >= 78 ? "text-teal-600" : "text-amber-600";
  return (
    <span className={cn("text-sm font-semibold", tone)}>{score}/100</span>
  );
}
