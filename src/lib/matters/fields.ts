/**
 * Orchelio — practice-area matter fields.
 *
 * An immigration matter records a status expiration date and an I-94
 * classification. An employment matter records a termination date and an hourly
 * rate. Neither firm should ever see the other's fields.
 *
 * These are declared as data, not as two hand-written forms, for the same
 * reason the rest of the product is configuration-driven: adding a practice
 * area must be an edit to a catalogue, not a fork of a screen. `Matter.fields`
 * is a JSON column precisely so this can vary — see
 * docs/decisions/ADR-0002-strings-not-enums-text-not-json.md.
 *
 * ## What these fields are not
 *
 * They are what a client or a paralegal *stated*, not what has been verified,
 * and never a legal conclusion. "Protected characteristic alleged" records an
 * allegation; it does not establish discrimination. The specification is
 * explicit about this (§16) and every screen that shows these values says so.
 */

export type FieldType = "text" | "textarea" | "date" | "number" | "select" | "boolean";

export type MatterField = {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  /** Shown under the label. Use it to say what the field means, not how to type. */
  help?: string;
  options?: readonly { value: string; label: string }[];
  /** Only offered for these matter types. Absent means every type in the area. */
  matterTypes?: readonly string[];
  /**
   * This value lives in a column on the matter, not in the JSON blob.
   *
   * It stays in this catalogue because it is part of the practice area's
   * vocabulary and every screen reads the catalogue to know what to show. But
   * the creation form must not ask for it twice, and `sanitiseFieldValues`
   * must not copy it into the JSON — two places holding the same answer is two
   * places that can disagree, and then neither is trustworthy.
   */
  storedOnMatter?: true;
};

// ---------------------------------------------------------------------------
// Immigration Law — specification §15
// ---------------------------------------------------------------------------

const IMMIGRATION_STATUSES = [
  { value: "unknown", label: "Inconnu" },
  { value: "vls_ts_etudiant", label: "VLS-TS étudiant" },
  { value: "cst_salarie", label: "Carte de séjour temporaire « salarié »" },
  { value: "cst_vpf", label: "Carte de séjour « vie privée et familiale »" },
  { value: "passeport_talent", label: "Passeport talent" },
  { value: "recepisse", label: "Récépissé de demande en cours" },
  { value: "asile_en_cours", label: "Demande d’asile en cours" },
  { value: "carte_resident", label: "Carte de résident (10 ans)" },
  { value: "sans_titre", label: "Sans titre de séjour" },
  { value: "other", label: "Autre" },
] as const;

export const IMMIGRATION_FIELDS: readonly MatterField[] = [
  {
    key: "current_status",
    label: "Titre de séjour actuel",
    type: "select",
    section: "Statut",
    options: IMMIGRATION_STATUSES,
    help: "Tel que déclaré par le client. À confirmer contre les documents.",
  },
  {
    key: "status_expiration_date",
    label: "Date d’expiration du titre",
    type: "date",
    section: "Statut",
    help: "Jamais traitée comme une échéance tant qu’un avocat ne l’a pas confirmée.",
  },
  { key: "immigration_objective", label: "Démarche envisagée", type: "textarea", section: "Statut" },
  { key: "nationality", label: "Nationalité", type: "text", section: "Identité" },
  { key: "country_of_birth", label: "Pays de naissance", type: "text", section: "Identité" },
  {
    key: "date_of_birth",
    label: "Date de naissance",
    type: "date",
    section: "Identité",
    help: "Fictive dans cet environnement.",
  },
  { key: "dependants", label: "Personnes à charge", type: "number", section: "Identité" },
  { key: "residence_permit_available", label: "Titre de séjour ou récépissé fourni", type: "boolean", section: "Entrée et séjour" },
  { key: "last_entry_date", label: "Date de dernière entrée en France", type: "date", section: "Entrée et séjour" },
  {
    key: "last_entry_classification",
    label: "Visa sous lequel l’entrée a eu lieu",
    type: "text",
    section: "Entrée et séjour",
    help: "Tel que porté sur le visa ou le cachet d’entrée, s’ils ont été fournis.",
  },
  {
    key: "petitioner",
    label: "Demandeur (résidant en France)",
    type: "text",
    section: "Parties",
    matterTypes: ["family_based", "employment_based", "consular_processing"],
  },
  {
    key: "beneficiary",
    label: "Membre de famille concerné",
    type: "text",
    section: "Parties",
    matterTypes: ["family_based", "employment_based", "consular_processing"],
  },
  {
    key: "employer",
    label: "Employeur",
    type: "text",
    section: "Parties",
    matterTypes: ["employment_based", "non_immigrant_visas"],
  },
  { key: "prior_applications", label: "Demandes antérieures", type: "textarea", section: "Historique" },
  { key: "prior_removals", label: "OQTF ou mesure d’éloignement antérieure", type: "boolean", section: "Historique" },
  {
    key: "criminal_history_disclosed",
    label: "Antécédents pénaux déclarés",
    type: "boolean",
    section: "Historique",
    help: "Enregistre que le client a déclaré quelque chose, pas ce que c’était.",
  },
] as const;

