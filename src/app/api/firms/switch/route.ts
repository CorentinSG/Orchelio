import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { currentSession } from "@/lib/auth/session";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — switch the active firm.
 *
 * A plain form POST answered with a 303 — see src/lib/http/form-post.ts for
 * why Orchelio does not use a Server Action here. The specific symptom this
 * avoided: the browser showed the *previous* firm's dashboard about half the
 * time, while the server state was correct all along.
 */

const ACTIVE_FIRM_COOKIE = "orchelio_active_firm";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return seeOther("/403");
  }

  const session = await currentSession();
  if (!session) {
    return seeOther("/login");
  }

  const formData = await request.formData();
  const requestedFirmId = String(formData.get("firmId") ?? "");

  // The submitted identifier is checked against this user's own memberships.
  // A firm they do not belong to is refused, and the attempt is recorded —
  // this endpoint is the most obvious place to try to cross a tenant boundary.
  const membership = session.user.firms.find((firm) => firm.id === requestedFirmId);

  if (!membership) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      userId: session.user.id,
      firmId: null,
      resourceType: "firm",
      resourceId: requestedFirmId || null,
      status: "denied",
      newValue: { reason: "switch_to_firm_without_membership" },
    });
    return seeOther("/403");
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.firmSwitched,
    userId: session.user.id,
    firmId: membership.id,
    resourceType: "firm",
    resourceId: membership.id,
  });

  const response = seeOther("/dashboard");
  response.cookies.set(ACTIVE_FIRM_COOKIE, membership.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
