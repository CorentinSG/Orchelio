/**
 * Orchelio — the guided demonstration.
 *
 * Twenty-one steps that walk somebody through the whole product in order, each
 * naming the account to use, the screen to open, and — the part that matters —
 * what to *look* for once there.
 *
 * The steps are data rather than prose in a page for two reasons. A test can
 * check that every step points at a route that exists and names an account that
 * exists, which is the way a walkthrough stops rotting the moment a screen
 * moves. And the same list can be rendered publicly, before sign-in, so a
 * visitor knows what they are about to see.
 *
 * Several steps deliberately ask the reader to notice a *refusal* or an
 * *absence*: what Orchelio declines to do is the substance of the product, not
 * a gap in it.
 */

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export type GuideStep = {
  number: number;
  title: string;
  /** The account to be signed in as. `null` means it does not matter. */
  account: string | null;
  /** Where to go. A path inside this application. */
  href: string;
  /** What to do there, in one instruction. */
  action: string;
  /** What to look for. Usually the point of the step. */
  notice: string;
};

export const GUIDE_STEP_COUNT = 21;

export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    number: 1,
    title: "Sign in as an immigration attorney",
    account: "immigration.attorney@demo.local",
    href: "/login",
    action: `Sign in with the password ${DEMO_PASSWORD}. Every account on the sign-in page uses it.`,
    notice:
      "The password is printed on the page. It is written in a public repository, so hiding it would be theatre rather than security.",
  },
  {
    number: 2,
    title: "The dashboard is not a template",
    account: "immigration.attorney@demo.local",
    href: "/dashboard",
    action: "Read the cards along the top.",
    notice:
      "They are immigration questions — status expirations, priority dates. Nothing in the code says so; they come from this firm's configuration.",
  },
  {
    number: 3,
    title: "The matter list",
    account: "immigration.attorney@demo.local",
    href: "/matters",
    action: "Open the list and then one matter.",
    notice:
      "Three matters, all fictional. Each was written to demonstrate one thing: a complete file, a contradiction, and an incomplete file.",
  },
  {
    number: 4,
    title: "A matter shows its practice area's fields",
    account: "immigration.attorney@demo.local",
    href: "/matters",
    action: "Look at the fields on the matter you opened.",
    notice:
      "Priority date, status expiry, country of birth. An employment matter has none of these — the fields follow the matter type, not the code.",
  },
  {
    number: 5,
    title: "Documents, and the ones that are missing",
    account: "immigration.paralegal@demo.local",
    href: "/documents",
    action: "Open the documents tab of a matter and read the expected-documents panel.",
    notice:
      "Orchelio lists what a matter of this type usually needs and what has not arrived. It never opens a file: only the name is read.",
  },
  {
    number: 6,
    title: "Intake",
    account: "immigration.paralegal@demo.local",
    href: "/intake",
    action: "Look at a completed intake questionnaire.",
    notice:
      "The answers are what the firm wrote down about the client. Orchelio repeats them; it does not judge them.",
  },
  {
    number: 7,
    title: "Run an analysis",
    account: "immigration.attorney@demo.local",
    href: "/ai",
    action: "Open a matter's Analysis tab and run one.",
    notice:
      "It takes about a second and costs nothing: the provider is a simulation, and it says so on the result.",
  },
  {
    number: 8,
    title: "Read what the analysis does not say",
    account: "immigration.attorney@demo.local",
    href: "/ai",
    action: "Read the result carefully, looking for a conclusion.",
    notice:
      "There is none, and there is no empty space where one would go. An analysis has no field for a conclusion, a recommendation or an eligibility finding.",
  },
  {
    number: 9,
    title: "A second model checks the first",
    account: "immigration.attorney@demo.local",
    href: "/ai",
    action: "Read the review beneath the analysis.",
    notice:
      "It reports whether the analysis is fit for a human to read — never whether it is right. It cannot approve anything.",
  },
  {
    number: 10,
    title: "Nothing takes effect without a person",
    account: "immigration.attorney@demo.local",
    href: "/approvals",
    action: "Find the analysis waiting for a decision.",
    notice:
      "The analysis exists but is not usable until somebody decides. The decision, not the analysis, is what changes anything.",
  },
  {
    number: 11,
    title: "Reject one, and say why",
    account: "immigration.attorney@demo.local",
    href: "/approvals",
    action: "Reject a request. Orchelio will insist on a written reason.",
    notice:
      "A rejection without a reason is a decision nobody can audit. The note is mandatory, and it becomes a task.",
  },
  {
    number: 12,
    title: "A draft that cannot be sent",
    account: "immigration.attorney@demo.local",
    href: "/matters",
    action: "Prepare a communication from a matter's Communications tab.",
    notice:
      "There is no send button anywhere in Orchelio, and no 'sent' status in the database. Approving a draft means a person is content for those words to leave the firm; that person then sends them.",
  },
  {
    number: 13,
    title: "Tasks",
    account: "immigration.paralegal@demo.local",
    href: "/tasks",
    action: "Look at the task list.",
    notice: "The rejection from step 11 is here, as a task for a person to act on.",
  },
  {
    number: 14,
    title: "The activity log records refusals too",
    account: "immigration.attorney@demo.local",
    href: "/activity",
    action: "Read the log, and look for an entry whose outcome is not a success.",
    notice:
      "Sign-ins, decisions, and every refused attempt to reach something. A log that only records successes is a log of the wrong half.",
  },
  {
    number: 15,
    title: "What it would have cost",
    account: "immigration.attorney@demo.local",
    href: "/usage",
    action: "Read the usage and cost screen.",
    notice:
      "Every figure is simulated, and the record itself carries that fact — it is not a label added by the screen. No API charge was incurred.",
  },
  {
    number: 16,
    title: "Switch an AI feature off",
    account: "immigration.attorney@demo.local",
    href: "/settings?section=ai",
    action: "Turn off 'Identify missing documents', save, then go back to the dashboard.",
    notice:
      "The widget that depended on it is gone, not showing zero. A zero would read as 'nothing to do', which nobody has established.",
  },
  {
    number: 17,
    title: "Nine rules you cannot switch off",
    account: "immigration.attorney@demo.local",
    href: "/settings?section=approvals",
    action: "Try to turn off a rule with a padlock.",
    notice:
      "There is no control to turn off. These nine are safety properties, not preferences: no automatic filing, no permanent deletion, no settlement communication, no final deadline without a person.",
  },
  {
    number: 18,
    title: "The same code, a different product",
    account: "reviewer@demo.local",
    href: "/dashboard",
    action: "Sign in as the reviewer, who belongs to both firms, and switch to the employment firm.",
    notice:
      "Different cards, different matter fields, different vocabulary — 'evidence collection' rather than 'document collection'. One codebase; the configuration is the difference.",
  },
  {
    number: 19,
    title: "Try to reach the other firm's matter",
    account: "reviewer@demo.local",
    href: "/matters",
    action:
      "Copy a matter link from one firm, switch to the other, and paste it into the address bar.",
    notice:
      "The refusal is worded exactly as it would be for a matter that does not exist. A refusal that said 'forbidden' would confirm the record was real.",
  },
  {
    number: 20,
    title: "Create a third firm",
    account: "platform.admin@demo.local",
    href: "/admin/firms",
    action: "Sign in as the platform administrator and create a firm.",
    notice:
      "The administrator can see that firms exist and how much they use the platform — and cannot open a single matter in any of them.",
  },
  {
    number: 21,
    title: "Configure it, and watch it become a different product",
    account: null,
    href: "/onboarding",
    action:
      "Sign in as the new firm's administrator and answer the seven questions. Then open its dashboard.",
    notice:
      "A third firm now exists, with its own screens, its own vocabulary and its own rules. No code was changed to make it.",
  },
] as const;

/** Every account the walkthrough asks a reader to sign in as. */
export function guideAccounts(): readonly string[] {
  return [...new Set(GUIDE_STEPS.map((step) => step.account).filter((email): email is string => email !== null))];
}

/** True when every named account is one the demonstration actually seeds. */
export function guideAccountsExist(): boolean {
  const seeded = new Set(DEMO_ACCOUNTS.map((account) => account.email));
  return guideAccounts().every((email) => seeded.has(email));
}
