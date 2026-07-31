/**
 * Orchelio — what to say about whichever provider is configured.
 *
 * Three screens describe the assistant: the usage page, the AI workspace and
 * the system status. Each of them used to assert what the provider does — "no
 * request leaves this machine", "the figures are simulated" — which was true of
 * the only provider that existed and would have gone on being displayed,
 * unchanged and wrong, the moment a second one did.
 *
 * So the claims live here, one set per provider, and the screens read them. The
 * rule this serves is the one in ADR-0021: a setting either changes what the
 * product does, or says beside itself that it does not. Changing `AI_PROVIDER`
 * now changes every sentence that depends on it.
 *
 * The `mock` wording is reproduced from what those screens said before, word
 * for word. It is the sentence the specification asks for and the sentence two
 * browser tests read.
 */

import { LOOPBACK_PROMISE } from "@/lib/ai/loopback";
import { APP_NAME } from "@/lib/app-config";
import type { ServerEnv } from "@/lib/env";

export type ProviderNotice = {
  /** One word for a badge or a hint: what kind of run this provider produces. */
  word: string;
  /** Callout title on the usage screen. */
  costTitle: string;
  /** Callout title in the AI workspace. */
  workspaceTitle: string;
  /** Where a matter's material goes, and what ran. */
  whereItGoes: string;
  /** How an analysis is produced, and what the model is allowed to decide. */
  howItIsProduced: string;
  /** What the recorded token and cost figures are. */
  whatTheFiguresAre: string;
  /** What no figure on the page can tell the reader. */
  whatItCannotTell: string;
  /** Title of the usage card in the AI workspace. */
  usageCardTitle: string;
  /** What "real charges included" says when there are none. */
  noCharges: string;
  /** Label for the money tile on the usage screen and the row in the workspace. */
  costLabel: string;
  /** The same figure on the dashboard, where it sits among unrelated tiles. */
  dashboardCostLabel: string;
  /** Hint beneath the money tile. */
  costHint: string;
  /** Hint beside the provider name on the status screens. */
  statusHint: string;
  /** Title of the banner on the public home page. */
  bannerTitle: string;
  /** Its body: what a visitor is told about the assistant before signing in. */
  banner: string;
  /** Description under "Claude Analyst" on a matter, where a run is started. */
  analystNote: string;
  /** Said above the list of AI features, in settings and in onboarding. */
  featuresNote: string;
};

/**
 * How an analysis is produced, for the two providers that derive it the same
 * way. Only the simulation and the local model share this; a hosted API would
 * not, which is why it is a constant rather than a default.
 */
const DERIVED_FROM_THE_RECORD =
  `The facts are produced by deterministic rules over each matter's recorded fields, intake ` +
  `answers and document names. No document is ever opened: ${APP_NAME} stores a filename, a type ` +
  "and a size, and there is no OCR in this build.";

