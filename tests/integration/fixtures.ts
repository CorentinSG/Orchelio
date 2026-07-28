import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../../src/generated/prisma/client";
import { withFirmScopeGuard } from "../../src/lib/data/firm-scope";

/**
 * Orchelio — integration test fixtures.
 *
 * Isolation cannot be proved against the demonstration seed: it has no matters,
 * and a test that passes because there is nothing to leak proves nothing. So
 * each run builds a throwaway database with two firms that both contain
 * plausible, deliberately similar records — same client name, same document
 * filename, same matter title — and then asks whether one firm can reach the
 * other's copy.
 *
 * Similar-looking data matters: it is how a test catches a query that matches
 * on title or filename and forgets the firm.
 */

export type TwoFirmFixture = {
  prisma: ReturnType<typeof withFirmScopeGuard>;
  dispose: () => Promise<void>;
  immigration: FirmFixture;
  employment: FirmFixture;
};

export type FirmFixture = {
  firmId: string;
  attorneyId: string;
  clientId: string;
  matterId: string;
  matterReference: string;
  documentId: string;
  analysisId: string;
  reviewId: string;
  approvalId: string;
  taskId: string;
  draftId: string;
  intakeId: string;
};

/** Text that appears in BOTH firms, so a leaking query cannot hide behind it. */
export const SHARED_CLIENT_NAME = "Alex Rivera";
export const SHARED_DOCUMENT_NAME = "identity-document.pdf";
export const SHARED_MATTER_TITLE = "Initial consultation";

