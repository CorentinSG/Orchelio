import { describe, expect, it } from "vitest";

import { DEMO_MATTERS, type DemoMatter } from "@/lib/demo/matters";
import { STANDING_WARNINGS, analyseMatter } from "@/lib/ai/analyst";
import { reviewAnalysis } from "@/lib/ai/reviewer";
import { SUPPORT_LEVELS, supportCaveat, type MatterAnalysisInput } from "@/lib/ai/types";

/**
 * Orchelio — the Analyst, against the six fictional matters.
 *
 * These are the phase's acceptance criteria, run against the same data the
 * seed writes rather than against fixtures invented for the test. If somebody
 * changes a demonstration matter, the assertion here changes with it — which
 * is the point: the analysis is *derived*, so the test is checking a rule, not
 * a stored answer.
 *
 * The two named in the roadmap are the interesting ones:
 *
 *  * Moreau must surface the entry-date contradiction and refuse to settle it.
 *  * Hassan must reach "more information required" and reach no conclusion.
 *
 * Vasquez is the control. Its document names carry dates too — and they agree
 * with the record, so the same rule that fires on Moreau must stay silent.
 */

const ALL_FEATURES = [
  "document_summary",
  "entity_extraction",
  "timeline",
  "employment_timeline",
  "missing_documents",
  "inconsistency_detection",
  "consultation_questions",
  "interview_questions",
];

const NOW = new Date("2026-07-28T09:00:00Z");

function demo(reference: string): DemoMatter {
  const matter = DEMO_MATTERS.find((candidate) => candidate.reference === reference);
  if (!matter) throw new Error(`No demonstration matter ${reference}`);
  return matter;
}

function inputFor(reference: string, features: readonly string[] = ALL_FEATURES): MatterAnalysisInput {
  const matter = demo(reference);
  return {
    reference: matter.reference,
    title: matter.title,
    practiceAreaKey: matter.practiceAreaKey,
    matterTypeKey: matter.matterTypeKey,
    status: matter.status,
    representationSide: matter.representationSide ?? null,
    fields: matter.fields,
    intake: matter.intake,
    documents: matter.documents.map((document) => ({
      filename: document.filename,
      category: document.category,
      // Relative to a fixed instant, exactly as the seed computes them.
      receivedAt: new Date(
        NOW.getTime() - document.receivedDaysAgo * 86_400_000,
      ).toISOString(),
      verified: document.verified,
    })),
    enabledFeatures: features,
    now: NOW,
  };
}

describe("the Moreau matter — a contradiction on the record", () => {
  const result = analyseMatter(inputFor("IMM-2026-002"));

  it("surfaces the disagreement over the date of entry", () => {
    const entry = result.contradictions.find((c) => c.key === "last_entry");

    expect(entry).toBeDefined();
    expect(entry!.subject).toBe("Date de dernière entrée");
  });

  it("shows both dates, and says where each came from", () => {
    const entry = result.contradictions.find((c) => c.key === "last_entry")!;
    const values = entry.statements.map((statement) => statement.value).join(" ");

    // The record says 11 February; the I-94's filename says 4 March. The
    // client's own intake words are quoted verbatim, so the raw string is
    // still there beside the formatted date.
    expect(values).toContain("11 février 2024");
    expect(values).toContain("4 mars 2024");
    expect(entry.statements.some((s) => s.source.kind === "matter_field")).toBe(true);
    expect(entry.statements.some((s) => s.source.kind === "document")).toBe(true);
  });

  it("refuses to resolve it", () => {
    const entry = result.contradictions.find((c) => c.key === "last_entry")!;

    expect(entry.note).toMatch(/question pour le client/i);
    // No version is nominated as the right one.
    expect(entry.note).not.toMatch(/la date (correcte|exacte) est|la bonne (date|version)|doit être (retenue|privilégiée)/i);
  });

  it("marks the disputed fact as disputed rather than merely stating it", () => {
    const fact = result.keyFacts.find((candidate) => candidate.key === "last_entry_date");

    expect(fact?.support).toBe("disputed");
    // The lowest score on the page: a disputed fact is the least safe thing in
    // the analysis, not something to be read past.
    const lowest = Math.min(...result.keyFacts.map((f) => f.simulatedConfidence));
    expect(fact!.simulatedConfidence).toBe(lowest);
  });

  it("asks the client rather than deciding", () => {
    const asked = result.clientQuestions.map((question) => question.question).join(" ");
    expect(asked.toLowerCase()).toContain("date de dernière entrée");
  });

  it("still has enough on file to be worth reviewing", () => {
    expect(result.sufficiency).toBe("sufficient_for_review");
  });
});

