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
  { key: "immigration", label: "Immigration Law", status: "available" },
  { key: "employment_law", label: "Employment & Labor Law", status: "available" },
  { key: "family_law", label: "Family Law", status: "planned" },
  { key: "personal_injury", label: "Personal Injury", status: "planned" },
  { key: "criminal_defence", label: "Criminal Defence", status: "planned" },
  { key: "business_law", label: "Business Law", status: "planned" },
  { key: "landlord_tenant", label: "Landlord–Tenant Law", status: "planned" },
  { key: "other", label: "Other", status: "planned" },
] as const;

export function practiceAreaLabel(key: string): string {
  return PRACTICE_AREAS.find((area) => area.key === key)?.label ?? "Unassigned practice area";
}

export function isPracticeAreaAvailable(key: string): boolean {
  return PRACTICE_AREAS.some((area) => area.key === key && area.status === "available");
}
