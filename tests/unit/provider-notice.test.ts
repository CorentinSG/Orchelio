import { describe, expect, it } from "vitest";

import { providerNotice, runLabel, type ProviderNotice } from "@/lib/ai/notice";
import { LOOPBACK_PROMISE } from "@/lib/ai/loopback";
import { AI_PROVIDERS, parseServerEnv, type AiProviderName } from "@/lib/env";

/**
 * Orchelio — what each screen says about the assistant.
 *
 * Three screens used to assert this themselves, which was fine while there was
 * one provider and would have been silently wrong the day there were two. These
 * tests are the reason a third provider cannot be added without deciding what
 * every one of those sentences becomes.
 */

function envFor(provider: AiProviderName) {
  switch (provider) {
    case "local":
      return parseServerEnv({
        AI_PROVIDER: "local",
        LOCAL_MODEL_URL: "http://127.0.0.1:11434",
        LOCAL_MODEL_NAME: "qwen2.5:7b",
      });
    case "anthropic":
      return parseServerEnv({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-test" });
    case "mock":
      return parseServerEnv({});
  }
}

describe("every provider has something to say", () => {
  it("answers for all of them, with nothing left blank", () => {
    // Exhaustive over AI_PROVIDERS: adding a fourth fails here until somebody
    // writes down what the screens should say about it.
    for (const provider of AI_PROVIDERS) {
      const notice = providerNotice(envFor(provider));
      for (const [field, value] of Object.entries(notice) as [keyof ProviderNotice, string][]) {
        expect(value.trim(), `${provider}.${field}`).not.toBe("");
      }
    }
  });
});

describe("the simulation", () => {
  it("still says the exact sentence the specification asks for", () => {
    expect(providerNotice(envFor("mock")).costTitle).toBe(
      "Simulated cost — No API charge was incurred.",
    );
  });

  it("does not describe a model that did not run", () => {
    const notice = providerNotice(envFor("mock"));
    expect(notice.howItIsProduced).toMatch(/No model is involved/i);
    expect(notice.word).toBe("simulated");
  });
});

describe("a model on this machine", () => {
  it("gives the firm the sentence it can repeat to a client", () => {
    expect(providerNotice(envFor("local")).whereItGoes).toContain(LOOPBACK_PROMISE);
  });

  it("names the model, because that is what explains an analysis later", () => {
    expect(providerNotice(envFor("local")).whereItGoes).toContain("qwen2.5:7b");
  });

  it("never calls a real run simulated", () => {
    const notice = providerNotice(envFor("local"));
    expect(JSON.stringify(notice)).not.toMatch(/simulat/i);
  });

  it("says what the model is allowed to decide, which is the wording only", () => {
    const notice = providerNotice(envFor("local"));
    expect(notice.howItIsProduced).toMatch(/not asked what the facts are/i);
    expect(notice.howItIsProduced).toMatch(/set aside/i);
  });

  it("does not pretend to know what the machine costs to run", () => {
    expect(providerNotice(envFor("local")).whatItCannotTell).toMatch(/electricity/i);
  });
});

describe("what a stored run is called", () => {
  it("reads the row rather than today's setting", () => {
    // A firm that ran ten analyses under the simulation and then installed a
    // model has both kinds on one page. Labelling them all by the current
    // provider would relabel history.
    expect(runLabel("mock", false)).toBe("simulated");
    expect(runLabel("local", false)).toBe("on this machine");
  });

  it("calls a charge a charge, whatever produced it", () => {
    for (const provider of AI_PROVIDERS) {
      expect(runLabel(provider, true), provider).toBe("billed");
    }
  });
});