describe("the Hassan matter — not enough on file", () => {
  const result = analyseMatter(inputFor("IMM-2026-003"));

  it("reaches 'more information required'", () => {
    expect(result.sufficiency).toBe("more_information_required");
  });

  it("says so in the summary, in plain words", () => {
    expect(result.summary).toMatch(/informations supplémentaires sont requises/i);
  });

  it("says it is describing the gaps, not the client's position", () => {
    expect(result.warnings.join(" ")).toMatch(/ne dit rien de la position du client/i);
  });

  it("reaches no conclusion of any kind", () => {
    const review = reviewAnalysis({ analysis: result, matter: inputFor("IMM-2026-003") });
    const conclusionCheck = review.checks.find((check) =>
      check.name.startsWith("Aucune conclusion juridique"),
    );

    expect(conclusionCheck?.passed).toBe(true);
    expect(review.issues.filter((i) => i.category === "premature_legal_conclusion")).toEqual([]);
  });

  it("lists what is absent, with why each one matters", () => {
    expect(result.missingDocuments.length).toBeGreaterThan(0);
    for (const document of result.missingDocuments) {
      expect(document.whyItMatters.length).toBeGreaterThan(10);
      // Why it is useful, never what its absence proves.
      expect(document.whyItMatters).not.toMatch(/will fail|cannot succeed|fatal/i);
    }
  });
});

describe("the Vasquez matter — the control", () => {
  const input = inputFor("EMP-2026-002");
  const result = analyseMatter(input);

  it("finds no contradiction, because the record and the filenames agree", () => {
    // internal-complaint-2026-04-28.pdf matches complaint_date 2026-04-28;
    // termination-letter-2026-06-19.pdf matches termination_date 2026-06-19.
    // The rule that fires on Moreau must stay silent here.
    expect(result.contradictions).toEqual([]);
  });

  it("says plainly that nothing disagrees, rather than staying quiet", () => {
    expect(result.summary).toMatch(/Rien au dossier ne contredit/i);
  });

  it("reports the sequence of events without characterising it", () => {
    const labels = result.timeline.map((event) => event.label).join(" | ");
    const dates = result.timeline.map((event) => event.date);

    expect(labels).toMatch(/complaint/i);
    expect(labels).toMatch(/termination/i);
    // Ordered, so a reader can see the sequence for themselves.
    expect([...dates].sort()).toEqual(dates);
  });

  it("does not conclude that retaliation occurred", () => {
    const review = reviewAnalysis({ analysis: result, matter: input });

    expect(review.issues.filter((i) => i.category === "premature_legal_conclusion")).toEqual([]);
    expect(result.summary).not.toMatch(/retaliat|discriminat/i);
  });
});

describe("every demonstration matter", () => {
  for (const matter of DEMO_MATTERS) {
    describe(matter.reference, () => {
      const input = inputFor(matter.reference);
      const result = analyseMatter(input);

      it("carries every standing caution", () => {
        for (const warning of STANDING_WARNINGS) {
          expect(result.warnings).toContain(warning);
        }
      });

      it("says no document was opened", () => {
        // There is no upload and no OCR. An analysis citing "the I-94" without
        // this caveat would imply a capability the product does not have.
        expect(result.warnings.join(" ")).toMatch(/Aucun document n’a été ouvert/);
      });

      it("sources every fact it states", () => {
        for (const fact of result.keyFacts) {
          expect(fact.sources.length, fact.label).toBeGreaterThan(0);
        }
      });

      it("passes its own reviewer, except on sufficiency", () => {
        const review = reviewAnalysis({ analysis: result, matter: input });
        const defects = review.issues.filter((i) => i.category !== "insufficient_information");

        expect(defects, JSON.stringify(defects)).toEqual([]);
      });

      it("always requires a human", () => {
        const review = reviewAnalysis({ analysis: result, matter: input });
        expect(review.humanReviewRequired).toBe(true);
      });

      it("is deterministic", () => {
        // The same matter analysed twice gives the same result. It is what makes
        // these assertions mean anything.
        expect(analyseMatter(inputFor(matter.reference))).toEqual(result);
      });
    });
  }
});

