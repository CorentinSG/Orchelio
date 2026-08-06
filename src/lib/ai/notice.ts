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
  /** Value of the "Sent to an AI provider" row on the confidentiality report. */
  sentToProvider: string;
  /** Its hint: the one-line bound on what can ever be in that traffic. */
  sentToProviderHint: string;
};

/**
 * How an analysis is produced, for every provider that derives it the same
 * way — the simulation, the local model and the hosted Mistral model all do:
 * the facts come from deterministic rules, and a model (where there is one)
 * writes only the summary's wording (ADR-0024, ADR-0027). A provider that
 * read documents would not share this sentence, which is why it is a
 * constant rather than a default — V1-2 will retire it deliberately.
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
        bannerTitle: "L’IA fonctionne sur cet ordinateur",
        banner:
          `${APP_NAME} utilise un modèle installé sur cette machine, joint à l’adresse 127.0.0.1. ` +
          "Aucune clé d’API n’est requise et aucune requête ne quitte l’ordinateur. Le modèle rédige " +
          "la formulation d’un résumé et rien d’autre — chaque fait est établi par " +
          `${APP_NAME} depuis le dossier. Rien n’est facturé.`,
        analystNote:
          "A model on this machine writes the summary's wording. Every fact is derived from the " +
          "record, no request leaves the computer, and no charge is incurred.",
        featuresNote:
          "Every feature below is produced from this firm's own records and costs nothing to run — " +
          "a model on this machine writes the wording of a summary and decides nothing. Switching " +
          "one off removes it from the workspace, and removes the dashboard card that depended on " +
          "it rather than leaving the card showing zero.",
        sentToProvider: "Derived figures only, to 127.0.0.1",
        sentToProviderHint:
          "counts, disagreement subjects, missing-document kinds and the matter reference — never a name, a date, a field value or a document",
      };

    case "mistral":
      return {
        word: "billed per call",
        costTitle: "Real charges — every call is billed to the firm's Mistral account",
        workspaceTitle: "A hosted model in the EU, and only for the wording",
        whereItGoes:
          "One request per analysis goes to api.mistral.ai, processed in the European Union " +
          "under the firm's Mistral agreement (paid tier — not used to train models). What is " +
          "sent: figures Orchelio derived from the record, the subjects of any disagreements, " +
          "the kinds of any missing documents, and the matter's reference. No name, no field " +
          "value, no date, no filename, no document content.",
        howItIsProduced:
          `${DERIVED_FROM_THE_RECORD} The hosted model is asked for one thing: the summary, ` +
          "restated in plainer words from figures Orchelio has already worked out. It is not " +
          "asked what the facts are. What it writes is checked before it is stored, and set " +
          "aside if it asserts an outcome, uses a figure it was not given, or does not name " +
          "the matter. Every analysis says which of the two summaries you are reading.",
        whatTheFiguresAre:
          "The token counts are what Mistral's API reported for the one call an analysis makes. " +
          "The cost is an estimate from a published price table, dated, and marked as an " +
          "estimate until the invoice agrees — a fraction of a cent is recorded as what it is, " +
          "never rounded to a zero that reads as free.",
        whatItCannotTell:
          "What this page cannot tell you is what Mistral will actually invoice. The estimate " +
          "follows a price list copied on a date; the invoice follows the price on the day.",
        usageCardTitle: "Usage",
        noCharges: "Real charges are billed by Mistral, per call",
        costLabel: "Estimated cost",
        dashboardCostLabel: "Estimated AI cost",
        costHint: "estimated from a dated price table; Mistral invoices the firm directly",
        statusHint: "hosted in the EU, key server-side, billed per call",
        bannerTitle: "L’IA est Mistral, hébergée dans l’Union européenne",
        banner:
          `${APP_NAME} envoie une requête par analyse à Mistral, entreprise française, avec un ` +
          "traitement dans l’Union européenne. Le modèle rédige la formulation d’un résumé et rien " +
          `d’autre — chaque fait est établi par ${APP_NAME} depuis le dossier, et ce qui est envoyé ` +
          "ne contient ni nom, ni date, ni document. Chaque appel est facturé sur le compte Mistral du cabinet.",
        analystNote:
          "A Mistral model hosted in the EU writes the summary's wording. Every fact is derived " +
          "from the record; what is sent contains no name, no date and no document. Each call " +
          "is billed to the firm's Mistral account.",
        featuresNote:
          "Every feature below is produced from this firm's own records. A hosted Mistral model " +
          "writes the wording of a summary and decides nothing; each analysis is billed to the " +
          "firm's Mistral account. Switching a feature off removes it from the workspace, and " +
          "removes the dashboard card that depended on it rather than leaving the card showing " +
          "zero.",
        sentToProvider: "Derived figures only, to api.mistral.ai (EU)",
        sentToProviderHint:
          "counts, disagreement subjects, missing-document kinds and the matter reference — never a name, a date, a field value or a document",
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
        bannerTitle: "Le moteur d’IA configuré n’est pas implémenté",
        banner:
          "AI_PROVIDER vaut anthropic, que cette version n’implémente pas. Aucune requête n’est " +
          "émise, aucun frais n’est engagé, et aucune analyse ne peut aboutir.",
        analystNote: "Not implemented in this build. Running an analysis will fail.",
        featuresNote:
          "The configured provider is not implemented in this build, so none of the features " +
          "below can produce anything. The choices are still recorded against this firm.",
        sentToProvider: "Nothing — no run can complete",
        sentToProviderHint: "the configured provider is not implemented, so no request is ever built",
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
        bannerTitle: "Aucun appel réel à une IA n’est effectué",
        banner:
          `${APP_NAME} fonctionne avec un assistant simulé. Aucune clé d’API Anthropic n’est requise ` +
          "et aucune requête ne quitte cette machine. Les coûts affichés ailleurs dans le produit sont simulés.",
        analystNote: "Simulated in this build. No API call is made and no charge is incurred.",
        featuresNote:
          "Every feature below is simulated in this build and costs nothing to run. Switching one " +
          "off removes it from the workspace — and removes the dashboard card that depended on " +
          "it, rather than leaving the card showing zero.",
        sentToProvider: "Nothing",
        sentToProviderHint: "no key is configured and the simulation opens no socket",
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
