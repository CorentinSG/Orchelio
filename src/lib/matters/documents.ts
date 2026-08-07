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
  { key: "passport", label: "Passeport", expectedFor: ["*"], whyItMatters: "Établit l’identité, la nationalité et les dates de validité contre lesquelles tout le dossier se lit." },
  { key: "i94", label: "I-94", expectedFor: ["*"], whyItMatters: "Consigne la date, le lieu et la catégorie de la dernière admission — les dates d’où part tout calcul de statut." },
  { key: "visa", label: "Visa" },
  { key: "uscis_notice", label: "Avis USCIS" },
  { key: "birth_certificate", label: "Acte de naissance", expectedFor: ["family_based", "naturalisation"], whyItMatters: "Atteste le lien familial sur lequel une pétition repose." },
  { key: "marriage_certificate", label: "Acte de mariage", expectedFor: ["family_based"], whyItMatters: "Atteste le mariage sur lequel repose une pétition familiale." },
  { key: "employment_letter", label: "Attestation d’emploi", expectedFor: ["employment_based"], whyItMatters: "Décrit le poste, le salaire et les conditions que l’employeur pétitionnaire propose." },
  { key: "tax_record", label: "Justificatif fiscal", expectedFor: ["naturalisation"], whyItMatters: "Montre l’historique de déclarations contre lequel une demande de naturalisation est examinée." },
  { key: "prior_filing", label: "Dépôt antérieur" },
  { key: "police_certificate", label: "Certificat de police" },
  { key: "other", label: "Autre" },
] as const;

export const EMPLOYMENT_CATEGORIES: readonly DocumentCategory[] = [
  { key: "employment_agreement", label: "Contrat de travail", expectedFor: ["*"], whyItMatters: "Fixe les conditions convenues — paie, heures, classification et toute clause qui lie les parties." },
  { key: "offer_letter", label: "Lettre d’embauche" },
  { key: "employee_handbook", label: "Règlement intérieur" },
  { key: "pay_stub", label: "Bulletin de paie", expectedFor: ["unpaid_wages", "wage_and_hour"], whyItMatters: "Montre ce qui a réellement été payé, période par période." },
  { key: "time_record", label: "Relevé d’heures", expectedFor: ["unpaid_wages", "wage_and_hour"], whyItMatters: "Montre les heures réellement consignées, à comparer avec ce qui a été payé." },
  { key: "payroll_record", label: "Registre de paie" },
  {
    key: "performance_review",
    label: "Évaluation",
    expectedFor: ["wrongful_termination", "retaliation", "workplace_discrimination"],
    whyItMatters: "Consigne comment l’employeur a évalué le salarié, et quand.",
  },
  { key: "disciplinary_notice", label: "Avertissement disciplinaire" },
  {
    key: "termination_letter",
    label: "Lettre de licenciement",
    expectedFor: ["wrongful_termination", "retaliation"],
    whyItMatters: "Consigne le motif déclaré de la fin d’emploi, et sa date.",
  },
  { key: "severance_agreement", label: "Accord d’indemnité de départ", expectedFor: ["severance_review"], whyItMatters: "Contient la renonciation, la contrepartie et tout délai d’acceptation." },
  {
    key: "internal_complaint",
    label: "Plainte interne",
    expectedFor: ["retaliation", "workplace_discrimination", "workplace_harassment"],
    whyItMatters: "Consigne ce qui a été signalé à l’employeur, et à quelle date.",
  },
  { key: "hr_correspondence", label: "Échanges avec les RH" },
  { key: "email", label: "Courriel" },
  { key: "text_message", label: "SMS" },
  { key: "medical_or_accommodation_request", label: "Demande médicale ou d’aménagement" },
  { key: "leave_request", label: "Demande de congé" },
  { key: "agency_charge", label: "Plainte à l’agence" },
  { key: "right_to_sue", label: "Avis de droit d’agir" },
  { key: "witness_statement", label: "Déclaration de témoin" },
  { key: "other", label: "Autre" },
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
  return BY_PRACTICE_AREA[practiceArea] ?? [{ key: "other", label: "Autre" }];
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
