/**
 * Orchelio — the six fictional matters.
 *
 * Every person, employer, date and document below is invented. Nothing here
 * describes a real client or a real dispute, and the addresses use the reserved
 * `.local` domain, which cannot exist on the real internet.
 *
 * Each matter is shaped to demonstrate one thing when the simulated AI arrives
 * in Phase 6 — a clean file, a contradiction, an incomplete file, and their
 * employment equivalents — so the data is chosen, not random.
 */

export type DemoDocument = {
  filename: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  /** Days before the seed date. Keeps the fixtures stable and relative. */
  receivedDaysAgo: number;
  verified: boolean;
};

export type DemoTask = {
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueInDays?: number;
};

export type DemoMatter = {
  firmSlug: string;
  reference: string;
  title: string;
  clientName: string;
  matterTypeKey: string;
  practiceAreaKey: string;
  status: string;
  representationSide?: string;
  /** Which demo account is responsible, by email. */
  attorneyEmail: string;
  openedDaysAgo: number;
  nextDeadlineInDays?: number;
  fields: Record<string, string | number | boolean>;
  documents: DemoDocument[];
  tasks: DemoTask[];
  /** The intake answers, as a client or paralegal would have given them. */
  intake: Record<string, string>;
  /** What this matter is meant to demonstrate. Shown nowhere; read by humans. */
  demonstrates: string;
};

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const JPEG = "image/jpeg";