describe("features the firm switched off", () => {
  it("produces nothing for a feature that is off", () => {
    const result = analyseMatter(inputFor("IMM-2026-002", ["document_summary"]));

    expect(result.contradictions).toEqual([]);
    expect(result.keyFacts).toEqual([]);
    expect(result.timeline).toEqual([]);
    expect(result.missingDocuments).toEqual([]);
  });

  it("does not mention a feature the firm never enabled", () => {
    const result = analyseMatter(inputFor("IMM-2026-002", ["document_summary"]));
    const named = [...result.featuresApplied, ...result.featuresQuiet.map((f) => f.feature)];

    expect(named).not.toContain("inconsistency_detection");
  });

  it("says an enabled feature found nothing, rather than leaving it ambiguous", () => {
    // A firm that switched on inconsistency detection should be told "nothing
    // disagreed", not left wondering whether it ran at all.
    const result = analyseMatter(inputFor("EMP-2026-002"));
    const quiet = result.featuresQuiet.find((f) => f.feature === "inconsistency_detection");

    expect(quiet).toBeDefined();
    expect(quiet!.because).toMatch(/Rien au dossier ne contredit/i);
  });

  it("uses the employment firm's name for the timeline feature", () => {
    // "Create a factual timeline" is `timeline` at an immigration firm and
    // `employment_timeline` at an employment one — the Phase 4 vocabulary.
    const employment = analyseMatter(inputFor("EMP-2026-001", ["employment_timeline"]));
    const wrongKey = analyseMatter(inputFor("EMP-2026-001", ["timeline"]));

    expect(employment.timeline.length).toBeGreaterThan(0);
    expect(wrongKey.timeline).toEqual([]);
  });
});

describe("how well supported a fact is", () => {
  const moreau = analyseMatter(inputFor("IMM-2026-002"));
  const fact = (key: string) => moreau.keyFacts.find((candidate) => candidate.key === key)!;

  it("never calls a fact corroborated because documents merely exist", () => {
    // The status expiration date is 30 September 2026. Two documents of a kind
    // that would normally show it are on file — and neither has been opened,
    // so nothing has agreed with anything. Calling that "two sources agree"
    // would be the single most misleading thing this product could say.
    expect(fact("status_expiration_date").support).toBe("document_on_file_checked");
    expect(SUPPORT_LEVELS).not.toContain("corroborated");
  });

  it("separates a document that agrees from one that is merely present", () => {
    // The Vasquez complaint date appears in the filename of the complaint
    // document itself, so the name can be checked against the record.
    const vasquez = analyseMatter(inputFor("EMP-2026-002"));
    const complaint = vasquez.keyFacts.find((f) => f.key === "complaint_date")!;

    expect(complaint.support).toBe("document_agrees");
    expect(complaint.simulatedConfidence).toBeGreaterThan(
      fact("status_expiration_date").simulatedConfidence,
    );
  });

  it("treats the client saying it twice as consistency, not evidence", () => {
    // The record and the intake both name the employer. Both came from the
    // client, so it is one account stated twice.
    expect(fact("employer").support).toBe("stated_twice");
    expect(fact("employer").simulatedConfidence).toBeLessThan(
      fact("nationality").simulatedConfidence,
    );
  });

  it("distinguishes a checked document from an unchecked one", () => {
    // passport-moreau.pdf is checked; i94-moreau-...pdf is not.
    expect(fact("nationality").support).toBe("document_on_file_checked");
    expect(fact("last_entry_classification").support).toBe("document_on_file");
    expect(fact("nationality").simulatedConfidence).toBeGreaterThan(
      fact("last_entry_classification").simulatedConfidence,
    );
  });

  it("says nothing supports a fact when nothing does", () => {
    expect(fact("dependants").support).toBe("stated_only");
  });

  it("caveats every level with what it does not mean", () => {
    for (const level of SUPPORT_LEVELS) {
      expect(supportCaveat(level).length).toBeGreaterThan(20);
    }
    // The two document levels must both say the contents were not read.
    expect(supportCaveat("document_agrees")).toMatch(/n’a pas été lu/i);
    expect(supportCaveat("document_on_file")).toMatch(/n’a pas été lu/i);
  });

  it("never scores anything as certain", () => {
    for (const candidate of moreau.keyFacts) {
      expect(candidate.simulatedConfidence).toBeLessThan(1);
      expect(candidate.simulatedConfidence).toBeGreaterThan(0);
    }
  });
});

describe("what an analysis may never contain", () => {
  it("has nowhere to put a conclusion", () => {
    const result = analyseMatter(inputFor("IMM-2026-001"));

    // Not "is empty" — absent from the shape entirely, so no future change can
    // fill it in without a deliberate decision. See LOCKED_APPROVALS.
    expect(result).not.toHaveProperty("conclusion");
    expect(result).not.toHaveProperty("recommendation");
    expect(result).not.toHaveProperty("eligibility");
    expect(result).not.toHaveProperty("advice");
  });

  it("never confirms a date", () => {
    const result = analyseMatter(inputFor("IMM-2026-002"));

    expect(result.warnings.join(" ")).toMatch(/aucune date ici n’est confirmée/i);
    // A date read from a document's name is not "stated by a person"; a date
    // from the record is. Every event says which.
    for (const event of result.timeline) {
      expect(typeof event.stated).toBe("boolean");
    }
  });
});
