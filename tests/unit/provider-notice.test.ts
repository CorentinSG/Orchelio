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
    case "mistral":
      return parseServerEnv({ AI_PROVIDER: "mistral", MISTRAL_API_KEY: "test-key" });
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
    // The V1 pivot re-agreed this sentence in French (owner decision:
    // French-first product). Same claim, same placement, same test.
    expect(providerNotice(envFor("mock")).costTitle).toBe(
      "Coût simulé — aucun frais d’API n’a été engagé.",
    );
  });

  it("does not describe a model that did not run", () => {
    const notice = providerNotice(envFor("mock"));
    expect(notice.howItIsProduced).toMatch(/Aucun modèle n’intervient/i);
    expect(notice.word).toBe("simulé");
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
    expect(JSON.stringify(notice)).not.toMatch(/simul/i);
  });

  it("says what the model is allowed to decide, which is the wording only", () => {
    const notice = providerNotice(envFor("local"));
    expect(notice.howItIsProduced).toMatch(/n’est pas interrogé sur les faits/i);
    expect(notice.howItIsProduced).toMatch(/écarté/i);
  });

  it("does not pretend to know what the machine costs to run", () => {
    expect(providerNotice(envFor("local")).whatItCannotTell).toMatch(/électricité/i);
  });
});

describe("the hosted Mistral model", () => {
  it("says where the material goes, and exactly what the material is", () => {
    const notice = providerNotice(envFor("mistral"));
    expect(notice.whereItGoes).toContain("api.mistral.ai");
    expect(notice.whereItGoes).toMatch(/Union européenne/);
    expect(notice.whereItGoes).toMatch(
      /Aucun nom, aucune valeur de champ, aucune date, aucun nom de fichier/i,
    );
  });

  it("never calls a real run simulated", () => {
    const notice = providerNotice(envFor("mistral"));
    expect(JSON.stringify(notice)).not.toMatch(/simul/i);
  });

  it("calls its cost an estimate, never an invoice", () => {
    const notice = providerNotice(envFor("mistral"));
    expect(notice.costLabel).toMatch(/estimé/i);
    expect(notice.whatTheFiguresAre).toMatch(/estimation/i);
    expect(notice.whatItCannotTell).toMatch(/factur/i);
  });

  it("says what the model is allowed to decide, which is the wording only", () => {
    const notice = providerNotice(envFor("mistral"));
    expect(notice.howItIsProduced).toMatch(/n’est pas interrogé sur les faits/i);
    expect(notice.howItIsProduced).toMatch(/écarté/i);
  });

  it("never claims nothing leaves the machine — something now does", () => {
    const notice = providerNotice(envFor("mistral"));
    expect(JSON.stringify(notice)).not.toMatch(/ne quitte/i);
    expect(JSON.stringify(notice)).not.toMatch(/rien ne (part|sort)/i);
  });
});

describe("what a stored run is called", () => {
  it("reads the row rather than today's setting", () => {
    // A firm that ran ten analyses under the simulation and then installed a
    // model has both kinds on one page. Labelling them all by the current
    // provider would relabel history.
    expect(runLabel("mock", false)).toBe("simulé");
    expect(runLabel("local", false)).toBe("sur cette machine");
  });

  it("calls a charge a charge, whatever produced it", () => {
    for (const provider of AI_PROVIDERS) {
      expect(runLabel(provider, true), provider).toBe("facturé");
    }
  });
});
