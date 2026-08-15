/**
 * Orchelio — the six fictional matters.
 *
 * Every person, employer, date and document below is invented. Nothing here
 * describes a real client or a real dispute, and the addresses use the reserved
 * `.local` domain, which cannot exist on the real internet.
 *
 * Each matter is shaped to demonstrate one thing — a clean file, a
 * contradiction, an incomplete file, and their employment equivalents — so the
 * data is chosen, not random.
 *
 * The procedure is French: titres de séjour, préfecture, regroupement familial,
 * conseil de prud’hommes. It was American until the V1 pivot, which made the
 * demonstration unreadable to the firms it is shown to. The vocabulary here is
 * plausible rather than verified — a specialist review is required before this
 * shape of matter is ever used with a real client, as it already is for
 * everything else in this build.
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
  // --- Droit des étrangers -------------------------------------------------
  {
    firmSlug: "dupont-immigration-law",
    reference: "IMM-2026-001",
    title: "Regroupement familial — Alvarez",
    clientName: "Sofia Alvarez",
    matterTypeKey: "family_based",
    practiceAreaKey: "immigration",
    status: "active",
    attorneyEmail: "immigration.attorney@demo.local",
    openedDaysAgo: 46,
    nextDeadlineInDays: 34,
    demonstrates:
      "Un dossier complet et cohérent. L’analyse doit produire une chronologie claire, une courte liste de documents manquants, et aucune contradiction.",
    fields: {
      current_status: "vls_ts_etudiant",
      status_expiration_date: "2027-05-31",
      immigration_objective:
        "Changement de statut vers une carte de séjour « vie privée et familiale » au titre du mariage.",
      nationality: "Colombienne",
      country_of_birth: "Colombie",
      date_of_birth: "1994-03-12",
      dependants: 0,
      residence_permit_available: true,
      last_entry_date: "2023-08-14",
      last_entry_classification: "VLS-TS étudiant",
      petitioner: "Daniel Alvarez (conjoint, de nationalité française)",
      beneficiary: "Sofia Alvarez",
      prior_applications: "VLS-TS étudiant délivré en 2023. Aucune demande antérieure.",
      prior_removals: false,
      criminal_history_disclosed: false,
    },
    documents: [
      { filename: "passeport-alvarez.pdf", category: "passport", mimeType: PDF, sizeBytes: 1_842_000, receivedDaysAgo: 44, verified: true },
      { filename: "titre-sejour-alvarez.pdf", category: "residence_permit", mimeType: PDF, sizeBytes: 214_000, receivedDaysAgo: 44, verified: true },
      { filename: "acte-mariage.pdf", category: "marriage_certificate", mimeType: PDF, sizeBytes: 906_000, receivedDaysAgo: 40, verified: true },
      { filename: "visa-etudiant.jpg", category: "visa", mimeType: JPEG, sizeBytes: 1_120_000, receivedDaysAgo: 40, verified: false },
    ],
    tasks: [
      { title: "Demander l’acte de naissance traduit", description: "Attendu pour une demande au titre de la vie familiale.", status: "open", priority: "medium", dueInDays: 7 },
      { title: "Faire confirmer la date d’expiration du titre par l’avocat", status: "open", priority: "low", dueInDays: 14 },
    ],
    intake: {
      comment_nous_avez_vous_connus: "Recommandée par une ancienne cliente.",
      lien_avec_le_demandeur: "Conjointe, mariés en août 2025.",
      pays_de_residence_actuel: "France",
      accompagnement_anterieur: "Aucun.",
    },
  },
  {
    firmSlug: "dupont-immigration-law",
    reference: "IMM-2026-002",
    title: "Renouvellement de titre — Moreau",
    clientName: "Daniel Moreau",
    matterTypeKey: "employment_based",
    practiceAreaKey: "immigration",
    status: "attorney_review",
    attorneyEmail: "immigration.attorney@demo.local",
    openedDaysAgo: 21,
    nextDeadlineInDays: 12,
    demonstrates:
      "Une contradiction au dossier : le questionnaire donne une date d’entrée, le nom du titre de séjour en donne une autre. L’analyse doit la signaler et refuser de la trancher.",
    fields: {
      current_status: "passeport_talent",
      // Deliberately close to today, so the matter reads as urgent.
      status_expiration_date: "2026-09-30",
      immigration_objective: "Renouvellement du passeport talent auprès du même employeur.",
      nationality: "Canadienne",
      country_of_birth: "Canada",
      date_of_birth: "1990-11-02",
      dependants: 2,
      residence_permit_available: true,
      // The intake says 2024-02-11. The permit's filename says 2024-03-04.
      // Both are recorded, and neither is preferred.
      last_entry_date: "2024-02-11",
      last_entry_classification: "Passeport talent",
      petitioner: "Northwind Systems SAS",
      beneficiary: "Daniel Moreau",
      employer: "Northwind Systems SAS",
      prior_applications: "Passeport talent délivré en 2021, renouvelé en 2024.",
      prior_removals: false,
      criminal_history_disclosed: false,
    },
    documents: [
      { filename: "passeport-moreau.pdf", category: "passport", mimeType: PDF, sizeBytes: 1_640_000, receivedDaysAgo: 20, verified: true },
      { filename: "titre-sejour-moreau-entree-2024-03-04.pdf", category: "residence_permit", mimeType: PDF, sizeBytes: 198_000, receivedDaysAgo: 20, verified: false },
      { filename: "courrier-prefecture-recepisse.pdf", category: "prefecture_letter", mimeType: PDF, sizeBytes: 452_000, receivedDaysAgo: 18, verified: true },
    ],
    tasks: [
      { title: "Demander au client quelle date d’entrée est exacte", description: "Le questionnaire et le titre de séjour se contredisent. Ne pas trancher en interne.", status: "open", priority: "high", dueInDays: 3 },
      { title: "Demander la promesse d’embauche", description: "Attendue pour un dossier professionnel, pas encore reçue.", status: "open", priority: "high", dueInDays: 5 },
    ],
    intake: {
      date_entree_declaree: "11 février 2024",
      employeur: "Northwind Systems SAS",
      intitule_du_poste: "Ingénieur systèmes",
      personnes_a_charge_en_france: "Conjointe et un enfant.",
    },
  },
  {
    firmSlug: "dupont-immigration-law",
    reference: "IMM-2026-003",
    title: "Première consultation — Hassan",
    clientName: "Amira Hassan",
    matterTypeKey: "naturalisation",
    practiceAreaKey: "immigration",
    status: "consultation_scheduled",
    attorneyEmail: "immigration.attorney@demo.local",
    openedDaysAgo: 6,
    demonstrates:
      "Un dossier incomplet. La plupart des champs sont inconnus et les pièces essentielles sont absentes. L’analyse doit conclure qu’il manque des informations, et n’énoncer aucune conclusion.",
    fields: {
      current_status: "unknown",
      immigration_objective: "Naturalisation par décret ; le moment reste à apprécier.",
      nationality: "Soudanaise",
      residence_permit_available: false,
      prior_removals: false,
    },
    documents: [
      { filename: "page-identite.jpg", category: "passport", mimeType: JPEG, sizeBytes: 780_000, receivedDaysAgo: 5, verified: false },
    ],
    tasks: [
      { title: "Préparer la liste de questions pour la consultation", status: "open", priority: "high", dueInDays: 2 },
      { title: "Demander le titre de séjour et les demandes antérieures", status: "open", priority: "high", dueInDays: 4 },
    ],
    intake: {
      duree_de_presence_en_france: "La cliente n’est pas certaine — environ neuf ans.",
      demandes_anterieures: "Pense qu’une demande a été déposée en 2019, sans en avoir de copie.",
      voyages_depuis_l_arrivee: "Inconnu.",
    },
  },

  // --- Droit du travail ----------------------------------------------------
  {
    firmSlug: "carter-employment-labor-law",
    reference: "EMP-2026-001",
    title: "Heures supplémentaires impayées — Reed",
    clientName: "Marcus Reed",
    matterTypeKey: "unpaid_wages",
    practiceAreaKey: "employment_law",
    status: "active",
    representationSide: "employee",
    attorneyEmail: "employment.attorney@demo.local",
    openedDaysAgo: 38,
    nextDeadlineInDays: 26,
    demonstrates:
      "Des bulletins de paie et des relevés d’heures qui ne concordent pas, avec des semaines absentes des deux. L’analyse les compare factuellement et laisse l’interprétation à l’avocat.",
    fields: {
      employer_name: "Harbour Logistique SAS",
      employee_name: "Marcus Reed",
      position: "Agent de quai",
      employment_start_date: "2023-04-17",
      current_employment_status: "employed",
      salary_or_rate: "14,20 € de l’heure",
      regular_hours: "35 heures par semaine, déclarées",
      alleged_unpaid_hours: "Environ 6 à 9 heures par semaine depuis janvier 2025, selon ce qui est allégué.",
      exempt_status: "unknown",
      union_membership: false,
      complaint_made_internally: true,
      complaint_date: "2026-02-09",
      adverse_action: "Aucune alléguée.",
      employment_agreement_available: true,
      handbook_available: true,
      witnesses: "Deux collègues de la même équipe, nommés au questionnaire.",
      relevant_communications: "Messages avec le chef d’équipe au sujet des fins de poste tardives.",
      damages_alleged: "Heures supplémentaires impayées, montant non chiffré.",
      agency_charge_filed: false,
    },
    documents: [
      { filename: "contrat-travail-reed.pdf", category: "employment_agreement", mimeType: PDF, sizeBytes: 640_000, receivedDaysAgo: 36, verified: true },
      { filename: "bulletins-paie-2025-t4.pdf", category: "pay_stub", mimeType: PDF, sizeBytes: 1_260_000, receivedDaysAgo: 35, verified: true },
      { filename: "bulletins-paie-2026-t1.pdf", category: "pay_stub", mimeType: PDF, sizeBytes: 1_180_000, receivedDaysAgo: 35, verified: true },
      { filename: "releves-heures-partiels.pdf", category: "time_record", mimeType: PDF, sizeBytes: 890_000, receivedDaysAgo: 30, verified: false },
      { filename: "messages-chef-equipe.pdf", category: "text_message", mimeType: PDF, sizeBytes: 320_000, receivedDaysAgo: 28, verified: false },
    ],
    tasks: [
      { title: "Demander les relevés d’heures manquants", description: "Plusieurs semaines sont absentes du dossier.", status: "open", priority: "high", dueInDays: 5 },
      { title: "Faire examiner par l’avocat la question du régime de durée du travail", description: "Orchelio ne le détermine pas.", status: "open", priority: "medium", dueInDays: 10 },
    ],
    intake: {
      semaine_type: "35 heures planifiées, avec des demandes régulières de rester après la fin du poste.",
      heures_supplementaires_payees: "Le client déclare qu’elles n’ont plus été payées après janvier 2025.",
      signalement_a_l_employeur: "Oui, auprès du chef d’équipe en février 2026.",
    },
  },
  {
    firmSlug: "carter-employment-labor-law",
    reference: "EMP-2026-002",
    title: "Licenciement après signalement — Vasquez",
    clientName: "Elena Vasquez",
    matterTypeKey: "retaliation",
    practiceAreaKey: "employment_law",
    status: "internal_investigation",
    representationSide: "employee",
    attorneyEmail: "employment.attorney@demo.local",
    openedDaysAgo: 27,
    nextDeadlineInDays: 18,
    demonstrates:
      "Une suite d’événements où la chronologie compte : des évaluations positives, puis un signalement interne, puis un avertissement, puis un licenciement. L’analyse rapporte la séquence et ne doit pas conclure à des représailles.",
    fields: {
      employer_name: "Brightview Distribution SA",
      employee_name: "Elena Vasquez",
      position: "Adjointe au responsable de magasin",
      employment_start_date: "2021-09-06",
      employment_end_date: "2026-06-19",
      current_employment_status: "terminated",
      salary_or_rate: "38 000 € bruts par an",
      exempt_status: "unknown",
      union_membership: false,
      protected_characteristic_alleged: "L’origine, selon ce qu’allègue la cliente.",
      complaint_made_internally: true,
      complaint_date: "2026-04-28",
      adverse_action: "Avertissement le 15 mai 2026 ; licenciement le 19 juin 2026.",
      termination_date: "2026-06-19",
      termination_reason_stated: "L’employeur a invoqué « la performance et l’assiduité ».",
      performance_reviews_available: true,
      disciplinary_notices_available: true,
      employment_agreement_available: true,
      witnesses: "Une collègue présente lors de l’entretien de signalement.",
      relevant_communications: "Échange de courriels avec la responsable des ressources humaines.",
      damages_alleged: "Perte de revenus depuis juin 2026, montant non chiffré.",
      agency_charge_filed: false,
      right_to_sue_notice: false,
    },
    documents: [
      { filename: "entretien-annuel-2024.pdf", category: "performance_review", mimeType: PDF, sizeBytes: 410_000, receivedDaysAgo: 25, verified: true },
      { filename: "entretien-annuel-2025.pdf", category: "performance_review", mimeType: PDF, sizeBytes: 428_000, receivedDaysAgo: 25, verified: true },
      { filename: "signalement-interne-2026-04-28.pdf", category: "internal_complaint", mimeType: PDF, sizeBytes: 260_000, receivedDaysAgo: 24, verified: true },
      { filename: "avertissement-2026-05-15.pdf", category: "disciplinary_notice", mimeType: PDF, sizeBytes: 240_000, receivedDaysAgo: 24, verified: true },
      { filename: "lettre-licenciement-2026-06-19.pdf", category: "termination_letter", mimeType: PDF, sizeBytes: 305_000, receivedDaysAgo: 22, verified: true },
      { filename: "courriels-rh.pdf", category: "hr_correspondence", mimeType: PDF, sizeBytes: 720_000, receivedDaysAgo: 20, verified: false },
    ],
    tasks: [
      { title: "Identifier et contacter la témoin", status: "open", priority: "high", dueInDays: 6 },
      { title: "Demander le règlement intérieur", status: "open", priority: "medium", dueInDays: 12 },
      { title: "Faire apprécier par l’avocat le calendrier de saisine", description: "Orchelio ne calcule jamais un délai.", status: "open", priority: "high", dueInDays: 8 },
    ],
    intake: {
      contenu_du_signalement: "A signalé aux ressources humaines des propos sur son origine, en avril 2026.",
      reponse_de_l_employeur: "La cliente déclare n’avoir reçu aucune réponse écrite.",
      evaluations_avant_le_signalement: "Deux entretiens annuels positifs.",
    },
  },
  {
    firmSlug: "carter-employment-labor-law",
    reference: "EMP-2026-003",
    title: "Relecture d’une rupture conventionnelle — Bennett",
    clientName: "Thomas Bennett",
    matterTypeKey: "severance_review",
    practiceAreaKey: "employment_law",
    status: "attorney_review",
    representationSide: "employee",
    attorneyEmail: "employment.attorney@demo.local",
    openedDaysAgo: 9,
    nextDeadlineInDays: 5,
    demonstrates:
      "Un document à lire de près : une clause de renonciation, une clause de non-concurrence, un délai de rétractation, et une information incomplète sur la prime. Le délai doit être confirmé par une personne, jamais par Orchelio.",
    fields: {
      employer_name: "Calder & Finch Conseil",
      employee_name: "Thomas Bennett",
      position: "Consultant senior",
      employment_start_date: "2019-01-14",
      employment_end_date: "2026-07-15",
      current_employment_status: "terminated",
      salary_or_rate: "68 000 € bruts par an",
      exempt_status: "unknown",
      termination_date: "2026-07-15",
      termination_reason_stated: "L’employeur a invoqué « une réorganisation ».",
      employment_agreement_available: true,
      severance_agreement_available: true,
      handbook_available: false,
      damages_alleged: "Aucun allégué ; le client décide s’il signe.",
      agency_charge_filed: false,
    },
    documents: [
      { filename: "rupture-conventionnelle-projet.docx", category: "severance_agreement", mimeType: DOCX, sizeBytes: 96_000, receivedDaysAgo: 8, verified: true },
      { filename: "contrat-travail-2019.pdf", category: "employment_agreement", mimeType: PDF, sizeBytes: 580_000, receivedDaysAgo: 8, verified: true },
      { filename: "lettre-embauche-2019.pdf", category: "offer_letter", mimeType: PDF, sizeBytes: 210_000, receivedDaysAgo: 7, verified: false },
    ],
    tasks: [
      { title: "Faire confirmer le délai de rétractation par l’avocat", description: "Lu dans la convention, confirmé par une personne. Orchelio ne fixe jamais un délai.", status: "open", priority: "high", dueInDays: 2 },
      { title: "Demander la documentation du plan de primes", description: "La convention évoque une prime qui n’est documentée nulle part au dossier.", status: "open", priority: "high", dueInDays: 3 },
    ],
    intake: {
      delai_annonce: "Il lui a été dit qu’il disposait de quinze jours à compter du 15 juillet 2026.",
      question_de_la_prime: "Pense qu’une prime reste due ; n’a aucun document du plan.",
      autres_propositions: "Aucune.",
    },
  },
] as const;