export function providerNotice(env: ServerEnv): ProviderNotice {
  switch (env.aiProvider) {
    case "local":
      return {
        word: "on this machine",
        costTitle: "No invoice — the model runs on this machine",
        workspaceTitle: "A model on this machine, and only for the wording",
        whereItGoes: `${LOOPBACK_PROMISE} The model configured for this instance is ${env.localModelName ?? "unnamed"}.`,
        howItIsProduced:
          `${DERIVED_FROM_THE_RECORD} The model is asked for one thing: the summary, restated in ` +
          "plainer words from figures Orchelio has already worked out. It is not asked what the " +
          "facts are — a comparison between two dates cannot invent one and a small model can. " +
          "What it writes is checked before it is stored, and set aside if it asserts an outcome, " +
          "uses a figure it was not given, or does not name the matter. Every analysis says which " +
          "of the two summaries you are reading.",
        whatTheFiguresAre:
          "The token counts are whatever the model server reported for the one call an analysis " +
          "makes; a server that reports none is recorded as zero. The cost is zero because nobody " +
          "invoices for a model running on your own machine.",
        whatItCannotTell:
          "What this page cannot tell you is what running the model actually costs. Electricity " +
          "and the machine it runs on are real costs, and neither is visible from here.",
        usageCardTitle: "Usage",
        noCharges: "None — nothing here is a charge",
        costLabel: "Cost",
        dashboardCostLabel: "AI cost",
        costHint: "nothing is billed for a model on this machine",
        statusHint: "on this machine, no key, no invoice",
        bannerTitle: "The AI runs on this computer",
        banner:
          `${APP_NAME} uses a model installed on this machine, reached at 127.0.0.1. No API key is ` +
          "required and no request leaves the computer. The model writes the wording of a summary " +
          "and nothing else — every fact is worked out by " +
          `${APP_NAME} from the record. Nothing is billed.`,
        analystNote:
          "A model on this machine writes the summary's wording. Every fact is derived from the " +
          "record, no request leaves the computer, and no charge is incurred.",
        featuresNote:
          "Every feature below is produced from this firm's own records and costs nothing to run — " +
          "a model on this machine writes the wording of a summary and decides nothing. Switching " +
          "one off removes it from the workspace, and removes the dashboard card that depended on " +
          "it rather than leaving the card showing zero.",
      };

    case "anthropic":
      return {
        word: "not implemented",
        costTitle: "Not implemented in this build",
        workspaceTitle: "Not implemented in this build",
        whereItGoes:
          "AI_PROVIDER is set to anthropic, which this build does not implement. No request is " +
          "made and no charge is incurred; an analysis run with this setting fails rather than " +
          "quietly falling back to the simulation.",
        howItIsProduced:
          "Nothing is produced. See prompts/ for the instructions a real provider would be given.",
        whatTheFiguresAre: "There are no figures, because no run can complete.",
        whatItCannotTell:
          "What this page cannot tell you is what a real deployment would cost. That depends on " +
          "the model, the prompt and the documents actually sent, none of which exist here.",
        usageCardTitle: "Usage",
        noCharges: "None — no run can complete",
        costLabel: "Cost",
        dashboardCostLabel: "AI cost",
        costHint: "no run can complete",
        statusHint: "prepared for, not implemented",
        bannerTitle: "The configured AI provider is not implemented",
        banner:
          "AI_PROVIDER is set to anthropic, which this build does not implement. No request is " +
          "made, no charge is incurred, and no analysis can complete.",
        analystNote: "Not implemented in this build. Running an analysis will fail.",
        featuresNote:
          "The configured provider is not implemented in this build, so none of the features " +
          "below can produce anything. The choices are still recorded against this firm.",
      };

    case "mock":
      return {
        word: "simulated",
        costTitle: "Simulated cost — No API charge was incurred.",
        workspaceTitle: "Simulated, and structurally so",
        whereItGoes:
          "No request leaves this machine: nothing was sent to Anthropic or to any other service, " +
          "no API key is configured, and no charge is incurred. The figures below show what " +
          `${APP_NAME} recorded, not what anybody was charged.`,
        howItIsProduced:
          `${DERIVED_FROM_THE_RECORD} No model is involved at any point.`,
        whatTheFiguresAre:
          "Each run records the tokens a real request of that size would have used and the cost " +
          "that would have followed, at published rates. The token counts are derived from the " +
          "matter's own fields and document names — the same inputs the simulated analysis reads " +
          "— so they move realistically with the size of a matter without any request being made.",
        whatItCannotTell:
          "What this page cannot tell you is what a real deployment would cost. That depends on " +
          "the model, the prompt and the documents actually sent, none of which exist here.",
        usageCardTitle: "Simulated usage",
        noCharges: "None — every record is simulated",
        costLabel: "Simulated cost",
        dashboardCostLabel: "Simulated AI cost",
        costHint: "no charge was incurred",
        statusHint: "no key, no request, no charge",
        bannerTitle: "No live AI calls are made",
        banner:
          `${APP_NAME} runs on a simulated AI provider. No Anthropic API key is required and no ` +
          "request leaves this machine. Costs shown elsewhere in the product are simulated.",
        analystNote: "Simulated in this build. No API call is made and no charge is incurred.",
        featuresNote:
          "Every feature below is simulated in this build and costs nothing to run. Switching one " +
          "off removes it from the workspace — and removes the dashboard card that depended on " +
          "it, rather than leaving the card showing zero.",
      };
  }
}

/**
 * What to call a stored usage row.
 *
 * Read off the row and not off the current configuration: a firm that ran ten
 * analyses under the simulation and then installed a model has both kinds on
 * one page, and labelling them all by today's setting would relabel history.
 */
export function runLabel(provider: string, isRealCharge: boolean): string {
  if (isRealCharge) return "billed";
  if (provider === "local") return "on this machine";
  return "simulated";
}
