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
    return "Opening a matter is held by attorneys and firm administrators. Ask one of them to open it — you will be able to add documents to it as soon as it exists.";
  }
  if (input.matterTypes.length === 0) {
    return "This firm has not yet chosen which kinds of matter it handles, so there is nothing to open one as. A firm administrator sets that in Settings, under Matter types.";
  }
  return null;
}

export function guidedReadiness(input: GuidedInput): GuidedReadiness {
  const blocked = blockingReason(input);

  const documents: GuidedStep = input.canAddDocuments
    ? {
        key: "documents",
        title: "Your files are listed",
        will: true,
        // Said here as well as on the upload panel, because this is where a
        // person decides whether to drag a client's file onto the screen.
        note: "Only the name, the type and the size of each file are recorded. The files themselves stay on your computer — Orchelio never receives them and never opens one.",
      }
    : {
        key: "documents",
        title: "Your files are listed",
        will: false,
        note: "Your role does not add documents. The matter will still be opened, and a colleague can add them to it afterwards.",
      };

  const analysisWill = input.canRunAnalysis && input.aiFeatures.length > 0;
  const analysis: GuidedStep = {
    key: "analysis",
    title: "Orchelio reads what you have entered",
    will: analysisWill,
    note: analysisWill
      ? "It works from what you typed and from the names of the files — never from inside a document. You get back what disagrees with what, what is usually on file and is not, and the questions worth asking the client."
      : input.aiFeatures.length === 0
        ? "This firm has switched off every AI feature, so nothing would be produced. The matter is still opened. A firm administrator can switch them back on in Settings, under AI features."
        : "Your role does not run an analysis. The matter is still opened, and a colleague can run one on it.",
  };

  return {
    canOpen: blocked === null,
    blocked,
    steps: [
      {
        key: "matter",
        title: "A matter is opened",
        will: true,
        note: "It gets a reference of its own and belongs to this firm. Nobody outside the firm can reach it.",
      },
      documents,
      analysis,
      {
        key: "decision",
        title: "Nothing is decided",
        will: true,
        // The last line on the page, and the point of the whole product.
        note: "Whatever comes back is a draft nobody has stood behind. It waits for a person to read it and take responsibility — and that person is you.",
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