// ---------------------------------------------------------------------------
// Employment & Labor Law — specification §16
// ---------------------------------------------------------------------------

export const EMPLOYMENT_FIELDS: readonly MatterField[] = [
  {
    key: "representation_side",
    label: "Partie représentée",
    type: "select",
    section: "Représentation",
    options: [
      { value: "employee", label: "Le salarié" },
      { value: "employer", label: "L’employeur" },
    ],
    // The matter list filters on this, so it is a column. Asked once, in the
    // basics of the creation form.
    storedOnMatter: true,
  },
  { key: "employer_name", label: "Nom de l’employeur", type: "text", section: "Emploi" },
  { key: "employee_name", label: "Nom du salarié", type: "text", section: "Emploi" },
  { key: "position", label: "Poste", type: "text", section: "Emploi" },
  { key: "employment_start_date", label: "Date de début d’emploi", type: "date", section: "Emploi" },
  { key: "employment_end_date", label: "Date de fin d’emploi", type: "date", section: "Emploi" },
  {
    key: "current_employment_status",
    label: "Situation d’emploi actuelle",
    type: "select",
    section: "Emploi",
    options: [
      { value: "employed", label: "Toujours en poste" },
      { value: "resigned", label: "Démission" },
      { value: "terminated", label: "Licenciement" },
      { value: "laid_off", label: "Licenciement économique" },
      { value: "unknown", label: "Inconnu" },
    ],
  },
  { key: "union_membership", label: "Appartenance syndicale", type: "boolean", section: "Emploi" },
  { key: "salary_or_rate", label: "Salaire ou taux horaire", type: "text", section: "Paie et heures" },
  { key: "regular_hours", label: "Heures de travail habituelles", type: "text", section: "Paie et heures" },
  {
    key: "alleged_unpaid_hours",
    label: "Heures impayées alléguées",
    type: "text",
    section: "Paie et heures",
    help: "Telles qu’alléguées. Rien ici n’établit que des heures étaient impayées.",
  },
  {
    key: "exempt_status",
    label: "Régime de durée du travail",
    type: "select",
    section: "Paie et heures",
    options: [
      { value: "unknown", label: "Inconnu — à déterminer par un avocat" },
      { value: "forfait_jours", label: "Déclaré au forfait jours" },
      { value: "horaire_35h", label: "Déclaré à l’horaire collectif" },
    ],
    help: "Orchelio ne le détermine jamais. Il enregistre ce qui a été déclaré.",
  },
  {
    key: "protected_characteristic_alleged",
    label: "Caractéristique protégée alléguée",
    type: "text",
    section: "Allégations",
    help: "Une allégation enregistrée, pas une constatation.",
  },
  { key: "requested_accommodation", label: "Aménagement demandé", type: "textarea", section: "Allégations" },
  { key: "leave_requested", label: "Congé demandé", type: "textarea", section: "Allégations" },
  {
    key: "damages_alleged",
    label: "Préjudice allégué",
    type: "textarea",
    section: "Allégations",
    help: "Tel qu’allégué. Orchelio ne calcule jamais un préjudice.",
  },
  { key: "complaint_made_internally", label: "Plainte interne déposée", type: "boolean", section: "Plainte et mesures" },
  { key: "complaint_date", label: "Date de la plainte", type: "date", section: "Plainte et mesures" },
  { key: "adverse_action", label: "Mesure défavorable", type: "textarea", section: "Plainte et mesures" },
  { key: "termination_date", label: "Date de licenciement", type: "date", section: "Plainte et mesures" },
  { key: "termination_reason_stated", label: "Motif de licenciement déclaré", type: "textarea", section: "Plainte et mesures" },
  { key: "employment_agreement_available", label: "Contrat de travail disponible", type: "boolean", section: "Pièces" },
  { key: "handbook_available", label: "Règlement intérieur disponible", type: "boolean", section: "Pièces" },
  { key: "performance_reviews_available", label: "Évaluations disponibles", type: "boolean", section: "Pièces" },
  { key: "disciplinary_notices_available", label: "Avertissements disciplinaires disponibles", type: "boolean", section: "Pièces" },
  { key: "witnesses", label: "Témoins", type: "textarea", section: "Pièces" },
  { key: "relevant_communications", label: "Échanges pertinents", type: "textarea", section: "Pièces" },
  { key: "agency_charge_filed", label: "Conseil de prud’hommes saisi", type: "boolean", section: "Procédure" },
  { key: "agency_filing_date", label: "Date de la saisine", type: "date", section: "Procédure" },
  { key: "right_to_sue_notice", label: "Convocation au bureau de conciliation reçue", type: "boolean", section: "Procédure" },
  {
    key: "severance_agreement_available",
    label: "Accord d’indemnité disponible",
    type: "boolean",
    section: "Indemnité de départ",
    matterTypes: ["severance_review", "wrongful_termination"],
  },
] as const;

