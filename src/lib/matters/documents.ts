/**
 * Orchelio — document categories, and what "expected" means.
 *
 * Each practice area has its own filing cabinet. An immigration matter expects a
 * passport and an I-94; an employment matter expects pay stubs and a
 * termination letter. Both lists come from the specification (§17).
 *
 * "Expected" is a checklist, not a judgement. A matter missing a document is a
 * matter with a question to ask the client — never a matter with a legal
 * problem, and Orchelio must not imply otherwise.
 */

export type DocumentCategory = {
  key: string;
  label: string;
  /** Expected for these matter types. Absent means "useful, not expected". */
  expectedFor?: readonly string[];
  /**
   * Why a matter of this kind usually needs it.
   *
   * Phrased as what the document establishes, never as what its absence
   * implies. "Records the date and terms of entry" is useful; "without it the
   * claim will fail" is a legal conclusion Orchelio must not reach.
   */
  whyItMatters?: string;
};

export const IMMIGRATION_CATEGORIES: readonly DocumentCategory[] = [
  { key: "passport", label: "Passport", expectedFor: ["*"], whyItMatters: "Establishes identity, nationality and the validity dates the rest of the file is read against." },
  { key: "i94", label: "I-94", expectedFor: ["*"], whyItMatters: "Records the date, place and class of the last admission — the dates a status calculation starts from." },
  { key: "visa", label: "Visa" },
  { key: "uscis_notice", label: "USCIS Notice" },
  { key: "birth_certificate", label: "Birth Certificate", expectedFor: ["family_based", "naturalisation"], whyItMatters: "Evidences the family relationship a petition is built on." },
  { key: "marriage_certificate", label: "Marriage Certificate", expectedFor: ["family_based"], whyItMatters: "Evidences the marriage a family-based petition relies on." },
  { key: "employment_letter", label: "Employment Letter", expectedFor: ["employment_based"], whyItMatters: "Sets out the role, salary and terms the petitioning employer is offering." },
  { key: "tax_record", label: "Tax Record", expectedFor: ["naturalisation"], whyItMatters: "Shows the filing history a naturalisation application is assessed against." },
  { key: "prior_filing", label: "Prior Filing" },
  { key: "police_certificate", label: "Police Certificate" },
  { key: "other", label: "Other" },
] as const;

export const EMPLOYMENT_CATEGORIES: readonly DocumentCategory[] = [
  { key: "employment_agreement", label: "Employment Agreement", expectedFor: ["*"], whyItMatters: "Sets out the agreed terms — pay, hours, classification and any clauses that bind the parties." },
  { key: "offer_letter", label: "Offer Letter" },
  { key: "employee_handbook", label: "Employee Handbook" },
  { key: "pay_stub", label: "Pay Stub", expectedFor: ["unpaid_wages", "wage_and_hour"], whyItMatters: "Shows what was actually paid, period by period." },
  { key: "time_record", label: "Time Record", expectedFor: ["unpaid_wages", "wage_and_hour"], whyItMatters: "Shows the hours actually recorded, to compare against what was paid." },
  { key: "payroll_record", label: "Payroll Record" },
  {
    key: "performance_review",
    label: "Performance Review",
    expectedFor: ["wrongful_termination", "retaliation", "workplace_discrimination"],
    whyItMatters: "Records how the employer assessed the employee, and when.",
  },
  { key: "disciplinary_notice", label: "Disciplinary Notice" },
  {
    key: "termination_letter",
    label: "Termination Letter",
    expectedFor: ["wrongful_termination", "retaliation"],
    whyItMatters: "Records the stated reason for the ending of employment, and its date.",
  },
  { key: "severance_agreement", label: "Severance Agreement", expectedFor: ["severance_review"], whyItMatters: "Contains the release, the consideration and any deadline for acceptance." },
  {
    key: "internal_complaint",
    label: "Internal Complaint",
    expectedFor: ["retaliation", "workplace_discrimination", "workplace_harassment"],
    whyItMatters: "Records what was raised with the employer, and on what date.",
  },
  { key: "hr_correspondence", label: "HR Correspondence" },
  { key: "email", label: "Email" },
  { key: "text_message", label: "Text Message" },
  { key: "medical_or_accommodation_request", label: "Medical or Accommodation Request" },
  { key: "leave_request", label: "Leave Request" },
  { key: "agency_charge", label: "Agency Charge" },
  { key: "right_to_sue", label: "Right-to-Sue Notice" },
  { key: "witness_statement", label: "Witness Statement" },
  { key: "other", label: "Other" },
] as const;

const BY_PRACTICE_AREA: Record<string, readonly DocumentCategory[]> = {
  immigration: IMMIGRATION_CATEGORIES,
  employment_law: EMPLOYMENT_CATEGORIES,
};

/**
 * Which documents establish who somebody is.
 *
 * The dashboard separates "missing identity documents" from the rest, because
 * they are chased differently: an absent passport is a request to the client,
 * an absent marriage certificate is often a request to a registry.
 */
export const IDENTITY_CATEGORIES: readonly string[] = [
  "passport",
  "i94",
  "visa",
  "birth_certificate",
];

/** Documents that evidence pay and hours, for the employment dashboard. */
export const WAGE_CATEGORIES: readonly string[] = ["pay_stub", "time_record", "payroll_record"];

export function categoriesFor(practiceArea: string): readonly DocumentCategory[] {
  return BY_PRACTICE_AREA[practiceArea] ?? [{ key: "other", label: "Other" }];
}

export function categoryLabel(practiceArea: string, key: string): string {
  return categoriesFor(practiceArea).find((category) => category.key === key)?.label ?? key;
}

export function isKnownCategory(practiceArea: string, key: string): boolean {
  return categoriesFor(practiceArea).some((category) => category.key === key);
}

/**
 * Categories expected for a matter but not yet present.
 *
 * Deliberately a plain set difference over the categories a firm has filed —
 * no inference, no scoring. The AI's own view of what is missing, with reasons
 * and priorities, arrives in Phase 6 and is a separate thing that a human
 * reviews.
 */
export function expectedButMissing(
  practiceArea: string,
  matterTypeKey: string,
  presentCategories: readonly string[],
): DocumentCategory[] {
  const present = new Set(presentCategories);

  return categoriesFor(practiceArea).filter((category) => {
    if (!category.expectedFor) return false;
    const applies = category.expectedFor.includes("*") || category.expectedFor.includes(matterTypeKey);
    return applies && !present.has(category.key);
  });
}
