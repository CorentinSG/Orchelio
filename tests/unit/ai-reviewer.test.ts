import { describe, expect, it } from "vitest";

import { analyseMatter } from "@/lib/ai/analyst";
import { reviewAnalysis } from "@/lib/ai/reviewer";
import type { MatterAnalysisInput, MatterAnalysisResult } from "@/lib/ai/types";

/**
 * Orchelio — the Reviewer.
 *
 * A reviewer that always agrees is worse than no reviewer: it makes an
 * unchecked analysis look checked. So most of these tests hand it a *damaged*
 * analysis and insist it notices. A check that has never been seen to fail is
 * not a check.
 */

const FEATURES = [
  "document_summary",
  "entity_extraction",
  "timeline",
  "missing_documents",
  "inconsistency_detection",
  "consultation_questions",
];

const NOW = new Date("2026-07-28T09:00:00Z");

/**
 * A matter with a genuine disagreement: the record says the client last
 * entered on 11 February, the I-94's own filename says 4 March.
 *
 * Deliberately well filled in. A thin matter is reported as
 * `insufficient_information`, which would mask whatever else the reviewer
 * found — and these tests are about what it finds.
 */
const CONFLICTED: MatterAnalysisInput = {
  reference: "IMM-2026-999",
  title: "Test matter",
  practiceAreaKey: "immigration",
  matterTypeKey: "employment_based",
  status: "active",
  representationSide: null,
  fields: {
    current_status: "h1b",
    status_expiration_date: "2027-01-31",
    immigration_objective: "Extension of status.",
    nationality: "French",
    country_of_birth: "France",
    date_of_birth: "1990-11-02",
    dependants: 1,
    i94_available: true,
    last_entry_date: "2024-02-11",
    last_entry_classification: "H-1B",
    petitioner: "Test Systems LLC",
    employer: "Test Systems LLC",
    prior_removals: false,
    criminal_history_disclosed: false,
  },
  intake: { stated_last_entry_date: "11 February 2024" },
  documents: [
    {
      filename: "i94-entry-2024-03-04.pdf",
      category: "i94",
      receivedAt: "2026-07-01T00:00:00.000Z",
      verified: false,
    },
    {
      filename: "passport-test.pdf",
      category: "passport",
      receivedAt: "2026-07-01T00:00:00.000Z",
      verified: true,
    },
    {
      filename: "employment-letter.pdf",
      category: "employment_letter",
      receivedAt: "2026-07-02T00:00:00.000Z",
      verified: true,
    },
  ],
  enabledFeatures: FEATURES,
  now: NOW,
};

function damage(
  input: MatterAnalysisInput,
  change: (result: MatterAnalysisResult) => void,
): MatterAnalysisResult {
  const result = structuredClone(analyseMatter(input));
  change(result);
  return result;
}

describe("an analysis that is sound", () => {
  const analysis = analyseMatter(CONFLICTED);
  const review = reviewAnalysis({ analysis, matter: CONFLICTED });

  it("passes, and says a person must still read it", () => {
    expect(review.status).toBe("approved_for_human_review");
    expect(review.humanReviewRequired).toBe(true);
  });

  it("shows every check it ran, not only the failures", () => {
    // A clean review is only evidence if you can see what was looked at.
    expect(review.checks.length).toBeGreaterThanOrEqual(6);
    expect(review.checks.every((check) => check.passed)).toBe(true);
    expect(review.checks.every((check) => check.note.length > 0)).toBe(true);
  });

  it("does not call itself an approval", () => {
    expect(review.summary).toMatch(/ready for a person to read/i);
    expect(review.summary).not.toMatch(/\bapproved\b(?! for human)/i);
  });
});

describe("an analysis that missed a disagreement", () => {
  const analysis = damage(CONFLICTED, (result) => {
    result.contradictions = [];
  });
  const review = reviewAnalysis({ analysis, matter: CONFLICTED });

  it("finds it independently, from the matter rather than from the analysis", () => {
    const missed = review.issues.filter((issue) => issue.category === "missed_contradiction");

    expect(missed).toHaveLength(1);
    expect(missed[0]!.where).toBe("Date of last entry");
  });

  it("says what the analysis should have said", () => {
    const missed = review.issues.find((i) => i.category === "missed_contradiction")!;

    expect(missed.detail).toContain("11 February 2024");
    expect(missed.detail).toContain("4 March 2024");
  });

  it("demands corrections", () => {
    expect(review.status).toBe("corrections_required");
  });
});

