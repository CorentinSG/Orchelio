import { afterEach, describe, expect, it, vi } from "vitest";

import { DEMO_MATTERS } from "@/lib/demo/matters";
import { analyseMatter } from "@/lib/ai/analyst";
import { MISTRAL_WROTE_THE_SUMMARY, MistralAIProvider } from "@/lib/ai/mistral-provider";
import { MISTRAL_MODEL_BY_CLASS, MISTRAL_PRICES, estimateMicroEuros } from "@/lib/ai/routing";
import { factsMessage } from "@/lib/ai/summary-rewrite";
import type { MatterAnalysisInput } from "@/lib/ai/types";

/**
 * Orchelio — the provider that uses Mistral's hosted API.
 *
 * No request leaves this test run. `fetch` is stubbed globally — the module
 * calls it by name on purpose, for the confidentiality check — and what is
 * tested is everything around the model: what it is sent, what is done with
 * what comes back, and what every call is recorded as costing. The build must
 * never require the network (ADR-0027); the live path is proved by a human
 * running `npm run ai:smoke`.
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

/** A hosted API that answers with `text`, and records what it was sent. */
function apiSaying(text: string, options?: { usage?: Record<string, number>; status?: number }) {
  const calls: { url: string; headers: Record<string, string>; body: string }[] = [];
  const stub = vi.fn(
    async (url: unknown, init?: { headers?: Record<string, string>; body?: unknown }) => {
      calls.push({
        url: String(url),
        headers: init?.headers ?? {},
        body: String(init?.body ?? ""),
      });
      if (options?.status && options.status !== 200) {
        return new Response("{}", { status: options.status });
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: text } }],
          ...(options?.usage ? { usage: options.usage } : {}),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  );
  vi.stubGlobal("fetch", stub);
  return { calls, stub };
}

function provider() {
  return new MistralAIProvider({ apiKey: "test-key" });
}

