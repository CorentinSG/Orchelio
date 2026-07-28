import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_ACCOUNTS } from "../src/lib/demo-accounts";
import { hashPassword } from "../src/lib/auth/password";
import { DEMO_MATTERS } from "./demo-matters";

/**
 * Orchelio — demonstration seed data.
 *
 * Everything created here is fictional. Nothing in this file describes a real
 * firm, a real person or a real legal matter. Email addresses use the reserved
 * `.local` domain, which cannot exist on the real internet.
 *
 * Contents: the practice-area and matter-type catalogues, the workflow
 * templates, the two firm tenants and their configurations, the six
 * demonstration users and their memberships, and the six fictional matters with
 * their clients, documents, intake answers and tasks. The simulated analyses
 * arrive in Phase 6.
 *
 * Every write is an upsert, so `npm run seed` is safe to run repeatedly and
 * never destroys anything.
 */

// --- Catalogues -----------------------------------------------------------

const PRACTICE_AREAS = [
  { key: "immigration", label: "Immigration Law", status: "available", sortOrder: 1 },
  { key: "employment_law", label: "Employment & Labor Law", status: "available", sortOrder: 2 },
  { key: "family_law", label: "Family Law", status: "planned", sortOrder: 3 },
  { key: "personal_injury", label: "Personal Injury", status: "planned", sortOrder: 4 },
  { key: "criminal_defence", label: "Criminal Defence", status: "planned", sortOrder: 5 },
  { key: "business_law", label: "Business Law", status: "planned", sortOrder: 6 },
  { key: "landlord_tenant", label: "Landlord–Tenant Law", status: "planned", sortOrder: 7 },
  { key: "other", label: "Other", status: "planned", sortOrder: 8 },
] as const;

const MATTER_TYPES = [
  // Immigration Law
  { key: "family_based", label: "Family-based immigration", practiceAreaKey: "immigration" },
  { key: "employment_based", label: "Employment-based immigration", practiceAreaKey: "immigration" },
  { key: "naturalisation", label: "Naturalisation", practiceAreaKey: "immigration" },
  { key: "asylum", label: "Asylum", practiceAreaKey: "immigration" },
  { key: "removal_defence", label: "Removal defence", practiceAreaKey: "immigration" },
  { key: "consular_processing", label: "Consular processing", practiceAreaKey: "immigration" },
  { key: "non_immigrant_visas", label: "Non-immigrant visas", practiceAreaKey: "immigration" },
  { key: "humanitarian", label: "Humanitarian applications", practiceAreaKey: "immigration" },

  // Employment & Labor Law
  { key: "wage_and_hour", label: "Wage and hour", practiceAreaKey: "employment_law" },
  { key: "unpaid_wages", label: "Unpaid wages", practiceAreaKey: "employment_law" },
  { key: "workplace_discrimination", label: "Workplace discrimination", practiceAreaKey: "employment_law" },
  { key: "workplace_harassment", label: "Workplace harassment", practiceAreaKey: "employment_law" },
  { key: "retaliation", label: "Retaliation", practiceAreaKey: "employment_law" },
  { key: "wrongful_termination", label: "Wrongful termination", practiceAreaKey: "employment_law" },
  { key: "employment_agreement_review", label: "Employment agreement review", practiceAreaKey: "employment_law" },
  { key: "reasonable_accommodation", label: "Reasonable accommodation", practiceAreaKey: "employment_law" },
  { key: "family_medical_leave", label: "Family and medical leave", practiceAreaKey: "employment_law" },
  { key: "contractor_classification", label: "Independent contractor classification", practiceAreaKey: "employment_law" },
  { key: "union_collective", label: "Union and collective labour matters", practiceAreaKey: "employment_law" },
  { key: "severance_review", label: "Severance agreement review", practiceAreaKey: "employment_law" },
] as const;

type Step = { key: string; label: string; requiresApproval: boolean };

