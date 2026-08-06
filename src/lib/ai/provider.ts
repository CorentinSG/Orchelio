/**
 * Orchelio — the AI seam.
 *
 * One interface, two roles, and exactly one place where the implementation is
 * chosen. Everything above this line — pages, route handlers, the data layer —
 * knows only `AIProvider`, so replacing the simulation changes this file and
 * nothing else.
 *
 * Selection is by environment variable and never by anything a user can set:
 *
 *     AI_PROVIDER=mock        # what this repository ships with — the test engine
 *     AI_PROVIDER=local       # a model on this machine, with LOCAL_MODEL_URL
 *     AI_PROVIDER=mistral     # Mistral's hosted API, with MISTRAL_API_KEY (ADR-0027)
 *     AI_PROVIDER=anthropic   # later, and only with ANTHROPIC_API_KEY present
 *
 * `src/lib/env.ts` throws at startup if a provider is selected without what it
 * needs, rather than falling back to the mock. That refusal is deliberate: a
 * silent fallback would let a firm believe it was getting a real analysis when
 * it was getting a simulation, which is the single worst failure this product
 * could have.
 *
 * ## Two questions that are not the same question
 *
 * `simulated` asks whether a model ran. `billable` asks whether anybody is
 * charged. They agree for the simulation (no, and no) and for a hosted API
 * (yes, and yes), and a model on the firm's own machine is the case that
 * separates them: a real model runs and no invoice exists. Reading one for the
 * other would put "real charge" on the usage screen against a run that cost
 * nothing.
 */

import type {
  AnalysisReviewInput,
  AnalystRun,
  MatterAnalysisInput,
  ReviewerRun,
  RunUsage,
} from "@/lib/ai/types";
import { analyseMatter } from "@/lib/ai/analyst";
import { reviewAnalysis } from "@/lib/ai/reviewer";
import { LocalAIProvider } from "@/lib/ai/local-provider";
import { MistralAIProvider } from "@/lib/ai/mistral-provider";
import type { TaskClass } from "@/lib/ai/routing";
import type { AiProviderName, ServerEnv } from "@/lib/env";

export interface AIProvider {
  /** Recorded on every analysis, so a past output can be explained later. */
  readonly name: AiProviderName;
  readonly model: string;
  readonly promptVersion: string;
  /** True when no real model is involved. Screens say so when it is. */
  readonly simulated: boolean;
  /** True when a run costs the firm money. See the note above. */
  readonly billable: boolean;

  /**
   * Which routing tier answers when this provider consults a model, recorded
   * on the usage row. Absent when no routed model is involved — the
   * simulation, or a provider whose one call is not routed.
   */
  readonly taskClass?: TaskClass;

  analyseMatter(input: MatterAnalysisInput): Promise<AnalystRun>;
  reviewAnalysis(input: AnalysisReviewInput): Promise<ReviewerRun>;
}

/**
 * What a simulated run "costs".
 *
 * Fixed, so a demonstration is reproducible, and the property of the provider
 * that invents them rather than of the code that stores them — a provider that
 * measures its own consumption should not have to route it around figures
 * somebody else made up.
 */
const SIMULATED_USAGE = {
  analyst: {
    inputTokens: 8_400,
    outputTokens: 1_900,
    costCents: 4,
    costMicroEuros: 40_000,
    costEstimated: false,
  },
  reviewer: {
    inputTokens: 3_100,
    outputTokens: 700,
    costCents: 2,
    costMicroEuros: 20_000,
    costEstimated: false,
  },
} as const satisfies Record<string, RunUsage>;

/**
 * The simulation.
 *
 * Deterministic: the same matter analysed twice gives the same result, which
 * is what makes the acceptance tests meaningful and what a real provider will
 * not give you. See `src/lib/ai/analyst.ts` for what it does and does not do.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const;
  readonly model = "simulated";
  readonly promptVersion = "v1";
  readonly simulated = true;
  readonly billable = false;

  async analyseMatter(input: MatterAnalysisInput): Promise<AnalystRun> {
    return { analysis: analyseMatter(input), usage: SIMULATED_USAGE.analyst };
  }

  async reviewAnalysis(input: AnalysisReviewInput): Promise<ReviewerRun> {
    return { review: reviewAnalysis(input), usage: SIMULATED_USAGE.reviewer };
  }
}

/**
 * A provider that always fails, for exercising the failure path.
 *
 * The honest error state matters as much as the happy one: a firm must be able
 * to tell "the analysis found nothing" from "the analysis did not run". Used
 * by the tests, and never selected by configuration.
 */
export class UnavailableAIProvider implements AIProvider {
  readonly name = "mock" as const;
  readonly model = "unavailable";
  readonly promptVersion = "v1";
  readonly simulated = true;
  readonly billable = false;

  async analyseMatter(): Promise<AnalystRun> {
    throw new Error("Simulated provider failure");
  }

  async reviewAnalysis(): Promise<ReviewerRun> {
    throw new Error("Simulated provider failure");
  }
}

/**
 * The configured provider.
 *
 * Built on each call rather than memoised: a provider holds a few fields and no
 * connection, so there is nothing to reuse, and a cached one would outlive a
 * test that changed the configuration.
 *
 * `anthropic` is deliberately unimplemented rather than stubbed. A stub that
 * quietly behaved like the mock would be the silent fallback this design exists
 * to prevent, so asking for it throws with the reason.
 */
export function aiProvider(env: ServerEnv): AIProvider {
  if (env.aiProvider === "anthropic") {
    throw new Error(
      'AI_PROVIDER="anthropic" is prepared for but not implemented in this build. ' +
        "Orchelio makes no live API call and incurs no charge. " +
        "See prompts/ for the instructions a real provider would be given, and " +
        "docs/ARCHITECTURE.md §8.4 for what implementing it involves.",
    );
  }

  if (env.aiProvider === "mistral") {
    // `parseServerEnv` refuses a "mistral" environment without the key, so
    // reaching here without one is a bug rather than a configuration mistake.
    if (!env.mistralApiKey) {
      throw new Error(
        'AI_PROVIDER="mistral" reached the provider without an API key. ' +
          "parseServerEnv should have refused this environment; something has bypassed it.",
      );
    }
    return new MistralAIProvider({ apiKey: env.mistralApiKey });
  }

  if (env.aiProvider === "local") {
    // `parseServerEnv` refuses to produce a "local" environment without both,
    // so reaching here without them is a bug rather than a configuration
    // mistake — and saying so is more useful than a missing-address error.
    if (!env.localModelUrl || !env.localModelName) {
      throw new Error(
        'AI_PROVIDER="local" reached the provider without an address or a model name. ' +
          "parseServerEnv should have refused this environment; something has bypassed it.",
      );
    }
    return new LocalAIProvider({ url: env.localModelUrl, model: env.localModelName });
  }

  return new MockAIProvider();
}
