// Server-side data module: Campaign image assets
// Persists AI-generated images from the Copy Studio. The image bytes are
// uploaded to Supabase Storage (bucket `campaign-images`) and a metadata row
// is written to `campaign_assets`. Falls back to an in-memory echo (returning
// the original data URL) when Supabase isn't configured, so the demo still
// "saves" images without a database.

import { randomUUID } from "crypto";
import { createServiceSupabase } from "@/lib/supabase/server";
import { DEMO_ORG_ID, ensureDemoOrg } from "@/lib/db/org";
import { tempId } from "@/lib/utils";
import type { CampaignAsset } from "@/types";

const BUCKET = "campaign-images";

interface AssetRow {
  id: string;
  org_id: string;
  campaign_id: string | null;
  url: string;
  prompt: string | null;
  size: string | null;
  provider: string | null;
  created_at: string;
}

function rowToAsset(r: AssetRow): CampaignAsset {
  return {
    id: r.id,
    orgId: r.org_id,
    campaignId: r.campaign_id ?? undefined,
    url: r.url,
    prompt: r.prompt ?? "",
    size: r.size ?? "",
    provider: r.provider ?? "",
    createdAt: r.created_at,
  };
}

// Only attach a campaign_id when it's a real database UUID (mirrors copy.ts),
// so saving an asset against a sample campaign id never trips the foreign key.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const realCampaignId = (id?: string) => (id && UUID_RE.test(id) ? id : null);

// Decode a data URL into raw bytes + a content type / file extension.
function decodeDataUrl(dataUrl: string): {
  bytes: Buffer;
  contentType: string;
  ext: string;
} {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Unsupported image data URL");
  const [, contentType, base64Flag, payload] = match;
  const bytes = base64Flag
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  const ext = contentType.includes("svg")
    ? "svg"
    : contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "bin";
  return { bytes, contentType, ext };
}

export async function listAssets(campaignId?: string): Promise<CampaignAsset[]> {
  const db = createServiceSupabase();
  if (!db) return [];

  let query = db
    .from("campaign_assets")
    .select("*")
    .order("created_at", { ascending: false });
  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as AssetRow[]).map(rowToAsset);
}

export interface NewAsset {
  campaignId?: string;
  dataUrl: string; // the generated image (base64 PNG or utf8 SVG data URL)
  prompt: string;
  size: string;
  provider: string;
}

export async function saveAsset(input: NewAsset): Promise<CampaignAsset> {
  const db = createServiceSupabase();

  // Demo fallback: echo the image back so the UI can show it as "saved"
  // without persistence.
  if (!db) {
    return {
      id: tempId("img"),
      orgId: DEMO_ORG_ID,
      campaignId: input.campaignId,
      url: input.dataUrl,
      prompt: input.prompt,
      size: input.size,
      provider: input.provider,
      createdAt: new Date().toISOString(),
    };
  }

  await ensureDemoOrg(db);

  // Ensure the public bucket exists (idempotent — ignore "already exists").
  try {
    await db.storage.createBucket(BUCKET, { public: true });
  } catch {
    // Bucket already exists or cannot be created here; upload will surface
    // any real problem below.
  }

  const { bytes, contentType, ext } = decodeDataUrl(input.dataUrl);
  const path = `${DEMO_ORG_ID}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = db.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await db
    .from("campaign_assets")
    .insert({
      org_id: DEMO_ORG_ID,
      campaign_id: realCampaignId(input.campaignId),
      url: publicUrl,
      prompt: input.prompt || null,
      size: input.size || null,
      provider: input.provider || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToAsset(data as AssetRow);
}
