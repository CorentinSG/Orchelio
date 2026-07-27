import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — document access.
 *
 * A document is reachable only through its own firm. That matters most for the
 * download path (Phase 5): a link copied out of one firm's workspace and opened
 * inside another must produce nothing, not a file.
 */

export async function getDocument({ documentId, firmId }: { documentId: string } & FirmScope) {
  return prisma.document.findFirst({
    where: { id: documentId, firmId },
    include: {
      matter: { select: { id: true, reference: true, title: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

export async function listDocuments(
  scope: FirmScope,
  filters: { matterId?: string; category?: string } = {},
) {
  return prisma.document.findMany({
    where: {
      firmId: scope.firmId,
      ...(filters.matterId ? { matterId: filters.matterId } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    orderBy: { receivedAt: "desc" },
  });
}

export async function countDocuments(scope: FirmScope): Promise<number> {
  return prisma.document.count({ where: { firmId: scope.firmId } });
}

/**
 * Resolves a document for download.
 *
 * Separate from `getDocument` so the intent is explicit at the call site and
 * the refusal path can be logged as an attempted download rather than an
 * ordinary read.
 */
export async function getDocumentForDownload({
  documentId,
  firmId,
}: { documentId: string } & FirmScope) {
  return prisma.document.findFirst({
    where: { id: documentId, firmId },
    select: { id: true, filename: true, mimeType: true, sizeBytes: true, storageKey: true },
  });
}
