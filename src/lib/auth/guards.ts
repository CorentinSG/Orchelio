import "server-only";

import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { type Permission, can } from "@/lib/auth/permissions";
import { type Session, type SessionFirm, actorFor, currentSession } from "@/lib/auth/session";

/**
 * Orchelio — server-side access control.
 *
 * These guards run on the server, inside the page or action that needs them.
 * There is deliberately no middleware doing the enforcement: middleware is easy
 * to bypass by adding a route that it does not match, and a security boundary
 * that depends on a URL pattern staying in sync with a matcher is not a
 * boundary. Every protected page calls a guard itself.
 *
 * Refusals are recorded. An attempt to reach another firm's data is exactly the
 * event a firm would want to see in its activity log.
 */

/** Requires a signed-in user. Redirects to the login page otherwise. */
export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await currentSession();
  if (!session) {
    const target = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }
  return session;
}

export type FirmContext = {
  session: Session;
  firm: SessionFirm;
};

/**
 * Requires an active membership of the given firm.
 *
 * This is the check that keeps one firm out of another's data. It answers with
 * the membership the user actually holds — never with a firm identifier taken
 * from the URL and trusted.
 */
export async function requireFirmAccess(firmId: string): Promise<FirmContext> {
  const session = await requireSession();
  const firm = session.user.firms.find((candidate) => candidate.id === firmId);

  if (!firm) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId,
      userId: session.user.id,
      resourceType: "firm",
      resourceId: firmId,
      status: "denied",
      newValue: { reason: "no_active_membership" },
    });
    redirect("/403");
  }

  return { session, firm };
}

/**
 * Requires a permission within a firm.
 *
 * Membership is checked first, then the permission, so a user who is not a
 * member is refused for the right reason and the log says so.
 */
export async function requirePermission(
  firmId: string,
  permission: Permission,
): Promise<FirmContext> {
  const context = await requireFirmAccess(firmId);
  const actor = actorFor(context.session.user, firmId);

  if (!can(actor, permission)) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId,
      userId: context.session.user.id,
      resourceType: "permission",
      resourceId: permission,
      status: "denied",
      newValue: { reason: "missing_permission", role: context.firm.role },
    });
    redirect("/403");
  }

  return context;
}

/** Requires a platform administrator. */
export async function requirePlatformAdmin(): Promise<Session> {
  const session = await requireSession();

  if (!session.user.isPlatformAdmin) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      userId: session.user.id,
      resourceType: "platform_administration",
      status: "denied",
      newValue: { reason: "not_platform_admin" },
    });
    redirect("/403");
  }

  return session;
}

/**
 * The firm a signed-in user should land in.
 *
 * A user with exactly one firm goes straight to it. A user with several will
 * get the firm switcher in Phase 3; until then the first is used. A platform
 * administrator with no membership has no firm at all, which is correct — the
 * platform role does not grant access to any firm's matters.
 */
export function defaultFirmFor(session: Session): SessionFirm | null {
  return session.user.firms[0] ?? null;
}