const WORKFLOW_TEMPLATES: ReadonlyArray<{
  key: string;
  name: string;
  practiceAreaKey: string | null;
  description: string;
  steps: Step[];
  requiredApprovals: string[];
  aiFeatures: string[];
  allowedRoles: string[];
}> = [
  {
    key: "generic_matter_lifecycle",
    name: "Generic matter lifecycle",
    practiceAreaKey: null,
    description: "The default path a matter follows, from lead to closing.",
    steps: [
      { key: "lead_intake", label: "Lead intake", requiresApproval: false },
      { key: "conflict_review", label: "Conflict review", requiresApproval: true },
      { key: "consultation_preparation", label: "Consultation preparation", requiresApproval: false },
      { key: "consultation", label: "Consultation", requiresApproval: false },
      { key: "retainer", label: "Retainer", requiresApproval: true },
      { key: "document_collection", label: "Document collection", requiresApproval: false },
      { key: "attorney_review", label: "Attorney review", requiresApproval: true },
      { key: "active_representation", label: "Active representation", requiresApproval: false },
      { key: "matter_closing", label: "Matter closing", requiresApproval: true },
    ],
    requiredApprovals: ["conflictClearance", "closeMatter"],
    aiFeatures: [],
    allowedRoles: ["firm_admin", "attorney", "paralegal"],
  },
  {
    key: "immigration_consultation_preparation",
    name: "Immigration — consultation preparation",
    practiceAreaKey: "immigration",
    description: "Prepare an immigration consultation from an intake and its documents.",
    steps: [
      { key: "receive_intake", label: "Receive intake", requiresApproval: false },
      { key: "verify_required_fields", label: "Verify required fields", requiresApproval: false },
      { key: "review_identity_documents", label: "Review identity documents", requiresApproval: false },
      { key: "extract_status_information", label: "Extract status information", requiresApproval: false },
      { key: "create_immigration_timeline", label: "Create immigration timeline", requiresApproval: false },
      { key: "identify_inconsistencies", label: "Identify inconsistencies", requiresApproval: false },
      { key: "identify_missing_documents", label: "Identify missing documents", requiresApproval: false },
      { key: "independent_review", label: "Claude independent review", requiresApproval: false },
      { key: "attorney_approval", label: "Attorney approval", requiresApproval: true },
      { key: "prepare_consultation_brief", label: "Prepare consultation brief", requiresApproval: false },
    ],
    requiredApprovals: ["legalAnalysis"],
    aiFeatures: [
      "document_summary",
      "timeline",
      "missing_documents",
      "inconsistency_detection",
      "consultation_questions",
    ],
    allowedRoles: ["firm_admin", "attorney", "paralegal"],
  },
  {
    key: "employment_case_assessment",
    name: "Employment — employee-side case assessment",
    practiceAreaKey: "employment_law",
    description: "Assess an employee-side matter from intake, pay records and correspondence.",
    steps: [
      { key: "receive_intake", label: "Receive intake", requiresApproval: false },
      { key: "verify_employment_information", label: "Verify employment information", requiresApproval: false },
      { key: "review_employment_documents", label: "Review employment documents", requiresApproval: false },
      { key: "review_pay_and_time_records", label: "Review pay and time records", requiresApproval: false },
      { key: "create_employment_timeline", label: "Create employment timeline", requiresApproval: false },
      { key: "identify_adverse_actions", label: "Identify alleged adverse actions", requiresApproval: false },
      { key: "identify_missing_evidence", label: "Identify missing evidence", requiresApproval: false },
      { key: "identify_inconsistencies", label: "Identify inconsistencies", requiresApproval: false },
      { key: "independent_review", label: "Claude independent review", requiresApproval: false },
      { key: "attorney_approval", label: "Attorney approval", requiresApproval: true },
      { key: "prepare_consultation_brief", label: "Prepare consultation brief", requiresApproval: false },
    ],
    requiredApprovals: ["legalAnalysis"],
    aiFeatures: [
      "document_summary",
      "employment_timeline",
      "missing_documents",
      "inconsistency_detection",
      "interview_questions",
    ],
    allowedRoles: ["firm_admin", "attorney", "paralegal"],
  },
  {
    key: "employment_severance_review",
    name: "Employment — severance review",
    practiceAreaKey: "employment_law",
    description: "Extract the terms of a severance agreement for attorney review.",
    steps: [
      { key: "receive_agreement", label: "Receive agreement", requiresApproval: false },
      { key: "extract_parties_and_dates", label: "Extract parties and dates", requiresApproval: false },
      { key: "identify_compensation_terms", label: "Identify compensation terms", requiresApproval: false },
      { key: "identify_release_provisions", label: "Identify release provisions", requiresApproval: false },
      { key: "identify_restrictive_covenants", label: "Identify restrictive covenants", requiresApproval: false },
      { key: "identify_acceptance_deadline", label: "Identify acceptance deadline", requiresApproval: true },
      { key: "identify_missing_information", label: "Identify missing employment information", requiresApproval: false },
      { key: "independent_review", label: "Claude independent review", requiresApproval: false },
      { key: "attorney_approval", label: "Attorney approval", requiresApproval: true },
      { key: "prepare_client_meeting_brief", label: "Prepare client meeting brief", requiresApproval: false },
    ],
    requiredApprovals: ["legalAnalysis", "deadlineConfirmation"],
    aiFeatures: ["document_summary", "missing_documents", "inconsistency_detection"],
    allowedRoles: ["firm_admin", "attorney"],
  },
];