// ---------------------------------------------------------------------------

const BY_PRACTICE_AREA: Record<string, readonly MatterField[]> = {
  immigration: IMMIGRATION_FIELDS,
  employment_law: EMPLOYMENT_FIELDS,
};

/** The fields to show for a matter of this area and type. */
export function fieldsFor(practiceArea: string, matterTypeKey?: string): MatterField[] {
  const fields = BY_PRACTICE_AREA[practiceArea] ?? [];
  return fields.filter(
    (field) => !field.matterTypes || !matterTypeKey || field.matterTypes.includes(matterTypeKey),
  );
}

/** The fields a form should ask for: everything except what a column already holds. */
export function editableFieldsFor(practiceArea: string, matterTypeKey?: string): MatterField[] {
  return fieldsFor(practiceArea, matterTypeKey).filter((field) => !field.storedOnMatter);
}

/** The same fields, grouped into their sections, in declaration order. */
export function sectionsFor(
  practiceArea: string,
  matterTypeKey?: string,
): { section: string; fields: MatterField[] }[] {
  return groupIntoSections(fieldsFor(practiceArea, matterTypeKey));
}

/** The editable fields, grouped the same way. Used by the creation form. */
export function editableSectionsFor(
  practiceArea: string,
  matterTypeKey?: string,
): { section: string; fields: MatterField[] }[] {
  return groupIntoSections(editableFieldsFor(practiceArea, matterTypeKey));
}

function groupIntoSections(
  fields: readonly MatterField[],
): { section: string; fields: MatterField[] }[] {
  const grouped = new Map<string, MatterField[]>();

  for (const field of fields) {
    const list = grouped.get(field.section) ?? [];
    list.push(field);
    grouped.set(field.section, list);
  }

  return [...grouped.entries()].map(([section, fields]) => ({ section, fields }));
}

/**
 * Keeps only values that belong to a known field, and normalises them.
 *
 * A form can be edited before it is submitted, so an unknown key is dropped
 * rather than stored: `Matter.fields` is a JSON column, and without this it
 * would accept anything anyone chose to post.
 */
export function sanitiseFieldValues(
  practiceArea: string,
  matterTypeKey: string | undefined,
  submitted: Record<string, unknown>,
): Record<string, string | number | boolean> {
  // Column-backed fields are excluded, so a post that sets both the column and
  // the JSON copy cannot leave the two disagreeing.
  const allowed = new Map(editableFieldsFor(practiceArea, matterTypeKey).map((f) => [f.key, f]));
  const cleaned: Record<string, string | number | boolean> = {};

  for (const [key, raw] of Object.entries(submitted)) {
    const field = allowed.get(key);
    if (!field) continue;

    const value = String(raw ?? "").trim();
    if (value === "") continue;

    switch (field.type) {
      case "boolean":
        cleaned[key] = value === "true" || value === "on" || value === "yes";
        break;
      case "number": {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) cleaned[key] = parsed;
        break;
      }
      case "select":
        // Only an offered option, so a hand-crafted post cannot invent a status.
        if (field.options?.some((option) => option.value === value)) cleaned[key] = value;
        break;
      default:
        cleaned[key] = value.slice(0, 2000);
    }
  }

  return cleaned;
}

/** Formats a stored value for display. Unknown stays unknown. */
export function displayValue(field: MatterField, value: unknown): string {
  if (value === undefined || value === null || value === "") return "Inconnu";

  switch (field.type) {
    case "boolean":
      return value === true ? "Oui" : "Non";
    case "select":
      return field.options?.find((option) => option.value === value)?.label ?? String(value);
    default:
      return String(value);
  }
}
