// Server-side data module: Creator applications (hybrid auth)
// Businesses browse openly (no login). Creators must be logged in (Supabase
// Auth) to apply. On first apply we bootstrap the creator's `users` +
// `creator_profiles` rows, then record the application.

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import {
  APPLICATIONS as MOCK_APPS,
  CREATORS as MOCK_CREATORS,
} from "@/lib/mock/data";
import type { ApplicationStatus, CreatorRole } from "@/types";

// Flattened application shape returned to the UI (includes creator display).
export interface AppView {
  id: string;
  campaignId: string;
  creatorId: string;
  creatorName: string;
  trustScore: number;
  role: CreatorRole;
  status: ApplicationStatus;
  pitch: string;
  appliedAt: string;
}

// Resolve (and bootstrap) the logged-in creator. Returns null if nobody is
// authenticated, which callers treat as "needs to sign in".
export async function getCurrentCreator(): Promise<{
  id: string;
  name: string;
} | null> {
  const auth = createServerSupabase();
  const db = createServiceSupabase();
  if (!auth || !db) return null;

  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Creator";

  // Ensure the app-level users row exists (id == auth user id).
  await db.from("users").upsert(
    { id: user.id, email: user.email ?? "", full_name: fullName, role: "creator" },
    { onConflict: "id" },
  );

  // Find or create the creator profile.
  const { data: existing } = await db
    .from("creator_profiles")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return existing as { id: string; name: string };

  const { data, error } = await db
    .from("creator_profiles")
    .insert({ user_id: user.id, name: fullName })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);
  return data as { id: string; name: string };
}

interface ApplicationRow {
  id: string;
  campaign_id: string;
  creator_id: string;
  role: CreatorRole;
  status: ApplicationStatus;
  pitch: string | null;
  applied_at: string;
  creator_profiles: { name: string; trust_score: number } | null;
}

export async function listApplications(campaignId?: string): Promise<AppView[]> {
  const db = createServiceSupabase();

  // Demo fallback: mock applications joined to mock creators.
  if (!db) {
    const apps = campaignId
      ? MOCK_APPS.filter((a) => a.campaignId === campaignId)
      : MOCK_APPS;
    return apps.map((a) => {
      const creator = MOCK_CREATORS.find((c) => c.id === a.creatorId);
      return {
        id: a.id,
        campaignId: a.campaignId,
        creatorId: a.creatorId,
        creatorName: creator?.name ?? "Creator",
        trustScore: creator?.trustScore ?? 0,
        role: a.role,
        status: a.status,
        pitch: a.pitch,
        appliedAt: a.appliedAt,
      };
    });
  }

  let query = db
    .from("campaign_applications")
    .select("*, creator_profiles(name, trust_score)")
    .order("applied_at", { ascending: false });
  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    creatorId: r.creator_id,
    creatorName: r.creator_profiles?.name ?? "Creator",
    trustScore: Number(r.creator_profiles?.trust_score ?? 0),
    role: r.role,
    status: r.status,
    pitch: r.pitch ?? "",
    appliedAt: r.applied_at,
  }));
}

export interface NewApplication {
  campaignId: string;
  role: CreatorRole;
  pitch: string;
}

// Throws "UNAUTHENTICATED" when no creator is logged in.
export async function createApplication(
  input: NewApplication,
): Promise<AppView> {
  const creator = await getCurrentCreator();
  if (!creator) throw new Error("UNAUTHENTICATED");
  const db = createServiceSupabase();
  if (!db) throw new Error("UNAUTHENTICATED");

  const { data, error } = await db
    .from("campaign_applications")
    .insert({
      campaign_id: input.campaignId,
      creator_id: creator.id,
      role: input.role,
      status: "applied",
      pitch: input.pitch || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const r = data as ApplicationRow;
  return {
    id: r.id,
    campaignId: r.campaign_id,
    creatorId: r.creator_id,
    creatorName: creator.name,
    trustScore: 50,
    role: r.role,
    status: r.status,
    pitch: r.pitch ?? "",
    appliedAt: r.applied_at,
  };
}
