// ─────────────────────────────────────────────────────────────
// Authorization (pure, server-shared, unit-tested).
//
// The server NEVER trusts the client's role selector. Every sensitive action
// is checked against the authenticated Principal (whose role comes from the
// database) AND the owning org/creator of the target resource. This is what
// makes "switching the role selector or altering a URL" unable to access or
// change records that aren't yours.
// ─────────────────────────────────────────────────────────────

export type Role = "business" | "creator" | "admin";

export interface Principal {
  userId: string;
  role: Role;
  orgId: string | null; // business / admin
  creatorId: string | null; // creator
}

// Ownership of the resource being acted on. Any field left undefined is not
// checked (e.g. creating a resource has no existing owner yet).
export interface ResourceOwner {
  orgId?: string | null;
  creatorId?: string | null;
}

export type Action =
  | "campaign:create"
  | "campaign:approve_brief"
  | "campaign:transition"
  | "application:decide"
  | "submission:create"
  | "submission:review"
  | "ledger:pay"
  | "ledger:resolve"
  | "rights:propose"
  | "rights:decide";

// Which roles may perform each action, and how ownership is checked:
//   "org"     → the resource's org must match the principal's org
//   "creator" → the resource's creator must match the principal
//   "none"    → no ownership dimension (e.g. creating)
type OwnershipDim = "org" | "creator" | "none";

const MATRIX: Record<Action, { roles: Role[]; own: OwnershipDim }> = {
  "campaign:create": { roles: ["business", "admin"], own: "none" },
  "campaign:approve_brief": { roles: ["business", "admin"], own: "org" },
  "campaign:transition": { roles: ["business", "admin"], own: "org" },
  "application:decide": { roles: ["business", "admin"], own: "org" },
  "submission:create": { roles: ["creator"], own: "none" },
  "submission:review": { roles: ["business", "admin"], own: "org" },
  "ledger:pay": { roles: ["admin"], own: "none" },
  "ledger:resolve": { roles: ["admin"], own: "none" },
  "rights:propose": { roles: ["business", "admin"], own: "org" },
  "rights:decide": { roles: ["creator"], own: "creator" },
};

export interface AuthzResult {
  ok: boolean;
  status?: 401 | 403;
  reason?: string;
}

export function authorize(
  principal: Principal | null,
  action: Action,
  resource: ResourceOwner = {},
): AuthzResult {
  if (!principal) {
    return { ok: false, status: 401, reason: "Sign in to continue" };
  }
  const rule = MATRIX[action];
  if (!rule.roles.includes(principal.role)) {
    return {
      ok: false,
      status: 403,
      reason: `A ${principal.role} may not perform ${action}`,
    };
  }

  // Platform admins bypass org ownership (they operate across orgs).
  if (principal.role === "admin") return { ok: true };

  if (rule.own === "org" && resource.orgId != null) {
    if (resource.orgId !== principal.orgId) {
      return { ok: false, status: 403, reason: "Not your workspace's record" };
    }
  }
  if (rule.own === "creator" && resource.creatorId != null) {
    if (resource.creatorId !== principal.creatorId) {
      return { ok: false, status: 403, reason: "Not your submission" };
    }
  }
  return { ok: true };
}

// Convenience: does this principal own this org?
export function ownsOrg(principal: Principal | null, orgId: string): boolean {
  if (!principal) return false;
  if (principal.role === "admin") return true;
  return principal.orgId === orgId;
}
