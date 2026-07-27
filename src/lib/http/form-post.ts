import { NextResponse } from "next/server";

/**
 * Orchelio — plain form POSTs answered with an HTTP redirect.
 *
 * Orchelio submits its consequential forms — switching firm, saving an
 * onboarding step, confirming a configuration — to route handlers that answer
 * with a 303, rather than to Server Actions.
 *
 * That is a deliberate departure from the idiomatic Next.js pattern, and the
 * reason is measured rather than stylistic. A Server Action re-renders the
 * redirect target inside its own response, and twice during this build that
 * render did not reflect what the action had just done:
 *
 *   * switching firm left the browser showing the previous firm's dashboard
 *     about half the time;
 *   * confirming the onboarding configuration navigated nowhere at all once the
 *     user had walked through the seven steps.
 *
 * In both cases the server was right and the browser was wrong, which is the
 * worst combination: nothing looks broken, so nobody investigates. A 303 has no
 * such ambiguity — the browser applies the response, then issues a fresh GET.
 *
 * Two further benefits, neither of them the reason but both worth having: these
 * forms work with JavaScript disabled, and there is no cache to invalidate,
 * because a real navigation refetches.
 */

/**
 * Rejects a cross-site submission.
 *
 * `Origin` is compared against the request's own `Host` header, not against
 * `request.url`: Next reconstructs that URL and it does not always carry the
 * host the browser used, which rejected every legitimate submission from
 * `127.0.0.1` because the reconstruction said `localhost`.
 *
 * The session cookie is already `SameSite=Lax`, which is the primary defence —
 * a cross-site POST does not carry it, so it cannot act as the user. This is
 * defence in depth for the day that assumption is weakened.
 */
export function isSameOrigin(request: Request): boolean {
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
 * host than the one it was on, and since cookies are host-scoped the user
 * arrived signed out. A relative Location is valid HTTP and keeps the browser
 * exactly where it already is.
 */
export function seeOther(path: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}