export async function createTwoFirmFixture(): Promise<TwoFirmFixture> {
  const directory = mkdtempSync(join(tmpdir(), "orchelio-test-"));
  const databaseFile = join(directory, "test.db");
  const url = `file:${databaseFile}`;

  // A real migrated schema, not a hand-built one: the tests must exercise the
  // same tables, indexes and constraints the application runs against.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  // Point the application's own client at this throwaway database, so a test
  // may dynamically import the real repositories after calling this helper and
  // exercise the code the pages actually run. Never touches the demo database.
  process.env["DATABASE_URL"] = url;

  const client = withFirmScopeGuard(
    new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }), log: ["error"] }),
  );

  await client.practiceArea.upsert({
    where: { key: "immigration" },
    update: {},
    create: { key: "immigration", label: "Immigration Law", status: "available" },
  });
  await client.practiceArea.upsert({
    where: { key: "employment_law" },
    update: {},
    create: { key: "employment_law", label: "Employment & Labor Law", status: "available" },
  });
  await client.matterType.upsert({
    where: { key: "family_based" },
    update: {},
    create: { key: "family_based", label: "Family-based immigration", practiceAreaKey: "immigration" },
  });
  await client.matterType.upsert({
    where: { key: "unpaid_wages" },
    update: {},
    create: { key: "unpaid_wages", label: "Unpaid wages", practiceAreaKey: "employment_law" },
  });

  const immigration = await seedFirm(client, {
    slug: "test-immigration",
    name: "Test Immigration Law",
    practiceArea: "immigration",
    matterTypeKey: "family_based",
    reference: "IMM-2026-001",
    attorneyEmail: "imm.attorney@test.local",
  });

  const employment = await seedFirm(client, {
    slug: "test-employment",
    name: "Test Employment Law",
    practiceArea: "employment_law",
    matterTypeKey: "unpaid_wages",
    reference: "EMP-2026-001",
    attorneyEmail: "emp.attorney@test.local",
  });

  return {
    prisma: client,
    immigration,
    employment,
    dispose: async () => {
      await client.$disconnect();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

async function seedFirm(
  client: ReturnType<typeof withFirmScopeGuard>,
  options: {
    slug: string;
    name: string;
    practiceArea: string;
    matterTypeKey: string;
    reference: string;
    attorneyEmail: string;
  },
): Promise<FirmFixture> {
  const firm = await client.firm.create({
    data: {
      slug: options.slug,
      name: options.name,
      primaryPracticeArea: options.practiceArea,
      status: "active",
    },
  });

  const attorney = await client.user.create({
    data: {
      email: options.attorneyEmail,
      name: `Attorney at ${options.name}`,
      passwordHash: "scrypt$16384$8$1$AAAA$AAAA",
    },
  });

  await client.firmMembership.create({
    data: { userId: attorney.id, firmId: firm.id, role: "attorney" },
  });

  await client.firmConfiguration.create({
    data: {
      firmId: firm.id,
      primaryPracticeArea: options.practiceArea,
      matterTypes: JSON.stringify([options.matterTypeKey]),
      onboardingStatus: "complete",
    },
  });

  const clientProfile = await client.clientProfile.create({
    data: { firmId: firm.id, displayName: SHARED_CLIENT_NAME },
  });

  const matter = await client.matter.create({
    data: {
      firmId: firm.id,
      reference: options.reference,
      title: SHARED_MATTER_TITLE,
      clientProfileId: clientProfile.id,
      practiceAreaKey: options.practiceArea,
      matterTypeKey: options.matterTypeKey,
      status: "active",
      responsibleAttorneyId: attorney.id,
    },
  });

  const document = await client.document.create({
    data: {
      firmId: firm.id,
      matterId: matter.id,
      filename: SHARED_DOCUMENT_NAME,
      category: "passport",
      mimeType: "application/pdf",
      sizeBytes: 1024,
      storageKey: `${options.slug}/identity-document.pdf`,
    },
  });

  const analysis = await client.aIAnalysis.create({
    data: {
      firmId: firm.id,
      matterId: matter.id,
      status: "completed",
      result: JSON.stringify({ summary: `Facts for ${options.name}` }),
    },
  });

  const review = await client.aIReview.create({
    data: { firmId: firm.id, analysisId: analysis.id, status: "approved_for_human_review" },
  });

  const approval = await client.approvalRequest.create({
    data: {
      firmId: firm.id,
      matterId: matter.id,
      resourceType: "ai_analysis",
      resourceId: analysis.id,
      action: "legal_analysis",
      summary: `Approve the analysis for ${options.reference}`,
    },
  });

  const task = await client.task.create({
    data: { firmId: firm.id, matterId: matter.id, title: "Request missing documents" },
  });

  const intake = await client.intakeResponse.create({
    data: {
      firmId: firm.id,
      matterId: matter.id,
      payload: JSON.stringify({ note: `Intake for ${options.name}` }),
      status: "submitted",
      submittedAt: new Date("2026-01-15T09:00:00Z"),
    },
  });

  const draft = await client.draftCommunication.create({
    data: {
      firmId: firm.id,
      matterId: matter.id,
      subject: "Consultation confirmation",
      body: "Draft only. Nothing is ever sent by Orchelio.",
    },
  });

  // Two usage records, so a leaking cost query would double the total and be
  // obvious rather than plausible.
  await client.usageRecord.createMany({
    data: [
      {
        firmId: firm.id,
        matterId: matter.id,
        operation: "claude_analyst",
        inputTokens: 42_500,
        outputTokens: 3_250,
        costCents: 14,
      },
      {
        firmId: firm.id,
        matterId: matter.id,
        operation: "claude_reviewer",
        inputTokens: 12_000,
        outputTokens: 900,
        costCents: 5,
      },
    ],
  });

  await client.auditEvent.create({
    data: {
      firmId: firm.id,
      userId: attorney.id,
      action: "matter.viewed",
      resourceType: "matter",
      resourceId: matter.id,
    },
  });

  return {
    firmId: firm.id,
    attorneyId: attorney.id,
    clientId: clientProfile.id,
    matterId: matter.id,
    matterReference: options.reference,
    documentId: document.id,
    analysisId: analysis.id,
    reviewId: review.id,
    approvalId: approval.id,
    taskId: task.id,
    draftId: draft.id,
    intakeId: intake.id,
  };
}
