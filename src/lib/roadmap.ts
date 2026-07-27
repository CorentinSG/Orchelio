/**
 * Orchelio — build roadmap.
 *
 * The demonstration is built in nine phases. The home page reads this list so
 * that anyone opening the application sees exactly what is implemented and
 * what is not — no screen ever pretends to do more than it does.
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
    status: "planned",
  },
  {
    number: 6,
    title: "Simulated AI",
    summary: "AIProvider interface, MockAIProvider, Claude Analyst and Claude Reviewer.",
    status: "planned",
  },
  {
    number: 7,
    title: "Approvals & audit",
    summary: "Human approval centre, decisions, append-only activity log.",
    status: "planned",
  },
  {
    number: 8,
    title: "Usage & administration",
    summary: "Simulated AI costs, firm creation, settings, guided demo.",
    status: "planned",
  },
  {
    number: 9,
    title: "Tests & documentation",
    summary: "Unit, integration and end-to-end tests, accessibility, final documentation.",
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
