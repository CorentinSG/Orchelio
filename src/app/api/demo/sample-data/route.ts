import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";
import { addSampleMatters } from "@/lib/data/demo";

/**
 * Orchelio — adding fictional matters to a firm.
 *
 * A firm created through the interface starts empty, and an empty workspace
 * demonstrates nothing. This adds the same three fictional matters the seed
 * writes, to the firm the caller is signed into — never to another one, which
 * is why the firm comes from the session rather than from the form.
 *
 * There is no matching handler that removes them. Erasing demonstration data is
 * a command a person runs at a terminal (`npm run reset-demo`), deliberately
 * not a button — see ADR-0016.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return seeOther("/403");
  }

  const session = await currentSession();
  if (!session) {
    return seeOther("/login?next=%2Fsettings");
  }

  const firm = await activeFirmFor(session);
  if (!firm) {
    return seeOther("/403");
  }

  if (!can(actorFor(session.user, firm.id), "firm.settings.edit")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "firm.settings.edit",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const result = await addSampleMatters(scopeFor(firm), session.user.id);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.demoSeeded,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "firm",
    resourceId: firm.id,
    newValue: result,
  });

  return seeOther(
    `/settings?section=demonstration&added=${result.created.length}&skipped=${result.skipped.length}`,
  );
}
