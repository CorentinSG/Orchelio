import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";
import { DEMO_MATTERS, type DemoMatter } from "@/lib/demo/matters";
import { parseStringArray } from "@/lib/json-field";

/**
 * Orchelio — demonstration data, added from inside the product.
 *
 * A firm created through the interface starts empty, and an empty workspace
 * demonstrates nothing: every screen is an empty state. This adds the same
 * fictional matters the seed writes, to whichever firm asks for them.
 *
 * ## Additive, always
 *
 * The seed replaces its fixtures wholesale — it owns them, and a half-updated
 * fixture is worse than a rebuilt one. This function may not: by the time it
 * runs, somebody has been using the firm. So it **skips** a matter whose
 * reference already exists and never deletes a row. Running it twice adds
 * nothing the second time and destroys nothing either.
 *
 * Erasing demonstration data is deliberately not offered here. See ADR-0016.
 */

export type SampleDataResult = {
  /** References actually created by this call. */
  created: string[];
  /** References already present, left untouched. */
  skipped: string[];
  /**
   * Matters not offered: either the firm does not handle that type of matter,
   * or the platform catalogue no longer lists it. Reported rather than silently
   * dropped — a count that does not add up is a question, and the answer should
   * be on the screen rather than in the code.
   */
  notOffered: string[];
};

const EMPTY_RESULT: SampleDataResult = { created: [], skipped: [], notOffered: [] };

/**
 * The sample matters on offer for a firm.
 *
 * A matter is offered when the firm handles its type *and* the platform still
 * lists that type. The second half is not hypothetical politeness: a matter row
 * has a foreign key to the catalogue, so a configuration naming a type that has
 * since been removed would fail the insert rather than skip it, and a firm would
 * meet a 500 instead of a sentence.
 *
 * `knownMatterTypes` is passed in rather than read here so the function stays
 * pure and the rule can be tested without a database.
 */
export function sampleMattersFor(
  primaryPracticeArea: string,
  configuredMatterTypes: readonly string[],
  knownMatterTypes?: readonly string[],
): { available: DemoMatter[]; notOffered: DemoMatter[] } {
  const configured = new Set(configuredMatterTypes);
  const known = knownMatterTypes ? new Set(knownMatterTypes) : null;
  const forArea = DEMO_MATTERS.filter((matter) => matter.practiceAreaKey === primaryPracticeArea);

  const offered = (matter: DemoMatter) =>
    configured.has(matter.matterTypeKey) && (known === null || known.has(matter.matterTypeKey));

  return {
    available: forArea.filter(offered),
    notOffered: forArea.filter((matter) => !offered(matter)),
  };
}

/**
 * Adds the sample matters for this firm's practice area.
 *
 * `responsibleUserId` must already be a member of the firm — the caller has a
 * session and knows that; this function does not re-derive it.
 */
export async function addSampleMatters(
  scope: FirmScope,
  responsibleUserId: string,
): Promise<SampleDataResult> {
  const [firm, configuration, catalogue] = await Promise.all([
    prisma.firm.findUnique({ where: { id: scope.firmId } }),
    prisma.firmConfiguration.findFirst({ where: { firmId: scope.firmId } }),
    prisma.matterType.findMany({ select: { key: true } }),
  ]);

  if (!firm) return EMPTY_RESULT;

  const { available, notOffered } = sampleMattersFor(
    configuration?.primaryPracticeArea || firm.primaryPracticeArea,
    parseStringArray(configuration?.matterTypes),
    catalogue.map((type) => type.key),
  );

  const created: string[] = [];
  const skipped: string[] = [];

  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);

  for (const sample of available) {
    const existing = await prisma.matter.findFirst({
      where: { firmId: scope.firmId, reference: sample.reference },
      select: { id: true },
    });
    if (existing) {
      skipped.push(sample.reference);
      continue;
    }

    const existingClient = await prisma.clientProfile.findFirst({
      where: { firmId: scope.firmId, displayName: sample.clientName },
    });
    const client =
      existingClient ??
      (await prisma.clientProfile.create({
        data: { firmId: scope.firmId, displayName: sample.clientName, isFictional: true },
      }));

    const matter = await prisma.matter.create({
      data: {
        firmId: scope.firmId,
        reference: sample.reference,
        title: sample.title,
        status: sample.status,
        matterTypeKey: sample.matterTypeKey,
        practiceAreaKey: sample.practiceAreaKey,
        representationSide: sample.representationSide ?? null,
        responsibleAttorneyId: responsibleUserId,
        createdById: responsibleUserId,
        clientProfileId: client.id,
        fields: JSON.stringify(sample.fields),
        openedAt: daysAgo(sample.openedDaysAgo),
        nextDeadlineAt: sample.nextDeadlineInDays ? inDays(sample.nextDeadlineInDays) : null,
        lastActivityAt: daysAgo(Math.min(...sample.documents.map((d) => d.receivedDaysAgo), 1)),
      },
    });

    for (const document of sample.documents) {
      await prisma.document.create({
        data: {
          firmId: scope.firmId,
          matterId: matter.id,
          filename: document.filename,
          category: document.category,
          mimeType: document.mimeType,
          sizeBytes: document.sizeBytes,
          receivedAt: daysAgo(document.receivedDaysAgo),
          verified: document.verified,
          analysisStatus: "classified",
          uploadedById: responsibleUserId,
        },
      });
    }

    for (const task of sample.tasks) {
      await prisma.task.create({
        data: {
          firmId: scope.firmId,
          matterId: matter.id,
          title: task.title,
          description: task.description ?? null,
          status: task.status,
          priority: task.priority,
          dueAt: task.dueInDays === undefined ? null : inDays(task.dueInDays),
          createdById: responsibleUserId,
        },
      });
    }

    await prisma.intakeResponse.create({
      data: {
        firmId: scope.firmId,
        matterId: matter.id,
        payload: JSON.stringify(sample.intake),
        status: "submitted",
        submittedById: responsibleUserId,
        submittedAt: daysAgo(sample.openedDaysAgo),
      },
    });

    created.push(sample.reference);
  }

  return { created, skipped, notOffered: notOffered.map((matter) => matter.reference) };
}

/**
 * What demonstration data this firm currently holds.
 *
 * Counts only. A platform administrator reads a firm's inventory from the
 * administration screens, and operating the platform does not include reading
 * a firm's client files — so nothing here returns a title, a name or a
 * document.
 */
export async function demonstrationInventory(scope: FirmScope) {
  const [matters, documents, clients, analyses, approvals, tasks] = await Promise.all([
    prisma.matter.count({ where: { firmId: scope.firmId } }),
    prisma.document.count({ where: { firmId: scope.firmId } }),
    prisma.clientProfile.count({ where: { firmId: scope.firmId } }),
    prisma.aIAnalysis.count({ where: { firmId: scope.firmId } }),
    prisma.approvalRequest.count({ where: { firmId: scope.firmId } }),
    prisma.task.count({ where: { firmId: scope.firmId } }),
  ]);

  return { matters, documents, clients, analyses, approvals, tasks };
}
