/**
 * Orchelio — practice area catalogue.
 *
 * The onboarding questionnaire (Phase 4) offers this list. Only the two areas
 * marked `available` ship a full template in the demonstration; the others
 * render as "Template coming soon" rather than being hidden, so the product
 * shows how it is meant to grow.
 *
 * Adding a practice area is a configuration change, not a code fork — see
 * docs/ARCHITECTURE.md, "Adding a practice area".
 */

export type PracticeAreaKey =
  | "immigration"
  | "employment_law"
  | "family_law"
  | "personal_injury"
  | "criminal_defence"
  | "business_law"
  | "landlord_tenant"
  | "other";

export type PracticeArea = {
  key: PracticeAreaKey;
  /** Label shown in the interface. US English, as agreed for the demonstration. */
  label: string;
  /** `available` = full template. `planned` = selectable, shows "Template coming soon". */
  status: "available" | "planned";
};

export const PRACTICE_AREAS: readonly PracticeArea[] = [
  { key: "immigration", label: "Droit de l’immigration", status: "available" },
  { key: "employment_law", label: "Droit du travail", status: "available" },
  { key: "family_law", label: "Droit de la famille", status: "planned" },
  { key: "personal_injury", label: "Dommage corporel", status: "planned" },
  { key: "criminal_defence", label: "Droit pénal", status: "planned" },
  { key: "business_law", label: "Droit des affaires", status: "planned" },
  { key: "landlord_tenant", label: "Droit des baux", status: "planned" },
  { key: "other", label: "Autre", status: "planned" },
] as const;

export function practiceAreaLabel(key: string): string {
  return PRACTICE_AREAS.find((area) => area.key === key)?.label ?? "Unassigned practice area";
}

export function isPracticeAreaAvailable(key: string): boolean {
  return PRACTICE_AREAS.some((area) => area.key === key && area.status === "available");
}
