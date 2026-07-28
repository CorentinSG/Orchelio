import { recordAuditEvent } from "@/lib/audit";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  AUDIT_ACTIONS,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { addDocument } from "@/lib/data/documents";
import { touchMatter } from "@/lib/data/matters";
import { isKnownCategory } from "@/lib/matters/documents";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — record a document against a matter.
 *
 * The file never reaches this handler. The browser reads its name, type and
 * size and posts those as text (see src/components/upload-panel.tsx); there is
 * no code path here that could receive the bytes, which makes "no real upload"
 * a property of the design rather than a promise in the documentation.
 *
 * Everything the browser checked is checked again. The browser's copy runs on a
 * machine the user controls, so it is a courtesy, not a control.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fmatters");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  if (!can(actorFor(session.user, firm.id), "document.upload")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "document.upload",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const form = await request.formData();
  const matterId = String(form.get("matterId") ?? "");
  const filename = String(form.get("filename") ?? "").trim();
  const category = String(form.get("category") ?? "other");
  const mimeType = String(form.get("mimeType") ?? "");
  const sizeBytes = Number(form.get("sizeBytes") ?? 0);

  const back = (problem: string) =>
    seeOther(`/matters/${encodeURIComponent(matterId)}?tab=documents&error=${encodeURIComponent(problem)}`);

  if (!matterId || !filename) return back("Choose a file before adding it.");

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)) {
    return back(`Orchelio accepts ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")} only.`);
  }

  // The browser reports the type; a hand-crafted post can claim anything. An
  // unrecognised type is stored as generic rather than trusted.
  const safeMimeType = (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)
    ? mimeType
    : "application/octet-stream";

  if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    return back(`Files must be under ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB.`);
  }

  const scope = scopeFor(firm);
  if (!isKnownCategory(firm.primaryPracticeArea, category)) {
    return back("Choose a document type from the list.");
  }

  // addDocument re-reads the matter within this firm's scope, so a real
  // identifier belonging to another firm records nothing.
  const document = await addDocument(scope, {
    matterId,
    filename: filename.slice(0, 255),
    category,
    mimeType: safeMimeType,
    sizeBytes: Math.round(sizeBytes),
    uploadedById: session.user.id,
  });

  if (!document) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "matter",
      resourceId: matterId,
      status: "denied",
      newValue: { reason: "matter_not_in_firm" },
    });
    return seeOther("/403");
  }

  await touchMatter(scope, matterId);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.documentAdded,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "document",
    resourceId: document.id,
    newValue: { filename: document.filename, category: document.category, matterId },
  });

  return seeOther(`/matters/${matterId}?tab=documents&added=1`);
}
