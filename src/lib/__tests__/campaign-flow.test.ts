import { describe, it, expect } from "vitest";
import {
  canTransitionCampaign,
  canReviewSubmission,
  derivePayoutObligations,
  newObligations,
  canMarkPaid,
  canResolveDispute,
} from "@/lib/campaign-flow";

describe("campaign lifecycle transitions", () => {
  it("allows the normal path", () => {
    expect(canTransitionCampaign("draft", "published", { briefApproved: true }).ok).toBe(true);
    expect(canTransitionCampaign("published", "live").ok).toBe(true);
    expect(canTransitionCampaign("live", "review").ok).toBe(true);
    expect(canTransitionCampaign("review", "completed").ok).toBe(true);
  });

  it("blocks publishing an unapproved brief", () => {
    const r = canTransitionCampaign("draft", "published", { briefApproved: false });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/approve the brief/i);
  });

  it("rejects illegal jumps", () => {
    expect(canTransitionCampaign("draft", "live").ok).toBe(false);
    expect(canTransitionCampaign("completed", "live").ok).toBe(false);
    expect(canTransitionCampaign("archived", "draft").ok).toBe(false);
    expect(canTransitionCampaign("live", "live").ok).toBe(false);
  });
});

describe("submission review transitions", () => {
  it("permits approve / reject / request revision from submitted", () => {
    expect(canReviewSubmission("submitted", "approved").ok).toBe(true);
    expect(canReviewSubmission("submitted", "rejected").ok).toBe(true);
    expect(canReviewSubmission("submitted", "revision_requested").ok).toBe(true);
  });
  it("lets a creator resubmit after a revision request", () => {
    expect(canReviewSubmission("revision_requested", "submitted").ok).toBe(true);
  });
  it("treats approved/rejected as terminal", () => {
    expect(canReviewSubmission("approved", "rejected").ok).toBe(false);
    expect(canReviewSubmission("rejected", "approved").ok).toBe(false);
  });
});

describe("payout obligations — idempotency & safety", () => {
  const terms = { basePay: 1000, bonus: 500, licensingFee: 0 };

  it("creates separate base pay and bonus entries, none marked paid", () => {
    const obs = derivePayoutObligations("sub_1", terms);
    expect(obs).toHaveLength(2);
    expect(obs.map((o) => o.type).sort()).toEqual(["base_pay", "performance_bonus"]);
    expect(obs.every((o) => o.status !== "paid")).toBe(true);
  });

  it("uses deterministic idempotency keys per submission+type", () => {
    const obs = derivePayoutObligations("sub_1", terms);
    expect(obs.find((o) => o.type === "base_pay")!.idempotencyKey).toBe("sub_1:base_pay");
  });

  it("never duplicates obligations on re-approval", () => {
    const obs = derivePayoutObligations("sub_1", terms);
    const existing = obs.map((o) => o.idempotencyKey); // already recorded once
    const secondPass = newObligations(derivePayoutObligations("sub_1", terms), existing);
    expect(secondPass).toHaveLength(0);
  });

  it("only creates the missing obligation the second time", () => {
    const first = derivePayoutObligations("sub_1", { basePay: 1000, bonus: 0, licensingFee: 0 });
    // Later a bonus is agreed and re-derived:
    const withBonus = derivePayoutObligations("sub_1", { basePay: 1000, bonus: 500, licensingFee: 0 });
    const toAdd = newObligations(withBonus, first.map((o) => o.idempotencyKey));
    expect(toAdd.map((o) => o.type)).toEqual(["performance_bonus"]);
  });

  it("holds an unusually large bonus for review (disputed)", () => {
    const obs = derivePayoutObligations("sub_2", { basePay: 100, bonus: 1000, licensingFee: 0 });
    expect(obs.find((o) => o.type === "performance_bonus")!.status).toBe("disputed");
  });
});

describe("mark-paid guardrails", () => {
  it("refuses a client-initiated paid transition", () => {
    expect(canMarkPaid("approved", "client").ok).toBe(false);
  });
  it("allows provider-confirmed payment", () => {
    expect(canMarkPaid("approved", "provider_confirmed").ok).toBe(true);
  });
  it("requires a reference for an admin-verified manual payment", () => {
    expect(canMarkPaid("approved", "admin_verified", { hasReference: false }).ok).toBe(false);
    expect(canMarkPaid("approved", "admin_verified", { hasReference: true }).ok).toBe(true);
  });
  it("won't pay a pending, disputed or already-paid obligation", () => {
    expect(canMarkPaid("pending", "admin_verified", { hasReference: true }).ok).toBe(false);
    expect(canMarkPaid("disputed", "admin_verified", { hasReference: true }).ok).toBe(false);
    expect(canMarkPaid("paid", "provider_confirmed").ok).toBe(false);
  });
});

describe("dispute resolution", () => {
  it("resolves a disputed obligation to approved or failed", () => {
    expect(canResolveDispute("disputed", "approved").ok).toBe(true);
    expect(canResolveDispute("disputed", "failed").ok).toBe(true);
  });
  it("won't resolve a non-disputed obligation", () => {
    expect(canResolveDispute("approved", "approved").ok).toBe(false);
    expect(canResolveDispute("pending", "failed").ok).toBe(false);
  });
});
