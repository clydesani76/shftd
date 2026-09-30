import { describe, it, expect } from "vitest";
import { seoToPromptContext } from "@/lib/intel/ahrefs";
import type { SeoComparison, DomainSeo } from "@/lib/ai/types";

const competitor: DomainSeo = {
  domain: "rival.com",
  domainRating: 72,
  ahrefsRank: 12345,
  orgTraffic: 240000,
  orgKeywords: 18000,
  orgKeywordsTop3: 900,
  orgTrafficValueUsd: 85000,
  paidTraffic: 5000,
  paidKeywords: 120,
  backlinks: 500000,
  refDomains: 4200,
  topKeywords: [
    { keyword: "electrolyte powder", volume: 90000, position: 1, traffic: 30000, difficulty: 44, branded: false },
    { keyword: "rival brand", volume: 12000, position: 1, traffic: 8000, difficulty: 5, branded: true },
  ],
  topPages: [{ url: "https://rival.com/hydration-guide", traffic: 40000, keywords: 1200, topKeyword: "how to hydrate" }],
};

describe("seoToPromptContext", () => {
  it("renders measured competitor facts as prompt context", () => {
    const seo: SeoComparison = {
      ok: true,
      country: "us",
      competitor,
      ours: null,
      keywordGaps: [
        { keyword: "electrolyte powder", volume: 90000, position: 1, traffic: 30000, difficulty: 44, branded: false },
      ],
      sharedKeywords: [],
    };
    const text = seoToPromptContext(seo);
    expect(text).toContain("MEASURED SEO");
    expect(text).toContain("rival.com");
    expect(text).toContain("Domain Rating 72");
    expect(text).toContain("electrolyte powder");
    // Traffic value is rendered in whole USD.
    expect(text).toContain("$85,000");
    // Keyword gaps surface as explicit openings.
    expect(text).toContain("KEYWORD GAPS");
  });

  it("returns an empty string when there is no usable data", () => {
    const empty: SeoComparison = {
      ok: false,
      country: "us",
      competitor: null,
      ours: null,
      keywordGaps: [],
      sharedKeywords: [],
      note: "Ahrefs not configured",
    };
    expect(seoToPromptContext(empty)).toBe("");
  });
});
