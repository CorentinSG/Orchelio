import { afterEach, describe, expect, it, vi } from "vitest";

import { DEMO_MATTERS } from "@/lib/demo/matters";
import { analyseMatter } from "@/lib/ai/analyst";
import {
  LocalAIProvider,
  MODEL_WROTE_THE_SUMMARY,
  factsMessage,
  judgeSummary,
  tidy,
} from "@/lib/ai/local-provider";
import { NotLoopbackError } from "@/lib/ai/loopback";
import type { MatterAnalysisInput } from "@/lib/ai/types";

/**
 * Orchelio — the provider that uses a model on the firm's own machine.
 *
 * No model is installed in this repository and none is started here. What is
 * tested is everything around the model: what it is sent, what is done with
 * what it returns, and what the analysis says in each case. That is the part
 * a firm's confidentiality depends on, and it is the part that would still be
 * true of any model somebody installed.
 *
 * `fetch` is stubbed globally rather than injected, because the module calls
 * it by name on purpose — see the note at the top of the module about the
 * confidentiality check.
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

/** IMM-2026-002 — Moreau. The matter with a real disagreement on the record. */
function moreau(): MatterAnalysisInput {
  const matter = DEMO_MATTERS.find((candidate) => candidate.reference === "IMM-2026-002");
  if (!matter) throw new Error("The demonstration matter IMM-2026-002 has gone");

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
      receivedAt: new Date(NOW.getTime() - document.receivedDaysAgo * 86_400_000).toISOString(),
      verified: document.verified,
    })),
    enabledFeatures: ALL_FEATURES,
    now: NOW,
  };
}