describe("an analysis that reached a legal conclusion", () => {
  const cases: { text: string; what: string }[] = [
    { text: "The client is eligible for an extension of status.", what: "eligibility" },
    { text: "The termination was unlawful.", what: "unlawfulness" },
    { text: "We recommend filing before the end of the month.", what: "a recommendation" },
    { text: "The client qualifies for naturalisation.", what: "eligibility" },
    { text: "This claim is likely to succeed.", what: "a prediction" },
    { text: "The deadline is 30 September 2026.", what: "a confirmed deadline" },
    { text: "The employer's conduct constitutes retaliation.", what: "a characterisation" },
    { text: "The client has a strong case.", what: "merits" },
  ];

  for (const { text, what } of cases) {
    it(`catches ${what}: "${text}"`, () => {
      const analysis = damage(CONFLICTED, (result) => {
        result.summary = `${result.summary} ${text}`;
      });
      const review = reviewAnalysis({ analysis, matter: CONFLICTED });

      expect(review.issues.some((i) => i.category === "premature_legal_conclusion")).toBe(true);
      expect(review.status).toBe("corrections_required");
    });
  }

  it("catches one hidden in a question rather than the summary", () => {
    const analysis = damage(CONFLICTED, (result) => {
      result.attorneyQuestions.push({
        question: "Shall we proceed given the client is eligible?",
        why: "Because the client qualifies for it.",
      });
    });

    expect(
      reviewAnalysis({ analysis, matter: CONFLICTED }).issues.some(
        (i) => i.category === "premature_legal_conclusion",
      ),
    ).toBe(true);
  });

  it("does not flag the client's own recorded words", () => {
    // A key fact's value is what the firm recorded about the client. Flagging
    // it would be flagging the client, not the product.
    const analysis = damage(CONFLICTED, (result) => {
      result.keyFacts.push({
        key: "protected_characteristic_alleged",
        label: "Protected characteristic alleged",
        value: "The client says the treatment was discriminatory.",
        support: "stated_only",
        sources: [{ kind: "intake", label: "Client intake" }],
        simulatedConfidence: 0.3,
      });
    });

    expect(
      reviewAnalysis({ analysis, matter: CONFLICTED }).issues.some(
        (i) => i.category === "premature_legal_conclusion",
      ),
    ).toBe(false);
  });
});

describe("an analysis that stated something with no source", () => {
  const analysis = damage(CONFLICTED, (result) => {
    result.keyFacts[0]!.sources = [];
  });
  const review = reviewAnalysis({ analysis, matter: CONFLICTED });

  it("is caught", () => {
    expect(review.issues.some((i) => i.category === "unsupported_statement")).toBe(true);
    expect(review.status).toBe("corrections_required");
  });
});

describe("an analysis that lost its cautions", () => {
  const analysis = damage(CONFLICTED, (result) => {
    result.warnings = result.warnings.filter((warning) => !warning.startsWith("No document"));
  });
  const review = reviewAnalysis({ analysis, matter: CONFLICTED });

  it("is caught, because the caveat is the honest part", () => {
    expect(review.status).toBe("corrections_required");
    expect(review.issues.some((issue) => issue.detail.includes("No document was opened"))).toBe(
      true,
    );
  });
});

describe("an analysis that dressed a remembered date as a read one", () => {
  const analysis = damage(CONFLICTED, (result) => {
    const event = result.timeline.find((candidate) => candidate.source.kind === "document");
    if (event) event.stated = true;
  });
  const review = reviewAnalysis({ analysis, matter: CONFLICTED });

  it("is caught", () => {
    expect(review.issues.some((i) => i.category === "date_presented_as_confirmed")).toBe(true);
  });
});

describe("a matter with too little on it", () => {
  const thin: MatterAnalysisInput = {
    ...CONFLICTED,
    fields: {},
    intake: {},
    documents: [],
  };
  const analysis = analyseMatter(thin);
  const review = reviewAnalysis({ analysis, matter: thin });

  it("is reported as a fact about the file, not about the client", () => {
    expect(review.status).toBe("insufficient_information");
    const issue = review.issues.find((i) => i.category === "insufficient_information")!;
    expect(issue.detail).toMatch(/not about the client's position/i);
  });

  it("still requires a human", () => {
    expect(review.humanReviewRequired).toBe(true);
  });
});

describe("when the analysis is both thin and wrong", () => {
  const thin: MatterAnalysisInput = { ...CONFLICTED, fields: {}, intake: {}, documents: [] };
  const analysis = damage(thin, (result) => {
    result.summary = "The client is eligible.";
  });

  it("asks for corrections first — a defect needs fixing whatever the file holds", () => {
    expect(reviewAnalysis({ analysis, matter: thin }).status).toBe("corrections_required");
  });
});
