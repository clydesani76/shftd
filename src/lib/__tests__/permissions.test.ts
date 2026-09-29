import { describe, it, expect } from "vitest";
import { authorize, ownsOrg, type Principal } from "@/lib/permissions";

const brandA: Principal = { userId: "u1", role: "business", orgId: "orgA", creatorId: null };
const brandB: Principal = { userId: "u2", role: "business", orgId: "orgB", creatorId: null };
const admin: Principal = { userId: "u3", role: "admin", orgId: "orgA", creatorId: null };
const creatorX: Principal = { userId: "u4", role: "creator", orgId: null, creatorId: "cX" };
const creatorY: Principal = { userId: "u5", role: "creator", orgId: null, creatorId: "cY" };

describe("authorization — unauthenticated", () => {
  it("rejects any action with 401 when there is no principal", () => {
    const r = authorize(null, "campaign:transition", { orgId: "orgA" });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(401);
  });
});

describe("authorization — role gating (role selector cannot escalate)", () => {
  it("a creator cannot review submissions or approve briefs", () => {
    expect(authorize(creatorX, "submission:review", { orgId: "orgA" }).status).toBe(403);
    expect(authorize(creatorX, "campaign:approve_brief", { orgId: "orgA" }).status).toBe(403);
  });
  it("a business cannot record payments (admin only)", () => {
    expect(authorize(brandA, "ledger:pay").status).toBe(403);
    expect(authorize(admin, "ledger:pay").ok).toBe(true);
  });
  it("only a creator can consent to rights", () => {
    expect(authorize(brandA, "rights:decide", { creatorId: "cX" }).status).toBe(403);
    expect(authorize(creatorX, "rights:decide", { creatorId: "cX" }).ok).toBe(true);
  });
});

describe("authorization — ownership (URL alteration cannot cross tenants)", () => {
  it("a brand cannot act on another org's campaign", () => {
    expect(authorize(brandA, "campaign:transition", { orgId: "orgA" }).ok).toBe(true);
    expect(authorize(brandB, "campaign:transition", { orgId: "orgA" }).status).toBe(403);
  });
  it("a brand cannot review another org's submission", () => {
    expect(authorize(brandB, "submission:review", { orgId: "orgA" }).status).toBe(403);
  });
  it("a creator cannot consent on another creator's rights", () => {
    expect(authorize(creatorY, "rights:decide", { creatorId: "cX" }).status).toBe(403);
    expect(authorize(creatorX, "rights:decide", { creatorId: "cX" }).ok).toBe(true);
  });
  it("a platform admin bypasses org ownership", () => {
    expect(authorize(admin, "submission:review", { orgId: "orgB" }).ok).toBe(true);
  });
});

describe("authorization — operator network", () => {
  const operator: Principal = { userId: "u6", role: "operator", orgId: null, creatorId: null };
  it("only an admin qualifies operators", () => {
    expect(authorize(brandA, "operator:review").status).toBe(403);
    expect(authorize(operator, "operator:review").status).toBe(403);
    expect(authorize(admin, "operator:review").ok).toBe(true);
  });
  it("only a brand/admin invites or revokes engagements, scoped to its org", () => {
    expect(authorize(operator, "engagement:invite", { orgId: "orgA" }).status).toBe(403);
    expect(authorize(brandA, "engagement:invite", { orgId: "orgA" }).ok).toBe(true);
    expect(authorize(brandB, "engagement:invite", { orgId: "orgA" }).status).toBe(403);
    expect(authorize(brandB, "engagement:revoke", { orgId: "orgA" }).status).toBe(403);
  });
  it("only an operator accepts an engagement", () => {
    expect(authorize(operator, "engagement:accept").ok).toBe(true);
    expect(authorize(brandA, "engagement:accept").status).toBe(403);
  });
  it("only a brand/admin of the owning org approves a proposal (operator cannot)", () => {
    expect(authorize(operator, "proposal:approve", { orgId: "orgA" }).status).toBe(403);
    expect(authorize(brandA, "proposal:approve", { orgId: "orgA" }).ok).toBe(true);
    expect(authorize(brandB, "proposal:approve", { orgId: "orgA" }).status).toBe(403);
    expect(authorize(admin, "proposal:approve", { orgId: "orgB" }).ok).toBe(true);
  });
});

describe("ownsOrg", () => {
  it("matches the principal's own org and admin-any", () => {
    expect(ownsOrg(brandA, "orgA")).toBe(true);
    expect(ownsOrg(brandA, "orgB")).toBe(false);
    expect(ownsOrg(admin, "orgB")).toBe(true);
    expect(ownsOrg(null, "orgA")).toBe(false);
  });
});
