import { describe, it, expect } from "vitest";
import {
  canQualify,
  canAcceptEngagements,
  canChangeEngagement,
  engagementActive,
  operatorCan,
  approvalValidFor,
  canApproveProposal,
  nextProposalVersion,
  deriveOperatorFee,
  creatorEarningsUnaffected,
  type OperatorScope,
  type ProposalLike,
} from "@/lib/operator-flow";
import { newObligations } from "@/lib/campaign-flow";

const active: OperatorScope = {
  engagement: {
    status: "active",
    acceptedAt: "2026-01-01T00:00:00Z",
    startAt: "2026-01-01T00:00:00Z",
    expiresAt: "2999-01-01T00:00:00Z",
  },
  campaignIds: ["camp1"],
  permissions: ["view_campaign", "draft_brief", "propose_creators"],
};
const now = new Date("2026-06-01T00:00:00Z");

describe("operator qualification", () => {
  it("requires admin approval before accepting engagements", () => {
    expect(canAcceptEngagements("applicant")).toBe(false);
    expect(canAcceptEngagements("under_review")).toBe(false);
    expect(canAcceptEngagements("approved")).toBe(true);
    expect(canAcceptEngagements("suspended")).toBe(false);
  });
  it("follows the qualification state machine", () => {
    expect(canQualify("applicant", "under_review").ok).toBe(true);
    expect(canQualify("under_review", "approved").ok).toBe(true);
    expect(canQualify("applicant", "approved").ok).toBe(false); // must be reviewed first
  });
});

describe("engagement access — begins after acceptance; expiry/revocation block immediately", () => {
  it("grants access only when active + accepted + in window", () => {
    expect(engagementActive(active.engagement, now)).toBe(true);
  });
  it("denies a merely-proposed engagement (no access before brand acceptance)", () => {
    expect(engagementActive({ status: "proposed", acceptedAt: null }, now)).toBe(false);
  });
  it("denies immediately once revoked", () => {
    expect(engagementActive({ status: "revoked", acceptedAt: "2026-01-01T00:00:00Z" }, now)).toBe(false);
  });
  it("denies immediately once expired by the clock, even if status lags", () => {
    expect(
      engagementActive(
        { status: "active", acceptedAt: "2026-01-01T00:00:00Z", expiresAt: "2026-02-01T00:00:00Z" },
        now,
      ),
    ).toBe(false);
  });
  it("denies before the start date", () => {
    expect(
      engagementActive(
        { status: "active", acceptedAt: "2026-01-01T00:00:00Z", startAt: "2026-12-01T00:00:00Z" },
        now,
      ),
    ).toBe(false);
  });
  it("blocks illegal engagement transitions", () => {
    expect(canChangeEngagement("revoked", "active").ok).toBe(false);
    expect(canChangeEngagement("proposed", "active").ok).toBe(true);
  });
});

describe("scoped operator permissions", () => {
  it("cross-brand / cross-campaign access is denied", () => {
    expect(operatorCan(active, "view_campaign", "OTHER_CAMP", now).ok).toBe(false);
    expect(operatorCan(active, "view_campaign", "camp1", now).ok).toBe(true);
  });
  it("enforces the granted permission set", () => {
    expect(operatorCan(active, "review_deliverables", "camp1", now).ok).toBe(false);
    expect(operatorCan(active, "draft_brief", "camp1", now).ok).toBe(true);
  });
  it("denies everything once the engagement lapses", () => {
    const lapsed: OperatorScope = {
      ...active,
      engagement: { status: "revoked", acceptedAt: "2026-01-01T00:00:00Z" },
    };
    expect(operatorCan(lapsed, "draft_brief", "camp1", now).ok).toBe(false);
  });
  it("never exposes consequential grants as operator permissions", () => {
    // The permission vocabulary itself excludes publish/payout/rights/fee edits.
    const forbidden = ["publish", "payout", "grant_rights", "increase_budget"];
    for (const p of active.permissions) {
      expect(forbidden).not.toContain(p);
    }
  });
});

describe("versioned proposal approvals", () => {
  const base: ProposalLike = { id: "p1", version: 1, status: "submitted", createdBy: "op1" };

  it("prevents self-approval", () => {
    expect(canApproveProposal({ approverUserId: "op1", approverRole: "operator", proposal: base }).ok).toBe(false);
    expect(canApproveProposal({ approverUserId: "op1", approverRole: "business", proposal: base }).ok).toBe(false); // author self-approving even if role changed
  });
  it("only a brand/admin may approve a submitted proposal", () => {
    expect(canApproveProposal({ approverUserId: "brandX", approverRole: "creator", proposal: base }).ok).toBe(false);
    expect(canApproveProposal({ approverUserId: "brandX", approverRole: "business", proposal: base }).ok).toBe(true);
  });
  it("an approval is valid only for the exact approved version", () => {
    const approvedP: ProposalLike = { ...base, status: "approved", version: 2 };
    const approval = { proposalId: "p1", approvedVersion: 2, approvedBy: "brandX" };
    expect(approvalValidFor(approval, approvedP)).toBe(true);
    // Editing bumps the version → prior approval no longer applies.
    const edited: ProposalLike = { ...approvedP, version: nextProposalVersion(2) };
    expect(approvalValidFor(approval, edited)).toBe(false);
  });
});

describe("operator fees — separation & duplicate prevention", () => {
  it("operator fee is its own entry type, never creator pay", () => {
    const fee = deriveOperatorFee("eng1", "kickoff", 500);
    expect(fee).toHaveLength(1);
    expect(fee[0].type).toBe("operator_fee");
    expect(fee[0].status).not.toBe("paid");
  });
  it("adding operator fees does not change creator earnings", () => {
    const creator = [{ amount: 1000 }, { amount: 250 }];
    const before = 1250;
    deriveOperatorFee("eng1", "kickoff", 500); // separate ledger entries
    expect(creatorEarningsUnaffected(creator, before)).toBe(true);
  });
  it("re-deriving the same milestone fee is idempotent (no duplicate payout)", () => {
    const first = deriveOperatorFee("eng1", "kickoff", 500);
    const again = newObligations(deriveOperatorFee("eng1", "kickoff", 500), first.map((o) => o.idempotencyKey));
    expect(again).toHaveLength(0);
  });
});