// --- Firms ----------------------------------------------------------------

const DEMO_FIRMS = [
  {
    slug: "dupont-immigration-law",
    name: "Dupont Immigration Law",
    primaryPracticeArea: "immigration",
    status: "active",
    configuration: {
      contactName: "Claire Dupont",
      contactEmail: "immigration.attorney@demo.local",
      userCount: 6,
      jurisdiction: "NY",
      practiceAreas: ["immigration"],
      matterTypes: ["family_based", "employment_based", "naturalisation"],
      enabledWorkflows: [
        "generic_matter_lifecycle",
        "immigration_consultation_preparation",
      ],
      aiFeatures: [
        "document_summary",
        "timeline",
        "missing_documents",
        "inconsistency_detection",
        "consultation_questions",
      ],
      approvals: {
        sendEmail: true,
        createDeadline: true,
        modifyDeadline: true,
        legalAnalysis: true,
        fileSubmission: true,
      },
    },
  },
  {
    slug: "carter-employment-labor-law",
    name: "Carter Employment & Labor Law",
    primaryPracticeArea: "employment_law",
    status: "active",
    configuration: {
      contactName: "Alex Carter",
      contactEmail: "employment.attorney@demo.local",
      userCount: 9,
      jurisdiction: "CA",
      practiceAreas: ["employment_law"],
      matterTypes: [
        "unpaid_wages",
        "workplace_discrimination",
        "retaliation",
        "wrongful_termination",
      ],
      enabledWorkflows: [
        "generic_matter_lifecycle",
        "employment_case_assessment",
        "employment_severance_review",
      ],
      aiFeatures: [
        "document_summary",
        "employment_timeline",
        "missing_documents",
        "inconsistency_detection",
        "interview_questions",
      ],
      approvals: {
        sendEmail: true,
        createDeadline: true,
        legalAnalysis: true,
        settlementCommunication: true,
        opposingCounselCommunication: true,
      },
    },
  },
] as const;

/**
 * Which firms each demonstration account belongs to, and with which role.
 * An empty list means a platform administrator: no firm membership at all.
 */
const MEMBERSHIPS: Record<string, ReadonlyArray<{ firmSlug: string; role: string }>> = {
  "platform.admin@demo.local": [],
  "immigration.attorney@demo.local": [
    { firmSlug: "dupont-immigration-law", role: "firm_admin" },
  ],
  "immigration.paralegal@demo.local": [
    { firmSlug: "dupont-immigration-law", role: "paralegal" },
  ],
  "employment.attorney@demo.local": [
    { firmSlug: "carter-employment-labor-law", role: "firm_admin" },
  ],
  "employment.paralegal@demo.local": [
    { firmSlug: "carter-employment-labor-law", role: "paralegal" },
  ],
  // Belongs to both firms — the account that demonstrates the firm switcher.
  "reviewer@demo.local": [
    { firmSlug: "dupont-immigration-law", role: "read_only" },
    { firmSlug: "carter-employment-labor-law", role: "read_only" },
  ],
};

