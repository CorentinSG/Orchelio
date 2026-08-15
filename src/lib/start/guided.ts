/**
 * Orchelio — opening a matter in one screen.
 *
 * The product already did everything this does. It took ten steps: create a
 * matter, fill eight fields, find the documents tab, add each file one at a
 * time with a category for each, find the AI tab, press run. Every one of those
 * steps is defensible on its own and the sum of them is where a solicitor who
 * does not think of themselves as a computer person gives up.
 *
 * So this composes the three things that already work — create, record, analyse
 * — behind one form, and asks for four answers instead of a dozen.
 *
 * **What it must not do is hide what is about to happen.** A screen that
 * quietly does three things on one button press is a screen nobody can predict,
 * and a lawyer who cannot predict a tool will not put a client's file in it. So
 * the page lists the steps *before* the button, says which ones will not run
 * and why, and says what is still waiting for a person afterwards.
 *
 * That is what this module is: the readiness, in the firm's own terms, computed
 * before anything is submitted rather than reported after it fails.
 */

/** One thing that will, or will not, happen when the form is submitted. */
export type GuidedStep = {
  key: "matter" | "documents" | "analysis" | "decision";
  /** What a lawyer would call this step. */
  title: string;
  /** Whether it will actually run. A step that will not is shown, not hidden. */
  will: boolean;
  /** What happens, or why it will not. Written for somebody with no jargon. */
  note: string;
};

export type GuidedReadiness = {
  /** Whether the form should be offered at all. */
  canOpen: boolean;
  /** When it should not be, the single sentence saying why. */
  blocked: string | null;
  /** Every step, in the order it happens, including the ones that will not. */
  steps: GuidedStep[];
};

export type GuidedInput = {
  canCreateMatter: boolean;
  canAddDocuments: boolean;
  canRunAnalysis: boolean;
  /** Matter types this firm enabled during onboarding. */
  matterTypes: readonly string[];
  /** AI features this firm switched on. */
  aiFeatures: readonly string[];
};

/**
 * The one sentence that stops the form being offered.
 *
 * Two conditions, and they are refusals for different reasons: the first is
 * about this person, the second about this firm. Both name what to do next,
 * because "you cannot" without "here is who can" is a dead end.
 */
function blockingReason(input: GuidedInput): string | null {
  if (!input.canCreateMatter) {
    return "L’ouverture d’un dossier appartient aux avocats et aux administrateurs du cabinet. Demandez à l’un d’eux de l’ouvrir — vous pourrez y ajouter des documents dès qu’il existera.";
  }
  if (input.matterTypes.length === 0) {
    return "Ce cabinet n’a pas encore choisi quels types de dossier il traite : il n’y a donc rien sous quoi en ouvrir un. Un administrateur du cabinet le règle dans Réglages, sous Types de dossier.";
  }
  return null;
}

export function guidedReadiness(input: GuidedInput): GuidedReadiness {
  const blocked = blockingReason(input);

  const documents: GuidedStep = input.canAddDocuments
    ? {
        key: "documents",
        title: "Vos fichiers sont recensés",
        will: true,
        // Said here as well as on the upload panel, because this is where a
        // person decides whether to drag a client's file onto the screen.
        note: "Seuls le nom, le type et la taille de chaque fichier sont enregistrés. Les fichiers eux-mêmes restent sur votre ordinateur — Orchelio ne les reçoit jamais et n’en ouvre aucun.",
      }
    : {
        key: "documents",
        title: "Vos fichiers sont recensés",
        will: false,
        note: "Votre rôle n’ajoute pas de documents. Le dossier sera tout de même ouvert, et un collègue pourra les y ajouter ensuite.",
      };

  const analysisWill = input.canRunAnalysis && input.aiFeatures.length > 0;
  const analysis: GuidedStep = {
    key: "analysis",
    title: "Orchelio lit ce que vous avez saisi",
    will: analysisWill,
    note: analysisWill
      ? "Il travaille à partir de ce que vous avez tapé et du nom des fichiers — jamais de l’intérieur d’un document. Vous obtenez ce qui se contredit, ce qui figure d’habitude au dossier et manque ici, et les questions qui valent la peine d’être posées au client."
      : input.aiFeatures.length === 0
        ? "Ce cabinet a désactivé toutes les fonctions d’IA : rien ne serait produit. Le dossier est tout de même ouvert. Un administrateur du cabinet peut les réactiver dans Réglages, sous Fonctions d’IA."
        : "Votre rôle ne lance pas d’analyse. Le dossier est tout de même ouvert, et un collègue pourra en lancer une dessus.",
  };

  return {
    canOpen: blocked === null,
    blocked,
    steps: [
      {
        key: "matter",
        title: "Un dossier est ouvert",
        will: true,
        note: "Il reçoit sa propre référence et appartient à ce cabinet. Personne hors du cabinet ne peut l’atteindre.",
      },
      documents,
      analysis,
      {
        key: "decision",
        title: "Rien n’est décidé",
        will: true,
        // The last line on the page, and the point of the whole product.
        note: "Ce qui revient est un brouillon derrière lequel personne ne s’est rangé. Il attend qu’une personne le lise et en prenne la responsabilité — et cette personne, c’est vous.",
      },
    ],
  };
}

/** How many files one submission may carry. */
export const MAX_FILES_AT_ONCE = 10;

/**
 * The category a file is filed under when nobody has said.
 *
 * Asking a lawyer to classify each file before they have read it is the step
 * this screen exists to remove — and a wrong category is worse than none,
 * because the missing-documents check would then believe something is on file
 * that is not. "Other" is the honest answer until a person looks, and the
 * matter's documents tab is where they change it.
 */
export const UNSORTED_CATEGORY = "other";
