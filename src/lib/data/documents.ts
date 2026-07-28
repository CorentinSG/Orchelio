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

export type NewDocument = {
  matterId: string;
  filename: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
};

/**
 * Records an uploaded document.
 *
 * The matter is re-read within the firm's scope first, so a document cannot be
 * attached to a matter the caller may not see — even if the identifier is real.
 * The file itself is simulated: only metadata is stored, and `storageKey` names
 * where a real deployment would have put it.
 */
export async function addDocument(scope: FirmScope, input: NewDocument) {
  const matter = await prisma.matter.findFirst({
    where: { id: input.matterId, firmId: scope.firmId },
    select: { id: true, reference: true },
  });
  if (!matter) return null;

  return prisma.document.create({
    data: {
      firmId: scope.firmId,
      matterId: matter.id,
      filename: input.filename,
      category: input.category,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey: `${scope.firmId}/${matter.reference}/${input.filename}`,
      uploadedById: input.uploadedById,
      analysisStatus: "pending",
      verified: false,
    },
  });
}

/** Marks a document as checked by a person. Only a person may do this. */
export async function setDocumentVerified(
  scope: FirmScope,
  documentId: string,
  verified: boolean,
): Promise<number> {
  const result = await prisma.document.updateMany({
    where: { id: documentId, firmId: scope.firmId },
    data: { verified, analysisStatus: verified ? "classified" : "pending" },
  });
  return result.count;
}

/** Document counts by category for one matter, for the missing-document list. */
export async function documentCategories(scope: FirmScope, matterId: string): Promise<string[]> {
  const rows = await prisma.document.findMany({
    where: { firmId: scope.firmId, matterId },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((row) => row.category);
}
