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
  { value: "unknown", label: "Unknown" },
  { value: "f1", label: "F-1 student" },
  { value: "h1b", label: "H-1B" },
  { value: "l1", label: "L-1" },
  { value: "b2", label: "B-2 visitor" },
  { value: "tps", label: "Temporary Protected Status" },
  { value: "asylum_pending", label: "Asylum pending" },
  { value: "permanent_resident", label: "Permanent resident" },
  { value: "out_of_status", label: "Out of status" },
  { value: "other", label: "Other" },
] as const;

export const IMMIGRATION_FIELDS: readonly MatterField[] = [
  {
    key: "current_status",
    label: "Current status",
    type: "select",
    section: "Status",
    options: IMMIGRATION_STATUSES,
    help: "As stated by the client. Confirm against the documents.",
  },
  {
    key: "status_expiration_date",
    label: "Status expiration date",
    type: "date",
    section: "Status",
    help: "Never treated as a deadline until an attorney confirms it.",
  },
  { key: "immigration_objective", label: "Immigration objective", type: "textarea", section: "Status" },
  { key: "nationality", label: "Nationality", type: "text", section: "Identity" },
  { key: "country_of_birth", label: "Country of birth", type: "text", section: "Identity" },
  {
    key: "date_of_birth",
    label: "Date of birth",
    type: "date",
    section: "Identity",
    help: "Fictional in this environment.",
  },
  { key: "dependants", label: "Dependants", type: "number", section: "Identity" },
  { key: "i94_available", label: "I-94 available", type: "boolean", section: "Entry" },
  { key: "last_entry_date", label: "Last entry date", type: "date", section: "Entry" },
  {
    key: "last_entry_classification",
    label: "Last entry classification",
    type: "text",
    section: "Entry",
    help: "As printed on the I-94, if one has been provided.",
  },
  {
    key: "petitioner",
    label: "Petitioner",
    type: "text",
    section: "Parties",
    matterTypes: ["family_based", "employment_based", "consular_processing"],
  },
  {
    key: "beneficiary",
    label: "Beneficiary",
    type: "text",
    section: "Parties",
    matterTypes: ["family_based", "employment_based", "consular_processing"],
  },
  {
    key: "employer",
    label: "Employer",
    type: "text",
    section: "Parties",
    matterTypes: ["employment_based", "non_immigrant_visas"],
  },
  { key: "prior_applications", label: "Prior applications", type: "textarea", section: "History" },
  { key: "prior_removals", label: "Prior removals", type: "boolean", section: "History" },
  {
    key: "criminal_history_disclosed",
    label: "Criminal history disclosed",
    type: "boolean",
    section: "History",
    help: "Records that the client disclosed something, not what it was.",
  },
] as const;

// ---------------------------------------------------------------------------
// Employment & Labor Law — specification §16
// ---------------------------------------------------------------------------

export const EMPLOYMENT_FIELDS: readonly MatterField[] = [
  {
    key: "representation_side",
    label: "Representing",
    type: "select",
    section: "Representation",
    options: [
      { value: "employee", label: "The employee" },
      { value: "employer", label: "The employer" },
    ],
    // The matter list filters on this, so it is a column. Asked once, in the
    // basics of the creation form.
    storedOnMatter: true,
  },
  { key: "employer_name", label: "Employer name", type: "text", section: "Employment" },
  { key: "employee_name", label: "Employee name", type: "text", section: "Employment" },
  { key: "position", label: "Position", type: "text", section: "Employment" },
  { key: "employment_start_date", label: "Employment start date", type: "date", section: "Employment" },
  { key: "employment_end_date", label: "Employment end date", type: "date", section: "Employment" },
  {
    key: "current_employment_status",
    label: "Current employment status",
    type: "select",
    section: "Employment",
    options: [
      { value: "employed", label: "Still employed" },
      { value: "resigned", label: "Resigned" },
      { value: "terminated", label: "Terminated" },
      { value: "laid_off", label: "Laid off" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  { key: "union_membership", label: "Union membership", type: "boolean", section: "Employment" },
  { key: "salary_or_rate", label: "Salary or hourly rate", type: "text", section: "Pay and hours" },
  { key: "regular_hours", label: "Regular working hours", type: "text", section: "Pay and hours" },
  {
    key: "alleged_unpaid_hours",
    label: "Alleged unpaid hours",
    type: "text",
    section: "Pay and hours",
    help: "As alleged. Nothing here establishes that hours were unpaid.",
  },
  {
    key: "exempt_status",
    label: "Exempt or non-exempt",
    type: "select",
    section: "Pay and hours",
    options: [
      { value: "unknown", label: "Unknown — to be determined by an attorney" },
      { value: "exempt", label: "Stated as exempt" },
      { value: "non_exempt", label: "Stated as non-exempt" },
    ],
    help: "Orchelio never determines this. It records what was stated.",
  },
  {
    key: "protected_characteristic_alleged",
    label: "Protected characteristic alleged",
    type: "text",
    section: "Allegations",
    help: "An allegation recorded, not a finding.",
  },
  { key: "requested_accommodation", label: "Requested accommodation", type: "textarea", section: "Allegations" },
  { key: "leave_requested", label: "Leave requested", type: "textarea", section: "Allegations" },
  {
    key: "damages_alleged",
    label: "Damages alleged",
    type: "textarea",
    section: "Allegations",
    help: "As alleged. Orchelio never calculates damages.",
  },
  { key: "complaint_made_internally", label: "Complaint made internally", type: "boolean", section: "Complaint and action" },
  { key: "complaint_date", label: "Complaint date", type: "date", section: "Complaint and action" },
  { key: "adverse_action", label: "Adverse action", type: "textarea", section: "Complaint and action" },
  { key: "termination_date", label: "Termination date", type: "date", section: "Complaint and action" },
  { key: "termination_reason_stated", label: "Termination reason stated", type: "textarea", section: "Complaint and action" },
  { key: "employment_agreement_available", label: "Employment agreement available", type: "boolean", section: "Evidence" },
  { key: "handbook_available", label: "Handbook available", type: "boolean", section: "Evidence" },
  { key: "performance_reviews_available", label: "Performance reviews available", type: "boolean", section: "Evidence" },
  { key: "disciplinary_notices_available", label: "Disciplinary notices available", type: "boolean", section: "Evidence" },
  { key: "witnesses", label: "Witnesses", type: "textarea", section: "Evidence" },
  { key: "relevant_communications", label: "Relevant communications", type: "textarea", section: "Evidence" },
  { key: "agency_charge_filed", label: "Agency charge filed", type: "boolean", section: "Agency" },
  { key: "agency_filing_date", label: "Agency filing date", type: "date", section: "Agency" },
  { key: "right_to_sue_notice", label: "Right-to-sue notice received", type: "boolean", section: "Agency" },
  {
    key: "severance_agreement_available",
    label: "Severance agreement available",
    type: "boolean",
    section: "Severance",
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
  if (value === undefined || value === null || value === "") return "Unknown";

  switch (field.type) {
    case "boolean":
      return value === true ? "Yes" : "No";
    case "select":
      return field.options?.find((option) => option.value === value)?.label ?? String(value);
    default:
      return String(value);
  }
}
