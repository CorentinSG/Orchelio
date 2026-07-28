/**
 * Orchelio — the AI seam.
 *
 * One interface, two roles, and exactly one place where the implementation is
 * chosen. Everything above this line — pages, route handlers, the data layer —
 * knows only `AIProvider`, so replacing the simulation with a real model
 * changes this file and nothing else.
 *
 * Selection is by environment variable and never by anything a user can set:
 *
 *     AI_PROVIDER=mock        # today, and what this repository ships with
 *     AI_PROVIDER=anthropic   # later, and only with ANTHROPIC_API_KEY present
 *
 * `src/lib/env.ts` throws at startup if `anthropic` is selected without a key,
 * rather than falling back to the mock. That refusal is deliberate: a silent
 * fallback would let a firm believe it was getting a real analysis when it was
 * getting a simulation, which is the single worst failure this product could
 * have.
 */

import type {
  AnalysisReviewInput,
  AnalysisReviewResult,
  MatterAnalysisInput,
  MatterAnalysisResult,
} from "@/lib/ai/types";
import { analyseMatter } from "@/lib/ai/analyst";
import { reviewAnalysis } from "@/lib/ai/reviewer";
import type { AiProviderName } from "@/lib/env";

export interface AIProvider {
  /** Recorded on every analysis, so a past output can be explained later. */
  readonly name: AiProviderName;
  readonly model: string;
  readonly promptVersion: string;
  /** True when no real model is involved. Screens say so when it is. */
  readonly simulated: boolean;

  analyseMatter(input: MatterAnalysisInput): Promise<MatterAnalysisResult>;
  reviewAnalysis(input: AnalysisReviewInput): Promise<AnalysisReviewResult>;
}

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

  async analyseMatter(input: MatterAnalysisInput): Promise<MatterAnalysisResult> {
    return analyseMatter(input);
  }

  async reviewAnalysis(input: AnalysisReviewInput): Promise<AnalysisReviewResult> {
    return reviewAnalysis(input);
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

  async analyseMatter(): Promise<MatterAnalysisResult> {
    throw new Error("Simulated provider failure");
  }

  async reviewAnalysis(): Promise<AnalysisReviewResult> {
    throw new Error("Simulated provider failure");
  }
}

let instance: AIProvider | undefined;

/**
 * The configured provider.
 *
 * `anthropic` is deliberately unimplemented rather than stubbed. A stub that
 * quietly behaved like the mock would be the silent fallback this design
 * exists to prevent, so asking for it throws with the reason.
 */
export function aiProvider(providerName: AiProviderName): AIProvider {
  if (providerName === "anthropic") {
    throw new Error(
      'AI_PROVIDER="anthropic" is prepared for but not implemented in this build. ' +
        "Orchelio makes no live API call and incurs no charge. " +
        "See prompts/ for the instructions a real provider would be given, and " +
        "docs/ARCHITECTURE.md §8.4 for what implementing it involves.",
    );
  }

  instance ??= new MockAIProvider();
  return instance;
}
