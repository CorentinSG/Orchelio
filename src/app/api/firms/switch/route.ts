import { NextResponse } from "next/server";

import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { currentSession } from "@/lib/auth/session";

/**
 * Orchelio — switch the active firm.
 *
 * Deliberately a plain form POST to a route handler that answers with an HTTP
 * 303, rather than a Server Action.
 *
 * The reason is measured, not stylistic. With a Server Action the new page is
 * rendered inside the action's own response, and that render did not reliably
 * pick up the cookie the action had just written: roughly half the time the
 * browser showed the *previous* firm's dashboard. The server state was always
 * correct — a reload fixed it — but a user looking at the wrong firm's screen
 * is exactly the failure this product exists to prevent, and "usually right"
 * is not a standard worth shipping.
 *
 * A 303 has no such ambiguity: the browser stores the cookie from this
 * response, then issues a fresh GET that renders from it. Boring, and correct
 * every time.
 */

const ACTIVE_FIRM_COOKIE = "orchelio_active_firm";

/**
 * Rejects a cross-site submission.
 *
 * The `Origin` header is compared against the request's own `Host` header, not
 * against `request.url`: Next reconstructs that URL and it does not always
 * carry the host the browser actually used. Comparing against it rejected every
 * legitimate submission from `127.0.0.1` because the reconstructed URL said
 * `localhost`.
 *
 * The session cookie is already `SameSite=Lax`, which is the primary defence —
 * a cross-site POST does not carry it, so it cannot act as the user. This is
 * defence in depth for the case where that assumption is ever weakened.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    return false;
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * A 303 with a *relative* Location.
 *
 * Absolute redirects built from `request.url` sent the browser to a different
 * host than the one it was on — and since cookies are host-scoped, the user
 * arrived signed out. A relative Location is valid HTTP and keeps the browser
 * exactly where it already is.
 */
function seeOther(path: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

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
