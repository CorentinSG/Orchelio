/**
 * Orchelio — build roadmap.
 *
 * The demonstration was built in nine phases, all delivered. Version 1 — the
 * connected cockpit — adds eight further phases (docs/PLAN-V1.md). The home
 * page reads this list so that anyone opening the application sees exactly
 * what is implemented and what is not — no screen ever pretends to do more
 * than it does.
 *
 * Titles and summaries are displayed to users, so they are in the product's
 * language — French. docs/ROADMAP.md keeps the English record for
 * maintainers; the statuses must agree between the two.
 *
 * Update the `status` field as each phase lands. See docs/ROADMAP.md.
 */

export type PhaseStatus = "done" | "in_progress" | "planned";

export type Phase = {
  number: number;
  title: string;
  summary: string;
  status: PhaseStatus;
};

export const PHASES: readonly Phase[] = [
  {
    number: 1,
    title: "Initialisation",
    summary: "Next.js, TypeScript, Tailwind, Prisma, SQLite, tests, documentation.",
    status: "done",
  },
  {
    number: 2,
    title: "Données et authentification",
    summary: "Modèle de données complet, migrations, données de démonstration, connexion locale, rôles.",
    status: "done",
  },
  {
    number: 3,
    title: "Multi-cabinets",
    summary: "Appartenances, périmètre firmId sur chaque requête, tests d’isolation.",
    status: "done",
  },
  {
    number: 4,
    title: "Questionnaire d’installation",
    summary: "Sept étapes qui produisent la configuration du cabinet.",
    status: "done",
  },
  {
    number: 5,
    title: "Dossiers et documents",
    summary: "Liste et fiche de dossier, champs par domaine de droit, dépôt simulé de documents.",
    status: "done",
  },
  {
    number: 6,
    title: "IA simulée",
    summary: "Interface AIProvider, simulation déterministe, Claude Analyst et Claude Reviewer.",
    status: "done",
  },
  {
    number: 7,
    title: "Validations et journal",
    summary: "Centre de validation humaine, décisions, journal d’activité inaltérable.",
    status: "done",
  },
  {
    number: 8,
    title: "Consommation et administration",
    summary: "Coûts d’IA simulés, création de cabinets, réglages, démonstration guidée.",
    status: "done",
  },
  {
    number: 9,
    title: "Tests et documentation",
    summary: "Tests unitaires, d’intégration et navigateur, accessibilité, documentation finale.",
    status: "done",
  },
  {
    number: 10,
    title: "V1 — Fondations",
    summary: "Décisions écrites, interface en français, nouveau design, passerelle d’IA routée et comptée.",
    status: "in_progress",
  },
  {
    number: 11,
    title: "V1 — Les documents, enfin lus",
    summary: "Extraction du texte, OCR local, classification, dédoublonnage, index par cabinet.",
    status: "planned",
  },
  {
    number: 12,
    title: "V1 — Le dossier compris",
    summary: "Assertions typées, résumé et chronologie sourcés, incohérences de contenu.",
    status: "planned",
  },
  {
    number: 13,
    title: "V1 — Les courriels",
    summary: "Rattachement scoré, boîte de tri, corrections apprises par cabinet.",
    status: "planned",
  },
  {
    number: 14,
    title: "V1 — Les actions guidées",
    summary: "Cinq boutons métier, brouillons sous validation humaine, modèles adaptables.",
    status: "planned",
  },
  {
    number: 15,
    title: "V1 — L’installation en cliquant",
    summary: "Questionnaire adaptatif, précision libre, aperçu, premier résultat avant la fin.",
    status: "planned",
  },
  {
    number: 16,
    title: "V1 — Les coûts sous contrôle",
    summary: "Centimes réels par cabinet, dossier et action ; plafonds ; comparaison des modèles.",
    status: "planned",
  },
  {
    number: 17,
    title: "V1 — La V1 assemblée",
    summary: "Scénario de démonstration complet, données fictives riches, guide réécrit.",
    status: "planned",
  },
] as const;

export function currentPhase(): Phase {
  return (
    PHASES.find((phase) => phase.status === "in_progress") ??
    [...PHASES].reverse().find((phase) => phase.status === "done") ??
    PHASES[0]!
  );
}
