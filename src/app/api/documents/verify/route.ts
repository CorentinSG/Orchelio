import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { setDocumentVerified } from "@/lib/data/documents";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — mark a document as checked by a person.
 *
 * "Verified" means somebody looked at it and confirmed it is what it claims to
 * be. Nothing automatic ever sets it, which is why this is its own endpoint
 * with its own permission rather than a field on the upload form.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fmatters");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  if (!can(actorFor(session.user, firm.id), "document.classify")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "document.classify",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const form = await request.formData();
  const documentId = String(form.get("documentId") ?? "");
  const matterId = String(form.get("matterId") ?? "");

  const changed = await setDocumentVerified(scopeFor(firm), documentId, true);

  if (changed === 0) {
    // Either it does not exist or it is not this firm's. Same answer to both.
    return seeOther("/403");
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.documentAdded,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "document",
    resourceId: documentId,
    oldValue: { verified: false },
    newValue: { verified: true },
  });

  return seeOther(`/matters/${encodeURIComponent(matterId)}?tab=documents&verified=1`);
}
