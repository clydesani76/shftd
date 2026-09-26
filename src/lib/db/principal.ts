// Server-only: resolve the authenticated principal (identity + authoritative
// role + org/creator ownership) from the Supabase session.
//
// SECURITY: the role is taken from the `users` table, not the client and not
// the sign-up metadata — a user cannot self-assign "admin". On first sight we
// bootstrap the users row (clamped to business|creator), provision an org for a
// business/admin, and a creator_profile for a creator.

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import type { Principal, Role } from "@/lib/permissions";

export async function getPrincipal(): Promise<Principal | null> {
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
    "User";
  const requestedRole = user.user_metadata?.role as string | undefined;

  // Read the authoritative row. Never overwrite an existing role (so an admin
  // granted in the DB can't be downgraded, and metadata can't escalate).
  const { data: existing } = await db
    .from("users")
    .select("role, org_id")
    .eq("id", user.id)
    .maybeSingle();

  let dbRole: Role;
  let orgId: string | null;

  if (!existing) {
    // Clamp: sign-up metadata may only ask for business or creator — never admin.
    const safeRole: Role = requestedRole === "creator" ? "creator" : "business";
    await db
      .from("users")
      .insert({ id: user.id, email: user.email ?? "", full_name: fullName, role: safeRole });
    dbRole = safeRole;
    orgId = null;
  } else {
    dbRole = (existing.role as Role) ?? "business";
    orgId = (existing.org_id as string | null) ?? null;
  }

  if (dbRole === "creator") {
    const { data: cp } = await db
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    let creatorId = cp?.id as string | undefined;
    if (!creatorId) {
      const { data } = await db
        .from("creator_profiles")
        .insert({ user_id: user.id, name: fullName })
        .select("id")
        .single();
      creatorId = data?.id as string | undefined;
    }
    return { userId: user.id, role: "creator", orgId: null, creatorId: creatorId ?? null };
  }

  // business / admin — provision an org on first authentication.
  if (!orgId) {
    const slug = `ws-${user.id.slice(0, 8)}`;
    const { data: org } = await db
      .from("orgs")
      .insert({ name: `${fullName.split(" ")[0]}'s workspace`, slug })
      .select("id")
      .single();
    orgId = (org?.id as string | undefined) ?? null;
    if (orgId) await db.from("users").update({ org_id: orgId }).eq("id", user.id);
  }

  return {
    userId: user.id,
    role: dbRole === "admin" ? "admin" : "business",
    orgId,
    creatorId: null,
  };
}