export const DEMO_MATTERS: readonly DemoMatter[] = [
  // --- Immigration ---------------------------------------------------------
  {
    firmSlug: "dupont-immigration-law",
    reference: "IMM-2026-001",
    title: "Family-based petition — Alvarez",
    clientName: "Sofia Alvarez",
    matterTypeKey: "family_based",
    practiceAreaKey: "immigration",
    status: "active",
    attorneyEmail: "immigration.attorney@demo.local",
    openedDaysAgo: 46,
    nextDeadlineInDays: 34,
    demonstrates:
      "A complete, consistent file. The analysis should produce a clear timeline, a short list of missing documents, and no contradiction.",
    fields: {
      current_status: "f1",
      status_expiration_date: "2027-05-31",
      immigration_objective: "Adjustment of status through marriage to a United States citizen.",
      nationality: "Mexican",
      country_of_birth: "Mexico",
      date_of_birth: "1994-03-12",
      dependants: 0,
      i94_available: true,
      last_entry_date: "2023-08-14",
      last_entry_classification: "F-1",
      petitioner: "Daniel Alvarez (spouse, US citizen)",
      beneficiary: "Sofia Alvarez",
      prior_applications: "F-1 student visa granted 2023. No prior petitions.",
      prior_removals: false,
      criminal_history_disclosed: false,
    },
    documents: [
      { filename: "passport-alvarez.pdf", category: "passport", mimeType: PDF, sizeBytes: 1_842_000, receivedDaysAgo: 44, verified: true },
      { filename: "i94-alvarez.pdf", category: "i94", mimeType: PDF, sizeBytes: 214_000, receivedDaysAgo: 44, verified: true },
      { filename: "marriage-certificate.pdf", category: "marriage_certificate", mimeType: PDF, sizeBytes: 906_000, receivedDaysAgo: 40, verified: true },
      { filename: "f1-visa.jpg", category: "visa", mimeType: JPEG, sizeBytes: 1_120_000, receivedDaysAgo: 40, verified: false },
    ],
    tasks: [
      { title: "Request birth certificate", description: "Expected for a family-based petition.", status: "open", priority: "medium", dueInDays: 7 },
      { title: "Confirm status expiration date with the attorney", status: "open", priority: "low", dueInDays: 14 },
    ],
    intake: {
      how_did_you_hear: "Referred by a former client.",
      relationship_to_petitioner: "Spouse, married August 2025.",
      current_address_country: "United States",
      previous_immigration_help: "None.",
    },
  },
  {
    firmSlug: "dupont-immigration-law",
    reference: "IMM-2026-002",
    title: "Status review — Moreau",
    clientName: "Daniel Moreau",
    matterTypeKey: "employment_based",
    practiceAreaKey: "immigration",
    status: "attorney_review",
    attorneyEmail: "immigration.attorney@demo.local",
    openedDaysAgo: 21,
    nextDeadlineInDays: 12,
    demonstrates:
      "A contradiction on the record: the intake gives one entry date, the I-94 filename and metadata another. The analysis must surface it and refuse to resolve it.",
    fields: {
      current_status: "h1b",
      // Deliberately close to today, so the matter reads as urgent.
      status_expiration_date: "2026-09-30",
      immigration_objective: "Extension of H-1B status with the current employer.",
      nationality: "French",
      country_of_birth: "France",
      date_of_birth: "1990-11-02",
      dependants: 2,
      i94_available: true,
      // The intake says 2024-02-11. The I-94 says 2024-03-04. Both are recorded.
      last_entry_date: "2024-02-11",
      last_entry_classification: "H-1B",
      petitioner: "Northwind Systems LLC",
      beneficiary: "Daniel Moreau",
      employer: "Northwind Systems LLC",
      prior_applications: "H-1B granted 2021, extended 2024.",
      prior_removals: false,
      criminal_history_disclosed: false,
    },
    documents: [
      { filename: "passport-moreau.pdf", category: "passport", mimeType: PDF, sizeBytes: 1_640_000, receivedDaysAgo: 20, verified: true },
      { filename: "i94-moreau-entry-2024-03-04.pdf", category: "i94", mimeType: PDF, sizeBytes: 198_000, receivedDaysAgo: 20, verified: false },
      { filename: "uscis-receipt-notice.pdf", category: "uscis_notice", mimeType: PDF, sizeBytes: 452_000, receivedDaysAgo: 18, verified: true },
    ],
    tasks: [
      { title: "Ask the client which entry date is correct", description: "The intake and the I-94 disagree. Do not resolve it internally.", status: "open", priority: "high", dueInDays: 3 },
      { title: "Request the employment letter", description: "Expected for an employment-based matter and not yet received.", status: "open", priority: "high", dueInDays: 5 },
    ],
    intake: {
      stated_last_entry_date: "11 February 2024",
      employer_name: "Northwind Systems LLC",
      job_title: "Systems engineer",
      dependants_in_us: "Spouse and one child.",
    },
  },
  {
    firmSlug: "dupont-immigration-law",
    reference: "IMM-2026-003",
    title: "Initial consultation — Hassan",
    clientName: "Amira Hassan",
    matterTypeKey: "naturalisation",
    practiceAreaKey: "immigration",
    status: "consultation_scheduled",
    attorneyEmail: "immigration.attorney@demo.local",
    openedDaysAgo: 6,
    demonstrates:
      "An incomplete file. Most fields are unknown and the essential documents are absent. The analysis must reach 'more information required' and state no conclusion.",
    fields: {
      current_status: "unknown",
      immigration_objective: "Naturalisation, timing to be assessed.",
      nationality: "Sudanese",
      i94_available: false,
      prior_removals: false,
    },
    documents: [
      { filename: "identity-page.jpg", category: "passport", mimeType: JPEG, sizeBytes: 780_000, receivedDaysAgo: 5, verified: false },
    ],
    tasks: [
      { title: "Prepare the consultation question list", status: "open", priority: "high", dueInDays: 2 },
      { title: "Request the I-94 and prior filings", status: "open", priority: "high", dueInDays: 4 },
    ],
    intake: {
      how_long_in_the_us: "Client is not certain — approximately nine years.",
      prior_applications: "Believes an application was filed in 2019 but has no copy.",
      travel_since_arrival: "Unknown.",
    },
  },

  // --- Employment & Labor --------------------------------------------------
  {
    firmSlug: "carter-employment-labor-law",
    reference: "EMP-2026-001",
    title: "Unpaid overtime — Reed",
    clientName: "Marcus Reed",
    matterTypeKey: "unpaid_wages",
    practiceAreaKey: "employment_law",
    status: "active",
    representationSide: "employee",
    attorneyEmail: "employment.attorney@demo.local",
    openedDaysAgo: 38,
    nextDeadlineInDays: 26,
    demonstrates:
      "Pay stubs and time records that do not line up, with weeks missing from both. The analysis compares them factually and asks the attorney to interpret.",
    fields: {
      employer_name: "Harbour Logistics Inc.",
      employee_name: "Marcus Reed",
      position: "Warehouse associate",
      employment_start_date: "2023-04-17",
      current_employment_status: "employed",
      salary_or_rate: "$21.50 per hour",
      regular_hours: "40 per week, stated",
      alleged_unpaid_hours: "Approximately 6–9 hours per week since January 2025, as alleged.",
      exempt_status: "unknown",
      union_membership: false,
      complaint_made_internally: true,
      complaint_date: "2026-02-09",
      adverse_action: "None alleged.",
      employment_agreement_available: true,
      handbook_available: true,
      witnesses: "Two colleagues on the same shift, named at intake.",
      relevant_communications: "Messages with the shift manager about staying late.",
      damages_alleged: "Unpaid overtime, amount not calculated.",
      agency_charge_filed: false,
    },
    documents: [
      { filename: "employment-agreement-reed.pdf", category: "employment_agreement", mimeType: PDF, sizeBytes: 640_000, receivedDaysAgo: 36, verified: true },
      { filename: "pay-stubs-2025-q4.pdf", category: "pay_stub", mimeType: PDF, sizeBytes: 1_260_000, receivedDaysAgo: 35, verified: true },
      { filename: "pay-stubs-2026-q1.pdf", category: "pay_stub", mimeType: PDF, sizeBytes: 1_180_000, receivedDaysAgo: 35, verified: true },
      { filename: "time-records-partial.pdf", category: "time_record", mimeType: PDF, sizeBytes: 890_000, receivedDaysAgo: 30, verified: false },
      { filename: "messages-with-manager.pdf", category: "text_message", mimeType: PDF, sizeBytes: 320_000, receivedDaysAgo: 28, verified: false },
    ],
    tasks: [
      { title: "Request the missing time records", description: "Several weeks are absent from the file.", status: "open", priority: "high", dueInDays: 5 },
      { title: "Attorney to review the exempt classification question", description: "Orchelio does not determine this.", status: "open", priority: "medium", dueInDays: 10 },
    ],
    intake: {
      typical_week: "Scheduled 40 hours, regularly asked to stay past the end of the shift.",
      overtime_paid: "Client states it was not paid after January 2025.",
      raised_with_employer: "Yes, with the shift manager in February 2026.",
    },
  },
  {
    firmSlug: "carter-employment-labor-law",
    reference: "EMP-2026-002",
    title: "Discrimination and retaliation — Vasquez",
    clientName: "Elena Vasquez",
    matterTypeKey: "retaliation",
    practiceAreaKey: "employment_law",
    status: "internal_investigation",
    representationSide: "employee",
    attorneyEmail: "employment.attorney@demo.local",
    openedDaysAgo: 27,
    nextDeadlineInDays: 18,
    demonstrates:
      "A sequence where timing matters: positive reviews, then an internal complaint, then a disciplinary notice, then termination. The analysis reports the sequence and must not conclude that retaliation occurred.",
    fields: {
      employer_name: "Brightview Retail Group",
      employee_name: "Elena Vasquez",
      position: "Assistant store manager",
      employment_start_date: "2021-09-06",
      employment_end_date: "2026-06-19",
      current_employment_status: "terminated",
      salary_or_rate: "$58,000 per year",
      exempt_status: "unknown",
      union_membership: false,
      protected_characteristic_alleged: "National origin, as alleged by the client.",
      complaint_made_internally: true,
      complaint_date: "2026-04-28",
      adverse_action: "Disciplinary notice 15 May 2026; termination 19 June 2026.",
      termination_date: "2026-06-19",
      termination_reason_stated: "Employer stated 'performance and attendance'.",
      performance_reviews_available: true,
      disciplinary_notices_available: true,
      employment_agreement_available: true,
      witnesses: "One colleague present at the complaint meeting.",
      relevant_communications: "Email exchange with the HR business partner.",
      damages_alleged: "Lost earnings since June 2026, amount not calculated.",
      agency_charge_filed: false,
      right_to_sue_notice: false,
    },
    documents: [
      { filename: "performance-review-2024.pdf", category: "performance_review", mimeType: PDF, sizeBytes: 410_000, receivedDaysAgo: 25, verified: true },
      { filename: "performance-review-2025.pdf", category: "performance_review", mimeType: PDF, sizeBytes: 428_000, receivedDaysAgo: 25, verified: true },
      { filename: "internal-complaint-2026-04-28.pdf", category: "internal_complaint", mimeType: PDF, sizeBytes: 260_000, receivedDaysAgo: 24, verified: true },
      { filename: "disciplinary-notice-2026-05-15.pdf", category: "disciplinary_notice", mimeType: PDF, sizeBytes: 240_000, receivedDaysAgo: 24, verified: true },
      { filename: "termination-letter-2026-06-19.pdf", category: "termination_letter", mimeType: PDF, sizeBytes: 305_000, receivedDaysAgo: 22, verified: true },
      { filename: "hr-emails.pdf", category: "hr_correspondence", mimeType: PDF, sizeBytes: 720_000, receivedDaysAgo: 20, verified: false },
    ],
    tasks: [
      { title: "Identify and contact the witness", status: "open", priority: "high", dueInDays: 6 },
      { title: "Request the employee handbook", status: "open", priority: "medium", dueInDays: 12 },
      { title: "Attorney to assess agency filing timing", description: "Deadlines are never calculated by Orchelio.", status: "open", priority: "high", dueInDays: 8 },
    ],
    intake: {
      complaint_content: "Raised comments about her national origin with HR in April 2026.",
      response_from_employer: "Client states no written outcome was provided.",
      performance_before_complaint: "Two positive annual reviews.",
    },
  },
  {
    firmSlug: "carter-employment-labor-law",
    reference: "EMP-2026-003",
    title: "Severance agreement review — Bennett",
    clientName: "Thomas Bennett",
    matterTypeKey: "severance_review",
    practiceAreaKey: "employment_law",
    status: "attorney_review",
    representationSide: "employee",
    attorneyEmail: "employment.attorney@demo.local",
    openedDaysAgo: 9,
    nextDeadlineInDays: 5,
    demonstrates:
      "A document to be read closely: release language, a non-compete, an acceptance deadline, and incomplete bonus information. The deadline must be confirmed by a person, never by Orchelio.",
    fields: {
      employer_name: "Calder & Finch Consulting",
      employee_name: "Thomas Bennett",
      position: "Senior consultant",
      employment_start_date: "2019-01-14",
      employment_end_date: "2026-07-15",
      current_employment_status: "terminated",
      salary_or_rate: "$104,000 per year",
      exempt_status: "unknown",
      termination_date: "2026-07-15",
      termination_reason_stated: "Employer stated 'restructuring'.",
      employment_agreement_available: true,
      severance_agreement_available: true,
      handbook_available: false,
      damages_alleged: "None alleged; the client is deciding whether to sign.",
      agency_charge_filed: false,
    },
    documents: [
      { filename: "severance-agreement-draft.docx", category: "severance_agreement", mimeType: DOCX, sizeBytes: 96_000, receivedDaysAgo: 8, verified: true },
      { filename: "employment-agreement-2019.pdf", category: "employment_agreement", mimeType: PDF, sizeBytes: 580_000, receivedDaysAgo: 8, verified: true },
      { filename: "offer-letter-2019.pdf", category: "offer_letter", mimeType: PDF, sizeBytes: 210_000, receivedDaysAgo: 7, verified: false },
    ],
    tasks: [
      { title: "Attorney to confirm the acceptance deadline", description: "Read from the agreement, confirmed by a person. Orchelio never sets a deadline.", status: "open", priority: "high", dueInDays: 2 },
      { title: "Request the bonus plan documentation", description: "The agreement refers to a bonus that is not documented in the file.", status: "open", priority: "high", dueInDays: 3 },
    ],
    intake: {
      deadline_given: "Client was told he has 21 days from 15 July 2026.",
      bonus_question: "Believes an unpaid bonus is outstanding; has no plan document.",
      other_offers: "None.",
    },
  },
] as const;
