/**
 * Orchelio — build roadmap.
 *
 * The demonstration was built in nine phases, all delivered. Version 1 — the
 * connected cockpit — adds eight further phases (docs/PLAN-V1.md). The home
 * page reads this list so that anyone opening the application sees exactly
 * what is implemented and what is not — no screen ever pretends to do more
 * than it does.
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
    title: "Data & authentication",
    summary: "Full data model, migrations, seed data, local demo sign-in, roles.",
    status: "done",
  },
  {
    number: 3,
    title: "Multi-firm",
    summary: "Firm memberships, firmId scoping on every query, isolation tests.",
    status: "done",
  },
  {
    number: 4,
    title: "Onboarding",
    summary: "Seven-step questionnaire that generates the firm configuration.",
    status: "done",
  },
  {
    number: 5,
    title: "Matters & documents",
    summary: "Matter list and record, practice-area fields, simulated document upload.",
    status: "done",
  },
  {
    number: 6,
    title: "Simulated AI",
    summary: "AIProvider interface, MockAIProvider, Claude Analyst and Claude Reviewer.",
    status: "done",
  },
  {
    number: 7,
    title: "Approvals & audit",
    summary: "Human approval centre, decisions, append-only activity log.",
    status: "done",
  },
  {
    number: 8,
    title: "Usage & administration",
    summary: "Simulated AI costs, firm creation, settings, guided demo.",
    status: "done",
  },
  {
    number: 9,
    title: "Tests & documentation",
    summary: "Unit, integration and end-to-end tests, accessibility, final documentation.",
    status: "done",
  },
  {
    number: 10,
    title: "V1 — Foundations",
    summary: "Written decisions, French interface, new design, routed AI gateway with cost counting.",
    status: "in_progress",
  },
  {
    number: 11,
    title: "V1 — Documents, finally read",
    summary: "Text extraction, local OCR, classification, deduplication, per-firm index.",
    status: "planned",
  },
  {
    number: 12,
    title: "V1 — The matter understood",
    summary: "Typed assertions, sourced summary and timeline, content-level inconsistencies.",
    status: "planned",
  },
  {
    number: 13,
    title: "V1 — Emails",
    summary: "Confidence-scored filing, triage inbox, corrections learned per firm.",
    status: "planned",
  },
  {
    number: 14,
    title: "V1 — Guided actions",
    summary: "Five business buttons, drafts under human approval, adaptable templates.",
    status: "planned",
  },
  {
    number: 15,
    title: "V1 — Onboarding by clicking",
    summary: "Adaptive questionnaire, free-text refinement, preview, first result before the end.",
    status: "planned",
  },
  {
    number: 16,
    title: "V1 — Costs under control",
    summary: "Real centimes per firm, matter and action; caps; model comparison.",
    status: "planned",
  },
  {
    number: 17,
    title: "V1 — The V1 assembled",
    summary: "Full demonstration scenario, rich fictional data, rewritten guide.",
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
