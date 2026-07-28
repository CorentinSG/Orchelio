import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { requestScoped } from "@/lib/cache";
import { type Actor, type FirmRole, isFirmRole } from "@/lib/auth/permissions";

/**
 * Orchelio — session management.
 *
 * Sessions are server-side and revocable. The cookie carries a 256-bit random
 * token; the database stores only its SHA-256 hash. A database leak therefore
 * does not hand over usable sessions, and there is no signing secret to manage.
 *
 * This module is the seam that a real identity provider replaces. Auth.js,
 * Clerk, Microsoft Entra ID, Google Workspace or SSO would reimplement
 * `currentSession()` and `signIn()`; nothing above this layer changes, because
 * every screen asks for the session through the guards in ./guards.ts.
 */

const COOKIE_NAME = "orchelio_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours — a working day.

export type SessionFirm = {
  id: string;
  slug: string;
  name: string;
  primaryPracticeArea: string;
  status: string;
  role: FirmRole;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
  /** Firms this user may access, with the role held in each. */
  firms: SessionFirm[];
};

export type Session = {
  user: SessionUser;
  expiresAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a session for a user and sets the cookie.
 * Returns the expiry so the caller can log it.
 */
export async function createSession(userId: string, userAgent?: string): Promise<Date> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: userAgent?.slice(0, 255) ?? null,
    },
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return expiresAt;
}

/**
 * Reads the current session, or null.
 *
 * Memoised for the lifetime of one request. Rendering a single page asks for
 * the session from the layout, from the page and from each access guard, and
 * each ask meant a session lookup plus its user, memberships and firms. The
 * memoisation collapses them to one.
 *
 * It changes nothing about validity: React's `cache()` cannot outlive the
 * request that created it, so an expired or revoked session still stops working
 * on the very next request rather than at the cookie's own expiry. See
 * src/lib/cache.ts for why this is the only kind of caching applied to
 * firm-scoped data.
 */
export const currentSession = requestScoped(async function currentSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const record = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            where: { status: "active" },
            include: { firm: true },
          },
        },
      },
    },
  });

  if (!record || record.revokedAt !== null || record.expiresAt <= new Date()) {
    return null;
  }

  if (record.user.status !== "active") {
    return null;
  }

  const firms: SessionFirm[] = record.user.memberships
    // A membership carrying an unrecognised role grants nothing. Failing closed
    // matters more than tolerating bad data.
    .filter((membership) => isFirmRole(membership.role))
    .map((membership) => ({
      id: membership.firm.id,
      slug: membership.firm.slug,
      name: membership.firm.name,
      primaryPracticeArea: membership.firm.primaryPracticeArea,
      status: membership.firm.status,
      role: membership.role as FirmRole,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    user: {
      id: record.user.id,
      email: record.user.email,
      name: record.user.name,
      isPlatformAdmin: record.user.isPlatformAdmin,
      firms,
    },
    expiresAt: record.expiresAt,
  };
});

/** Revokes the current session and clears the cookie. Safe to call when signed out. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (token) {
    // updateMany, not update: an unknown token must not throw.
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  store.delete(COOKIE_NAME);
}

/** Builds the permission actor for a user acting inside a given firm. */
export function actorFor(user: SessionUser, firmId: string | null): Actor {
  const membership = firmId ? user.firms.find((firm) => firm.id === firmId) : undefined;
  return {
    userId: user.id,
    isPlatformAdmin: user.isPlatformAdmin,
    role: membership?.role ?? null,
  };
}
