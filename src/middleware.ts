import { type NextRequest, NextResponse } from "next/server";

/**
 * Orchelio — sign-in redirect.
 *
 * READ THIS BEFORE CHANGING IT: this middleware is a convenience, not a
 * security boundary. It only looks at whether a session cookie is *present*,
 * which proves nothing — the cookie may be expired, revoked, or invented.
 *
 * Access control lives in src/lib/auth/guards.ts and runs on the server inside
 * every protected page and action, where the session is revalidated against the
 * database. Deleting this file would cost a little polish and no safety at all.
 *
 * What it buys: a signed-out visitor who asks for /dashboard is sent to
 * /login?next=/dashboard and lands back where they wanted after signing in.
 * A layout cannot do this, because it does not know the requested path.
 */

const SESSION_COOKIE = "orchelio_session";

export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Only the signed-in areas. Everything else — the home page, /login, /403,
  // static assets — is public and must not be touched here.
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