async function main() {
  const url = process.env["DATABASE_URL"] ?? "file:./prisma/orchelio-demo.db";
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  try {
    console.log("Practice areas and matter types");
    for (const area of PRACTICE_AREAS) {
      await prisma.practiceArea.upsert({
        where: { key: area.key },
        update: { label: area.label, status: area.status, sortOrder: area.sortOrder },
        create: { ...area },
      });
    }
    for (const [index, type] of MATTER_TYPES.entries()) {
      await prisma.matterType.upsert({
        where: { key: type.key },
        update: { label: type.label, practiceAreaKey: type.practiceAreaKey, sortOrder: index },
        create: { ...type, sortOrder: index },
      });
    }
    console.log(`  ✓ ${PRACTICE_AREAS.length} practice areas, ${MATTER_TYPES.length} matter types`);

    console.log("\nWorkflow templates");
    for (const [index, template] of WORKFLOW_TEMPLATES.entries()) {
      const data = {
        name: template.name,
        practiceAreaKey: template.practiceAreaKey,
        description: template.description,
        steps: JSON.stringify(template.steps),
        requiredApprovals: JSON.stringify(template.requiredApprovals),
        aiFeatures: JSON.stringify(template.aiFeatures),
        allowedRoles: JSON.stringify(template.allowedRoles),
        sortOrder: index,
      };
      await prisma.workflowTemplate.upsert({
        where: { key: template.key },
        update: data,
        create: { key: template.key, ...data },
      });
      console.log(`  ✓ ${template.name}`);
    }

    console.log("\nFirms");
    const firmIdBySlug = new Map<string, string>();
    for (const firm of DEMO_FIRMS) {
      const saved = await prisma.firm.upsert({
        where: { slug: firm.slug },
        update: {
          name: firm.name,
          primaryPracticeArea: firm.primaryPracticeArea,
          status: firm.status,
        },
        create: {
          slug: firm.slug,
          name: firm.name,
          primaryPracticeArea: firm.primaryPracticeArea,
          status: firm.status,
        },
      });
      firmIdBySlug.set(firm.slug, saved.id);

      const configuration = {
        primaryPracticeArea: firm.primaryPracticeArea,
        contactName: firm.configuration.contactName,
        contactEmail: firm.configuration.contactEmail,
        userCount: firm.configuration.userCount,
        jurisdiction: firm.configuration.jurisdiction,
        practiceAreas: JSON.stringify(firm.configuration.practiceAreas),
        matterTypes: JSON.stringify(firm.configuration.matterTypes),
        enabledWorkflows: JSON.stringify(firm.configuration.enabledWorkflows),
        aiFeatures: JSON.stringify(firm.configuration.aiFeatures),
        approvals: JSON.stringify(firm.configuration.approvals),
        language: "en",
        timezone: "America/New_York",
        currency: "USD",
        onboardingStatus: "complete",
        onboardingStep: 7,
      };
      await prisma.firmConfiguration.upsert({
        where: { firmId: saved.id },
        update: configuration,
        create: { firmId: saved.id, ...configuration },
      });

      for (const templateKey of firm.configuration.enabledWorkflows) {
        await prisma.firmWorkflow.upsert({
          where: { firmId_templateKey: { firmId: saved.id, templateKey } },
          update: { enabled: true },
          create: { firmId: saved.id, templateKey, enabled: true },
        });
      }

      console.log(`  ✓ ${saved.name} (${saved.primaryPracticeArea})`);
    }

    console.log("\nDemonstration users");
    // Hashing is deliberately slow, so the identical demo password is hashed
    // once and reused across accounts rather than five separate times.
    const passwordHash = await hashPassword(DEMO_ACCOUNTS[0]!.password);

    for (const account of DEMO_ACCOUNTS) {
      const memberships = MEMBERSHIPS[account.email];
      if (!memberships) {
        throw new Error(`No membership entry for demonstration account: ${account.email}`);
      }
      const isPlatformAdmin = memberships.length === 0;

      const user = await prisma.user.upsert({
        where: { email: account.email },
        update: { name: account.name, passwordHash, isPlatformAdmin, status: "active" },
        create: {
          email: account.email,
          name: account.name,
          passwordHash,
          isPlatformAdmin,
          status: "active",
        },
      });

      for (const membership of memberships) {
        const firmId = firmIdBySlug.get(membership.firmSlug);
        if (!firmId) {
          throw new Error(`Unknown firm slug in seed data: ${membership.firmSlug}`);
        }
        await prisma.firmMembership.upsert({
          where: { userId_firmId: { userId: user.id, firmId } },
          update: { role: membership.role, status: "active" },
          create: { userId: user.id, firmId, role: membership.role, status: "active" },
        });
      }

      console.log(`  ✓ ${account.name} — ${account.roleLabel}`);
    }

    console.log("\nFictional matters");
    const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
    const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);

    for (const matter of DEMO_MATTERS) {
      const firmId = firmIdBySlug.get(matter.firmSlug);
      if (!firmId) throw new Error(`Unknown firm slug in demo matters: ${matter.firmSlug}`);

      const attorney = await prisma.user.findUnique({ where: { email: matter.attorneyEmail } });
      if (!attorney) throw new Error(`Unknown attorney in demo matters: ${matter.attorneyEmail}`);

      // The client profile is keyed by firm and display name, so re-running the
      // seed updates the same fictional person rather than creating another.
      const existingClient = await prisma.clientProfile.findFirst({
        where: { firmId, displayName: matter.clientName },
      });
      const client =
        existingClient ??
        (await prisma.clientProfile.create({
          data: { firmId, displayName: matter.clientName, isFictional: true },
        }));

      const saved = await prisma.matter.upsert({
        where: { firmId_reference: { firmId, reference: matter.reference } },
        update: {
          title: matter.title,
          status: matter.status,
          matterTypeKey: matter.matterTypeKey,
          practiceAreaKey: matter.practiceAreaKey,
          representationSide: matter.representationSide ?? null,
          responsibleAttorneyId: attorney.id,
          clientProfileId: client.id,
          fields: JSON.stringify(matter.fields),
          nextDeadlineAt: matter.nextDeadlineInDays ? inDays(matter.nextDeadlineInDays) : null,
          lastActivityAt: daysAgo(Math.min(...matter.documents.map((d) => d.receivedDaysAgo), 1)),
        },
        create: {
          firmId,
          reference: matter.reference,
          title: matter.title,
          status: matter.status,
          matterTypeKey: matter.matterTypeKey,
          practiceAreaKey: matter.practiceAreaKey,
          representationSide: matter.representationSide ?? null,
          responsibleAttorneyId: attorney.id,
          createdById: attorney.id,
          clientProfileId: client.id,
          fields: JSON.stringify(matter.fields),
          openedAt: daysAgo(matter.openedDaysAgo),
          nextDeadlineAt: matter.nextDeadlineInDays ? inDays(matter.nextDeadlineInDays) : null,
          lastActivityAt: daysAgo(Math.min(...matter.documents.map((d) => d.receivedDaysAgo), 1)),
        },
      });

      // Documents, tasks and the intake are replaced wholesale rather than
      // merged: they are fixtures, and a half-updated fixture is worse than a
      // rebuilt one. Nothing a user created lives under these references.
      await prisma.document.deleteMany({ where: { firmId, matterId: saved.id } });
      for (const document of matter.documents) {
        await prisma.document.create({
          data: {
            firmId,
            matterId: saved.id,
            filename: document.filename,
            category: document.category,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            storageKey: `${matter.firmSlug}/${matter.reference}/${document.filename}`,
            verified: document.verified,
            analysisStatus: document.verified ? "classified" : "pending",
            receivedAt: daysAgo(document.receivedDaysAgo),
            uploadedById: attorney.id,
          },
        });
      }

      await prisma.task.deleteMany({ where: { firmId, matterId: saved.id } });
      for (const task of matter.tasks) {
        await prisma.task.create({
          data: {
            firmId,
            matterId: saved.id,
            title: task.title,
            description: task.description ?? null,
            status: task.status,
            priority: task.priority,
            dueAt: task.dueInDays ? inDays(task.dueInDays) : null,
            createdById: attorney.id,
          },
        });
      }

      await prisma.intakeResponse.deleteMany({ where: { firmId, matterId: saved.id } });
      await prisma.intakeResponse.create({
        data: {
          firmId,
          matterId: saved.id,
          payload: JSON.stringify(matter.intake),
          status: "submitted",
          submittedById: attorney.id,
          submittedAt: daysAgo(matter.openedDaysAgo),
        },
      });

      console.log(
        `  ✓ ${matter.reference} — ${matter.clientName} (${matter.documents.length} documents, ${matter.tasks.length} tasks)`,
      );
    }

    await prisma.auditEvent.create({
      data: {
        action: "demo.seeded",
        status: "success",
        resourceType: "instance",
        newValue: JSON.stringify({
          firms: DEMO_FIRMS.length,
          users: DEMO_ACCOUNTS.length,
          workflowTemplates: WORKFLOW_TEMPLATES.length,
        }),
      },
    });

    const [firms, users, memberships, matters, documents] = await Promise.all([
      prisma.firm.count(),
      prisma.user.count(),
      prisma.firmMembership.count(),
      prisma.matter.count(),
      prisma.document.count(),
    ]);

    console.log(
      `\nSeed complete — ${firms} firm(s), ${users} user(s), ${memberships} membership(s), ` +
        `${matters} matter(s), ${documents} document(s) in orchelio-demo.db.`,
    );
    console.log(`Sign in at /login with any account above. Password: ${DEMO_ACCOUNTS[0]!.password}`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log("Seeding Orchelio demonstration data (fictional only)…\n");

main().catch((error: unknown) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
