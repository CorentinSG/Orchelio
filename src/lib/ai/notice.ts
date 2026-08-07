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
  /** Description under "Analyste" on a matter, where a run is started. */
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
  `Les faits sont produits par des règles déterministes appliquées aux champs enregistrés de ` +
  `chaque dossier, aux réponses du questionnaire client et aux noms des documents. Aucun document ` +
  `n’est jamais ouvert : ${APP_NAME} conserve un nom de fichier, un type et une taille, et cette ` +
  "version ne fait pas d’OCR.";

export function providerNotice(env: ServerEnv): ProviderNotice {
  switch (env.aiProvider) {
    case "local":
      return {
        word: "sur cette machine",
        costTitle: "Aucune facture — le modèle fonctionne sur cette machine",
        workspaceTitle: "Un modèle sur cette machine, et seulement pour la formulation",
        whereItGoes: `${LOOPBACK_PROMISE} Le modèle configuré pour cette instance est ${env.localModelName ?? "sans nom"}.`,
        howItIsProduced:
          `${DERIVED_FROM_THE_RECORD} Une seule chose est demandée au modèle : le résumé, redit ` +
          "en mots plus simples à partir de chiffres qu’Orchelio a déjà établis. Il n’est pas " +
          "interrogé sur les faits — une comparaison entre deux dates ne peut pas en inventer " +
          "une, un petit modèle si. Ce qu’il écrit est vérifié avant d’être enregistré, et " +
          "écarté s’il affirme une issue, utilise un chiffre qu’on ne lui a pas fourni ou ne " +
          "nomme pas le dossier. Chaque analyse dit lequel des deux résumés vous lisez.",
        whatTheFiguresAre:
          "Les comptes de jetons sont ceux que le serveur du modèle a rapportés pour l’unique " +
          "appel d’une analyse ; un serveur qui n’en rapporte aucun est enregistré à zéro. Le " +
          "coût est nul, car personne ne facture un modèle qui tourne sur votre propre machine.",
        whatItCannotTell:
          "Ce que cette page ne peut pas vous dire, c’est ce que le modèle coûte réellement à " +
          "faire tourner. L’électricité et la machine sont des coûts réels, et aucun des deux " +
          "n’est visible d’ici.",
        usageCardTitle: "Consommation",
        noCharges: "Aucun — rien ici n’est facturé",
        costLabel: "Coût",
        dashboardCostLabel: "Coût IA",
        costHint: "rien n’est facturé pour un modèle sur cette machine",
        statusHint: "sur cette machine, sans clé, sans facture",
        bannerTitle: "L’IA fonctionne sur cet ordinateur",
        banner:
          `${APP_NAME} utilise un modèle installé sur cette machine, joint à l’adresse 127.0.0.1. ` +
          "Aucune clé d’API n’est requise et aucune requête ne quitte l’ordinateur. Le modèle rédige " +
          "la formulation d’un résumé et rien d’autre — chaque fait est établi par " +
          `${APP_NAME} depuis le dossier. Rien n’est facturé.`,
        analystNote:
          "Un modèle sur cette machine rédige la formulation du résumé. Chaque fait est dérivé " +
          "du dossier, aucune requête ne quitte l’ordinateur, et rien n’est facturé.",
        featuresNote:
          "Chaque fonction ci-dessous est produite depuis les enregistrements du cabinet et ne " +
          "coûte rien à exécuter — un modèle sur cette machine rédige la formulation d’un résumé " +
          "et ne décide de rien. En désactiver une la retire de l’assistant, et retire la carte " +
          "du tableau de bord qui en dépendait plutôt que de la laisser afficher zéro.",
        sentToProvider: "Chiffres dérivés uniquement, vers 127.0.0.1",
        sentToProviderHint:
          "des comptes, les sujets des désaccords, les types de documents manquants et la référence du dossier — jamais un nom, une date, une valeur de champ ni un document",
      };

    case "mistral":
      return {
        word: "facturé à l’appel",
        costTitle: "Frais réels — chaque appel est facturé sur le compte Mistral du cabinet",
        workspaceTitle: "Un modèle hébergé dans l’UE, et seulement pour la formulation",
        whereItGoes:
          "Une requête par analyse part vers api.mistral.ai, avec un traitement dans l’Union " +
          "européenne dans le cadre du contrat Mistral du cabinet (offre payante — ces données " +
          "ne servent pas à entraîner des modèles). Ce qui est envoyé : des chiffres " +
          "qu’Orchelio a dérivés du dossier, les sujets des éventuels désaccords, les types " +
          "des éventuels documents manquants, et la référence du dossier. Aucun nom, aucune " +
          "valeur de champ, aucune date, aucun nom de fichier, aucun contenu de document.",
        howItIsProduced:
          `${DERIVED_FROM_THE_RECORD} Une seule chose est demandée au modèle hébergé : le ` +
          "résumé, redit en mots plus simples à partir de chiffres qu’Orchelio a déjà établis. " +
          "Il n’est pas interrogé sur les faits. Ce qu’il écrit est vérifié avant d’être " +
          "enregistré, et écarté s’il affirme une issue, utilise un chiffre qu’on ne lui a pas " +
          "fourni ou ne nomme pas le dossier. Chaque analyse dit lequel des deux résumés vous lisez.",
        whatTheFiguresAre:
          "Les comptes de jetons sont ceux que l’API de Mistral a rapportés pour l’unique appel " +
          "d’une analyse. Le coût est une estimation d’après un barème publié, daté, et marquée " +
          "comme estimation tant que la facture ne l’a pas confirmée — une fraction de centime " +
          "est enregistrée pour ce qu’elle est, jamais arrondie à un zéro qui se lirait comme " +
          "gratuit.",
        whatItCannotTell:
          "Ce que cette page ne peut pas vous dire, c’est ce que Mistral facturera réellement. " +
          "L’estimation suit un barème copié à une date ; la facture suit le prix du jour.",
        usageCardTitle: "Consommation",
        noCharges: "Les frais réels sont facturés par Mistral, à l’appel",
        costLabel: "Coût estimé",
        dashboardCostLabel: "Coût IA estimé",
        costHint: "estimé d’après un barème daté ; Mistral facture directement le cabinet",
        statusHint: "hébergé dans l’UE, clé côté serveur, facturé à l’appel",
        bannerTitle: "L’IA est Mistral, hébergée dans l’Union européenne",
        banner:
          `${APP_NAME} envoie une requête par analyse à Mistral, entreprise française, avec un ` +
          "traitement dans l’Union européenne. Le modèle rédige la formulation d’un résumé et rien " +
          `d’autre — chaque fait est établi par ${APP_NAME} depuis le dossier, et ce qui est envoyé ` +
          "ne contient ni nom, ni date, ni document. Chaque appel est facturé sur le compte Mistral du cabinet.",
        analystNote:
          "Un modèle Mistral hébergé dans l’UE rédige la formulation du résumé. Chaque fait est " +
          "dérivé du dossier ; ce qui est envoyé ne contient ni nom, ni date, ni document. " +
          "Chaque appel est facturé sur le compte Mistral du cabinet.",
        featuresNote:
          "Chaque fonction ci-dessous est produite depuis les enregistrements du cabinet. Un " +
          "modèle Mistral hébergé rédige la formulation d’un résumé et ne décide de rien ; " +
          "chaque analyse est facturée sur le compte Mistral du cabinet. Désactiver une " +
          "fonction la retire de l’assistant, et retire la carte du tableau de bord qui en " +
          "dépendait plutôt que de la laisser afficher zéro.",
        sentToProvider: "Chiffres dérivés uniquement, vers api.mistral.ai (UE)",
        sentToProviderHint:
          "des comptes, les sujets des désaccords, les types de documents manquants et la référence du dossier — jamais un nom, une date, une valeur de champ ni un document",
      };

    case "anthropic":
      return {
        word: "non implémenté",
        costTitle: "Non implémenté dans cette version",
        workspaceTitle: "Non implémenté dans cette version",
        whereItGoes:
          "AI_PROVIDER vaut anthropic, que cette version n’implémente pas. Aucune requête n’est " +
          "émise et aucun frais n’est engagé ; une analyse lancée avec ce réglage échoue plutôt " +
          "que de retomber en silence sur la simulation.",
        howItIsProduced:
          "Rien n’est produit. Voir prompts/ pour les instructions qu’un vrai fournisseur recevrait.",
        whatTheFiguresAre: "Il n’y a aucun chiffre, car aucune exécution ne peut aboutir.",
        whatItCannotTell:
          "Ce que cette page ne peut pas vous dire, c’est ce qu’un déploiement réel coûterait. " +
          "Cela dépend du modèle, de l’instruction et des documents réellement envoyés — rien " +
          "de tout cela n’existe ici.",
        usageCardTitle: "Consommation",
        noCharges: "Aucun — aucune exécution ne peut aboutir",
        costLabel: "Coût",
        dashboardCostLabel: "Coût IA",
        costHint: "aucune exécution ne peut aboutir",
        statusHint: "prévu, non implémenté",
        bannerTitle: "Le moteur d’IA configuré n’est pas implémenté",
        banner:
          "AI_PROVIDER vaut anthropic, que cette version n’implémente pas. Aucune requête n’est " +
          "émise, aucun frais n’est engagé, et aucune analyse ne peut aboutir.",
        analystNote: "Non implémenté dans cette version. Lancer une analyse échouera.",
        featuresNote:
          "Le fournisseur configuré n’est pas implémenté dans cette version, donc aucune des " +
          "fonctions ci-dessous ne peut rien produire. Les choix restent enregistrés pour ce cabinet.",
        sentToProvider: "Rien — aucune exécution ne peut aboutir",
        sentToProviderHint: "le fournisseur configuré n’est pas implémenté, donc aucune requête n’est jamais construite",
      };

    case "mock":
      return {
        word: "simulé",
        costTitle: "Coût simulé — aucun frais d’API n’a été engagé.",
        workspaceTitle: "Simulé, et par construction",
        whereItGoes:
          "Aucune requête ne quitte cette machine : rien n’a été envoyé à Anthropic ni à aucun " +
          "autre service, aucune clé d’API n’est configurée, et aucun frais n’est engagé. Les " +
          `chiffres ci-dessous montrent ce qu’${APP_NAME} a enregistré, pas ce qui a été ` +
          "facturé à quiconque.",
        howItIsProduced:
          `${DERIVED_FROM_THE_RECORD} Aucun modèle n’intervient à aucun moment.`,
        whatTheFiguresAre:
          "Chaque exécution enregistre les jetons qu’une vraie requête de cette taille aurait " +
          "utilisés et le coût qui aurait suivi, aux tarifs publiés. Les comptes de jetons sont " +
          "dérivés des champs du dossier et des noms de ses documents — les mêmes entrées que " +
          "lit l’analyse simulée — et évoluent donc de façon réaliste avec la taille d’un " +
          "dossier, sans qu’aucune requête soit émise.",
        whatItCannotTell:
          "Ce que cette page ne peut pas vous dire, c’est ce qu’un déploiement réel coûterait. " +
          "Cela dépend du modèle, de l’instruction et des documents réellement envoyés — rien " +
          "de tout cela n’existe ici.",
        usageCardTitle: "Consommation simulée",
        noCharges: "Aucun — chaque enregistrement est simulé",
        costLabel: "Coût simulé",
        dashboardCostLabel: "Coût IA simulé",
        costHint: "aucun frais n’a été engagé",
        statusHint: "sans clé, sans requête, sans frais",
        bannerTitle: "Aucun appel réel à une IA n’est effectué",
        banner:
          `${APP_NAME} fonctionne avec un assistant simulé. Aucune clé d’API Anthropic n’est requise ` +
          "et aucune requête ne quitte cette machine. Les coûts affichés ailleurs dans le produit sont simulés.",
        analystNote: "Simulé dans cette version. Aucun appel d’API n’est émis et aucun frais n’est engagé.",
        featuresNote:
          "Chaque fonction ci-dessous est simulée dans cette version et ne coûte rien à " +
          "exécuter. En désactiver une la retire de l’assistant — et retire la carte du tableau " +
          "de bord qui en dépendait, plutôt que de la laisser afficher zéro.",
        sentToProvider: "Rien",
        sentToProviderHint: "aucune clé n’est configurée et la simulation n’ouvre aucune connexion",
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
  if (isRealCharge) return "facturé";
  if (provider === "local") return "sur cette machine";
  return "simulé";
}