/** A paragraph the checks accept, built from figures the matter really has. */
function acceptableSummary(input: MatterAnalysisInput): string {
  const derived = analyseMatter(input);
  return `The file ${input.reference} is described below. ${derived.summary}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("what is sent", () => {
  it("goes to api.mistral.ai with the key in the header, and nowhere in the body", async () => {
    const input = moreau();
    const { calls } = apiSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(calls[0]!.headers["authorization"]).toBe("Bearer test-key");
    expect(calls[0]!.body).not.toContain("test-key");
  });

  it("asks the intermediate-tier model — rewording is bulk work, not analysis", async () => {
    const input = moreau();
    const { calls } = apiSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    const payload = JSON.parse(calls[0]!.body) as { model: string; temperature: number };
    expect(payload.model).toBe(MISTRAL_MODEL_BY_CLASS.intermediate);
    expect(payload.temperature).toBe(0);
  });

  it("sends the same figures message the local provider sends — one implementation", async () => {
    const input = moreau();
    const { calls } = apiSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    const payload = JSON.parse(calls[0]!.body) as { messages: { content: string }[] };
    expect(payload.messages[1]!.content).toBe(factsMessage(analyseMatter(input), input));
  });

  it("tells the model no name, no title, no field value and no filename", async () => {
    const input = moreau();
    const { calls } = apiSaying(acceptableSummary(input));

    await provider().analyseMatter(input);

    const body = calls[0]!.body;
    expect(body).not.toContain("Moreau");
    expect(body).not.toContain(input.title);
    for (const document of input.documents) {
      expect(body).not.toContain(document.filename);
    }
  });
});

describe("what is done with what comes back", () => {
  it("uses the model's paragraph when it passes, and says a hosted model wrote it", async () => {
    const input = moreau();
    const summary = acceptableSummary(input);
    apiSaying(summary);

    const { analysis } = await provider().analyseMatter(input);

    expect(analysis.summary).toBe(summary);
    expect(analysis.warnings).toContain(MISTRAL_WROTE_THE_SUMMARY);
  });

  it("drops a paragraph that concludes, and never quotes it", async () => {
    const input = moreau();
    const conclusion = `The matter ${input.reference} is strong and the client is eligible for relief.`;
    apiSaying(conclusion);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { analysis } = await provider().analyseMatter(input);

    expect(analysis.summary).not.toContain("eligible");
    expect(analysis.summary).toBe(analyseMatter(input).summary);
    expect(JSON.stringify(analysis)).not.toContain("eligible for relief");
    warn.mockRestore();
  });

  it("falls back to the derived summary when Mistral cannot be reached", async () => {
    const input = moreau();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const { analysis, usage } = await provider().analyseMatter(input);

    expect(analysis.summary).toBe(analyseMatter(input).summary);
    expect(JSON.stringify(analysis.warnings)).toMatch(/could not be reached/);
    expect(usage).toEqual({
      inputTokens: 0,
      outputTokens: 0,
      costCents: 0,
      costMicroEuros: 0,
      costEstimated: false,
    });
  });

  it("names the key as the problem on a 401, without quoting the response", async () => {
    const input = moreau();
    apiSaying("ignored", { status: 401 });

    const { analysis } = await provider().analyseMatter(input);

    expect(JSON.stringify(analysis.warnings)).toMatch(/refused the API key/);
  });
});

describe("what a run costs", () => {
  it("estimates from the price table, in micro-euros, and says it is an estimate", async () => {
    const input = moreau();
    apiSaying(acceptableSummary(input), { usage: { prompt_tokens: 1_000, completion_tokens: 200 } });

    const { usage } = await provider().analyseMatter(input);

    const expected = estimateMicroEuros(MISTRAL_MODEL_BY_CLASS.intermediate, {
      inputTokens: 1_000,
      outputTokens: 200,
    });
    expect(usage.inputTokens).toBe(1_000);
    expect(usage.outputTokens).toBe(200);
    expect(usage.costMicroEuros).toBe(expected.microEuros);
    expect(usage.costMicroEuros).toBeGreaterThan(0);
    expect(usage.costEstimated).toBe(true);
  });

  it("records what a refused answer cost — the invoice does not care that it was refused", async () => {
    const input = moreau();
    apiSaying("The client will certainly win.", {
      usage: { prompt_tokens: 300, completion_tokens: 40 },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { usage } = await provider().analyseMatter(input);

    expect(usage.inputTokens).toBe(300);
    expect(usage.outputTokens).toBe(40);
    expect(usage.costEstimated).toBe(true);
    expect(usage.costMicroEuros).toBeGreaterThan(0);
    warn.mockRestore();
  });

  it("a fraction of a cent is not rounded into a free-looking zero", () => {
    // 1 000 input + 200 output on the intermediate model is well under a cent —
    // the µ€ column is the reason a real charge cannot print as 0 and nothing.
    const { microEuros } = estimateMicroEuros(MISTRAL_MODEL_BY_CLASS.intermediate, {
      inputTokens: 1_000,
      outputTokens: 200,
    });
    expect(microEuros).toBeGreaterThan(0);
    expect(microEuros).toBeLessThan(10_000); // under one cent
  });

  it("every routed model has a price, so no estimate can silently be a guess", () => {
    for (const model of Object.values(MISTRAL_MODEL_BY_CLASS)) {
      expect(MISTRAL_PRICES.perMillionTokens[model], model).toBeDefined();
    }
  });

  it("an unpriced model is recorded as unknown, never invented", () => {
    const verdict = estimateMicroEuros("some-future-model", { inputTokens: 500, outputTokens: 100 });
    expect(verdict).toEqual({ microEuros: 0, known: false });
  });
});

describe("the review", () => {
  it("consults no model at all — a model must not mark its own work", async () => {
    const input = moreau();
    const { stub } = apiSaying(acceptableSummary(input));
    const p = provider();
    const { analysis } = await p.analyseMatter(input);
    stub.mockClear();

    const { review, usage } = await p.reviewAnalysis({ analysis, matter: input });

    expect(stub).not.toHaveBeenCalled();
    expect(review.humanReviewRequired).toBe(true);
    expect(usage.costMicroEuros).toBe(0);
  });
});

describe("what the provider declares", () => {
  it("is real, billable, and routed as intermediate", () => {
    const p = provider();
    expect(p.simulated).toBe(false);
    expect(p.billable).toBe(true);
    expect(p.taskClass).toBe("intermediate");
    expect(p.name).toBe("mistral");
  });
});
