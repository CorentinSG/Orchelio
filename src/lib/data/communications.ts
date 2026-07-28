import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — prepared drafts.
 *
 * Read the schema before reading this: `DraftCommunication.status` is
 * `"draft" | "approved_for_use"`. There is no third value, no `sentAt`, no
 * recipient address and no transport anywhere in the product. A draft is text
 * a person copies out of Orchelio and sends themselves, from their own system,
 * under their own name.
 *
 * That is not a limitation to be lifted later. A product that could send on a
 * firm's behalf would need to be trusted with when to send, and nothing in this
 * design is arranged to earn that.
 */

export type DraftFilters = { matterId?: string; status?: string };

export async function listDrafts(scope: FirmScope, filters: DraftFilters = {}) {
  return prisma.draftCommunication.findMany({
    where: {
      firmId: scope.firmId,
      ...(filters.matterId ? { matterId: filters.matterId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      matter: { select: { id: true, reference: true, title: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function getDraft({ draftId, firmId }: { draftId: string } & FirmScope) {
  return prisma.draftCommunication.findFirst({
    where: { id: draftId, firmId },
    include: {
      matter: { select: { id: true, reference: true, title: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export type NewDraft = {
  matterId: string;
  channel: string;
  subject: string;
  body: string;
  createdById: string;
};

/**
 * Prepares a draft.
 *
 * Always in `"draft"`. Nothing in this module can create one already approved:
 * approving is a decision a person takes on an approval request, recorded
 * there, and applied from there.
 */
export async function createDraft(scope: FirmScope, input: NewDraft) {
  const matter = await prisma.matter.findFirst({
    where: { id: input.matterId, firmId: scope.firmId },
    select: { id: true },
  });
  if (!matter) return null;

  return prisma.draftCommunication.create({
    data: {
      firmId: scope.firmId,
      matterId: matter.id,
      channel: input.channel,
      subject: input.subject.slice(0, 300),
      body: input.body.slice(0, 20_000),
      status: "draft",
      createdById: input.createdById,
    },
  });
}

export async function countDrafts(scope: FirmScope): Promise<number> {
  return prisma.draftCommunication.count({ where: { firmId: scope.firmId } });
}
