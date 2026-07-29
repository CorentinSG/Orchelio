import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";
import { updateMemberStatus, updateMemberRole } from "@/lib/data/settings";

/**
 * Orchelio — changing what somebody may do inside a firm.
 *
 * Managing people is a separate permission from configuring the firm
 * (`firm.users.manage`, not `firm.settings.edit`), so it is a separate route
 * rather than another branch of the settings handler. An attorney may read the
 * settings and change nothing; an administrator may do both.
 */

function back(query: string): string {
  return `/settings?section=people${query}`;
}

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

  if (!can(actorFor(session.user, firm.id), "firm.users.manage")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "firm.users.manage",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const scope = scopeFor(firm);
  const formData = await request.formData();
  const membershipId = String(formData.get("membershipId") ?? "");
  const intent = String(formData.get("intent") ?? "role");

  if (!membershipId) {
    return seeOther(back(""));
  }

  const result =
    intent === "status"
      ? await updateMemberStatus(scope, membershipId, String(formData.get("status") ?? ""))
      : await updateMemberRole(scope, membershipId, String(formData.get("role") ?? ""));

  if (!result.ok) {
    return seeOther(back(`&error=${encodeURIComponent(result.message)}`));
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.roleChanged,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "firm_membership",
    resourceId: membershipId,
    newValue:
      intent === "status"
        ? { status: String(formData.get("status") ?? "") }
        : { role: String(formData.get("role") ?? "") },
  });

  return seeOther(back("&saved=1"));
}