/** A model server that answers with `text`, and records what it was sent. */
function serverSaying(text: string, usage?: Record<string, number>) {
  const calls: { url: string; body: string }[] = [];
  const stub = vi.fn(async (url: unknown, init?: { body?: unknown }) => {
    calls.push({ url: String(url), body: String(init?.body ?? "") });
    return new Response(
      JSON.stringify({ choices: [{ message: { content: text } }], ...(usage ? { usage } : {}) }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
  vi.stubGlobal("fetch", stub);
  return { calls, stub };
}

function provider() {
  return new LocalAIProvider({ url: "http://127.0.0.1:11434", model: "qwen2.5:7b" });
}

/** A paragraph the checks accept, built from figures the matter really has. */
function acceptableSummary(input: MatterAnalysisInput): string {
  const derived = analyseMatter(input);
  return `The file ${input.reference} is described below. ${derived.summary}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the address it may use", () => {
  it("refuses to exist at an address that is not this machine", () => {
    expect(() => new LocalAIProvider({ url: "https://api.example.com", model: "m" })).toThrow(
      NotLoopbackError,
    );
    expect(() => new LocalAIProvider({ url: "http://192.168.1.10:11434", model: "m" })).toThrow(
      NotLoopbackError,
    );
    // A name is resolved by the machine, so even this one is refused.
    expect(() => new LocalAIProvider({ url: "http://localhost:11434", model: "m" })).toThrow(
      NotLoopbackError,
    );
  });

  it("posts to the chat endpoint on the loopback address it was given", async () => {
    const input = moreau();
    const { calls } = serverSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("http://127.0.0.1:11434/v1/chat/completions");
  });

  it("joins its path onto a base that already has one, rather than replacing it", async () => {
    const input = moreau();
    const { calls } = serverSaying(acceptableSummary(input));

    await new LocalAIProvider({ url: "http://127.0.0.1:8080/llm", model: "m" }).analyseMatter(input);

    expect(calls[0]?.url).toBe("http://127.0.0.1:8080/llm/v1/chat/completions");
  });
});

describe("what the model is told", () => {
  it("sends the figures and Orchelio's own summary of them", async () => {
    const input = moreau();
    const derived = analyseMatter(input);
    const { calls } = serverSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    const sent = calls[0]?.body ?? "";
    expect(sent).toContain(input.reference);
    expect(sent).toContain(JSON.stringify(derived.summary).slice(1, -1));
  });

  it("tells it no client name, no title, no date and no filename", async () => {
    // The model is rewording arithmetic. Everything it is sent stays on this
    // machine either way, but a name in a model server's log would buy nothing.
    const input = moreau();
    const { calls } = serverSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    const sent = calls[0]?.body ?? "";
    expect(sent).not.toContain(input.title);
    for (const document of input.documents) {
      expect(sent, document.filename).not.toContain(document.filename);
    }
    for (const value of Object.values(input.fields)) {
      if (typeof value === "string" && value.length > 6) {
        expect(sent, value).not.toContain(value);
      }
    }
  });

  it("counts facts off the analysis, so the figures and the summary agree", () => {
    // A count taken from the matter rather than from the analysis would
    // disagree with the summary beneath it whenever a firm switched a feature
    // off — and a model handed two contradictory numbers will pick one.
    const input = { ...moreau(), enabledFeatures: ["document_summary"] };
    const derived = analyseMatter(input);

    expect(factsMessage(derived, input)).toContain(`${derived.keyFacts.length} fact(s)`);
    expect(derived.keyFacts).toHaveLength(0);
  });
});

describe("what it does with what comes back", () => {
  it("uses the model's wording, and says a model wrote it", async () => {
    const input = moreau();
    const text = acceptableSummary(input);
    serverSaying(text);

    const { analysis } = await provider().analyseMatter(input);

    expect(analysis.summary).toBe(text);
    expect(analysis.warnings).toContain(MODEL_WROTE_THE_SUMMARY);
  });

  it("keeps every derived part of the analysis whatever the model says", async () => {
    // The claim the whole design rests on: the model has no authority over any
    // fact. Same matter, two very different answers, one identical analysis.
    const input = moreau();
    const derived = analyseMatter(input);

    serverSaying(acceptableSummary(input));
    const withModel = (await provider().analyseMatter(input)).analysis;

    vi.unstubAllGlobals();
    serverSaying("nonsense that will be refused");
    const withoutModel = (await provider().analyseMatter(input)).analysis;

    for (const part of ["keyFacts", "timeline", "contradictions", "missingDocuments"] as const) {
      expect(withModel[part]).toEqual(derived[part]);
      expect(withoutModel[part]).toEqual(derived[part]);
    }
    expect(withoutModel.summary).toBe(derived.summary);
  });

  it("never quotes a refused answer into the analysis", async () => {
    // Copying it into a warning would put the sentence back in the document
    // this check exists to keep it out of — where the reviewer would then find
    // it and fail the analysis for containing it.
    const input = moreau();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    serverSaying(`${input.reference} — the client is eligible for the relief sought here.`);

    const { analysis } = await provider().analyseMatter(input);

    const everything = JSON.stringify(analysis);
    expect(everything).not.toContain("is eligible");
    expect(analysis.warnings.join(" ")).toMatch(/an eligibility conclusion/);
  });

  it("falls back to Orchelio's summary when nothing is listening", async () => {
    const input = moreau();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));

    const { analysis, usage } = await provider().analyseMatter(input);

    expect(analysis.summary).toBe(analyseMatter(input).summary);
    expect(analysis.warnings.join(" ")).toMatch(/could not be reached/);
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, costCents: 0, costMicroEuros: 0, costEstimated: false });
  });

  it("says a slow model is slow, not absent", async () => {
    // Different remedies: one means start the server, the other means the
    // machine is too small for the model somebody chose.
    //
    // The stub waits on the real signal rather than throwing a fabricated
    // timeout error, because what `fetch` throws on a timeout is a fact about
    // the runtime and a stub that invented one would only be checking what its
    // author believed. `tests/integration/local-model.test.ts` runs the same
    // path against a socket that genuinely never answers.
    const input = moreau();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: unknown, init?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          }),
      ),
    );

    const { analysis } = await new LocalAIProvider({
      url: "http://127.0.0.1:11434",
      model: "m",
      timeoutMs: 50,
    }).analyseMatter(input);

    expect(analysis.warnings.join(" ")).toMatch(/did not answer within \d+ seconds/);
  });

  it("falls back when the server answers with an error", async () => {
    const input = moreau();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no such model", { status: 404 })));

    const { analysis } = await provider().analyseMatter(input);

    expect(analysis.summary).toBe(analyseMatter(input).summary);
    expect(analysis.warnings.join(" ")).toMatch(/answered with an error \(404\)/);
  });
});

describe("what a paragraph has to survive to be used", () => {
  const REFERENCE = "IMM-2026-002";
  const FACTS = "Matter IMM-2026-002. 3 fact(s). 4 document(s). 1 point disagrees.";
  const FINE = `${REFERENCE} holds 3 facts and 4 documents, and 1 point on the record disagrees with another.`;

  it("accepts a paragraph that restates what it was given", () => {
    expect(judgeSummary(FINE, FACTS, REFERENCE)).toEqual({ ok: true, summary: FINE });
  });

  it("refuses one that concludes, and names what it read as", () => {
    const verdict = judgeSummary(
      `${REFERENCE} holds 3 facts, and the client is eligible for the relief sought.`,
      FACTS,
      REFERENCE,
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.because).toMatch(/an eligibility conclusion/);
  });

  it("refuses one that recommends, predicts or fixes a deadline", () => {
    for (const sentence of [
      `${REFERENCE} holds 3 facts. We recommend filing the petition without delay.`,
      `${REFERENCE} holds 3 facts and is likely to succeed on the evidence held.`,
      `${REFERENCE} holds 3 facts. The deadline is the one recorded on the notice.`,
    ]) {
      expect(judgeSummary(sentence, FACTS, REFERENCE).ok, sentence).toBe(false);
    }
  });

  it("refuses a figure it was not given", () => {
    const verdict = judgeSummary(`${REFERENCE} holds 3 facts and 9 documents.`, FACTS, REFERENCE);
    expect(verdict.ok === false && verdict.because).toMatch(/the figure 9/);
  });

  it("refuses a link, which nothing on the record contains", () => {
    const verdict = judgeSummary(
      `${REFERENCE} holds 3 facts. See www.example.com for the form.`,
      FACTS,
      REFERENCE,
    );
    expect(verdict.ok === false && verdict.because).toMatch(/link/);
  });

  it("refuses an answer about some other matter", () => {
    const verdict = judgeSummary(
      "The file holds 3 facts and 4 documents, and 1 point disagrees with another.",
      FACTS,
      REFERENCE,
    );
    expect(verdict.ok === false && verdict.because).toMatch(/did not name IMM-2026-002/);
  });

  it("refuses nothing, and refuses an essay", () => {
    expect(judgeSummary("", FACTS, REFERENCE).ok).toBe(false);
    expect(judgeSummary(`${REFERENCE}. ${"word ".repeat(400)}`, FACTS, REFERENCE).ok).toBe(false);
  });

  it("says what it cannot catch, by failing to catch it", () => {
    // A figure written as a word passes, and the module says so rather than
    // implying the check is a guarantee. The defence against this is that the
    // model is only ever restating a paragraph it was handed.
    const verdict = judgeSummary(
      `${REFERENCE} holds three facts and nineteen documents.`,
      FACTS,
      REFERENCE,
    );
    expect(verdict.ok).toBe(true);
  });
});

describe("the packaging a model puts round an answer", () => {
  it("removes a code fence", () => {
    expect(tidy("```\nThe file is described here.\n```")).toBe("The file is described here.");
  });

  it("removes a label line the instruction asked it not to write", () => {
    expect(tidy("Summary:\nThe file is described here.")).toBe("The file is described here.");
  });

  it("keeps a first line that is part of the answer", () => {
    expect(tidy("The file is described here.\nIt holds four documents.")).toBe(
      "The file is described here. It holds four documents.",
    );
  });
});

describe("what a run costs", () => {
  it("records the counts the model server reported, and no money", async () => {
    const input = moreau();
    serverSaying(acceptableSummary(input), { prompt_tokens: 412, completion_tokens: 88 });

    const { usage } = await provider().analyseMatter(input);

    expect(usage).toEqual({ inputTokens: 412, outputTokens: 88, costCents: 0, costMicroEuros: 0, costEstimated: false });
  });

  it("records what a refused answer cost, because writing it was still work", async () => {
    // The usage is the model's, not the answer's. Recording nothing would make
    // a model that concludes on every matter look free of effort as well as
    // free of charge.
    const input = moreau();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    serverSaying(`${input.reference} — the client is eligible.`, {
      prompt_tokens: 300,
      completion_tokens: 40,
    });

    const { analysis, usage } = await provider().analyseMatter(input);

    expect(analysis.summary).toBe(analyseMatter(input).summary);
    expect(usage).toEqual({ inputTokens: 300, outputTokens: 40, costCents: 0, costMicroEuros: 0, costEstimated: false });
  });

  it("records zero when nothing came back at all", async () => {
    const input = moreau();
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));

    const { usage } = await provider().analyseMatter(input);

    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, costCents: 0, costMicroEuros: 0, costEstimated: false });
  });

  it("records zero when the server counted nothing, rather than inventing a figure", async () => {
    const input = moreau();
    serverSaying(acceptableSummary(input));

    const { usage } = await provider().analyseMatter(input);

    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, costCents: 0, costMicroEuros: 0, costEstimated: false });
  });

  it("is not billable, though it is not simulated either", () => {
    // The case that separates the two questions. Reading one for the other
    // would put "real charge" beside a run nobody was invoiced for.
    expect(provider().simulated).toBe(false);
    expect(provider().billable).toBe(false);
  });
});

describe("the review", () => {
  it("consults no model at all", async () => {
    const input = moreau();
    const { stub } = serverSaying(acceptableSummary(input));
    const { analysis } = await provider().analyseMatter(input);
    stub.mockClear();

    const { review, usage } = await provider().reviewAnalysis({ analysis, matter: input });

    // A reviewer that is the same model as the analyst agrees with itself,
    // which makes an unchecked analysis look checked.
    expect(stub).not.toHaveBeenCalled();
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, costCents: 0, costMicroEuros: 0, costEstimated: false });
    expect(review.humanReviewRequired).toBe(true);
  });

  it("would catch a conclusion the first check let through", async () => {
    // Belt and braces, and the belt is proved to work by making it fail: an
    // analysis whose summary concludes comes back needing corrections.
    const input = moreau();
    const derived = analyseMatter(input);
    const smuggled = { ...derived, summary: `${derived.summary} The client is eligible.` };

    const { review } = await provider().reviewAnalysis({ analysis: smuggled, matter: input });

    expect(review.status).toBe("corrections_required");
    expect(review.issues.map((issue) => issue.category)).toContain("premature_legal_conclusion");
  });
});
