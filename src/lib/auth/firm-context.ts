import "server-only";

import { cookies } from "next/headers";

import type { FirmScope } from "@/lib/data/scope";
import type { Session, SessionFirm } from "@/lib/auth/session";

/**
 * Orchelio — the active firm.
 *
 * A user may belong to more than one firm. Which one they are currently working
 * in is remembered in a cookie — but that cookie is never trusted. It is a
 * *preference*, and the only thing it can do is select among the firms the
 * user's memberships already permit.
 *
 * Concretely: editing the cookie to another firm's identifier does not grant
 * access. The identifier is looked up in the session's membership list, and if
 * it is not there the preference is discarded and the user falls back to their
 * own first firm. This module is the only place a `FirmScope` is created.
 */

const ACTIVE_FIRM_COOKIE = "orchelio_active_firm";

/** Remembers the chosen firm. Caller must have verified membership first. */
export async function setActiveFirmCookie(firmId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_FIRM_COOKIE, firmId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveFirmCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ACTIVE_FIRM_COOKIE);
}

/**
 * Chooses the active firm from a preference and a membership list.
 *
 * Pure, and exported separately from the cookie reading so the rule that
 * matters — an unmatched preference grants nothing — can be unit-tested
 * without a request.
 */
export function resolveActiveFirm(
  firms: readonly SessionFirm[],
  preferredFirmId: string | null | undefined,
): SessionFirm | null {
  if (preferredFirmId) {
    const preferred = firms.find((firm) => firm.id === preferredFirmId);
    if (preferred) {
      return preferred;
    }
    // Deliberate: an unrecognised preference is ignored, not honoured and not
    // an error. It happens legitimately when a membership is revoked.
  }

  return firms[0] ?? null;
}

/** The active firm for this request, or null when the user belongs to none. */
export async function activeFirmFor(session: Session): Promise<SessionFirm | null> {
  const store = await cookies();
  return resolveActiveFirm(session.user.firms, store.get(ACTIVE_FIRM_COOKIE)?.value ?? null);
}

/** The scope to pass to every function in `src/lib/data`. */
export function scopeFor(firm: SessionFirm): FirmScope {
  return { firmId: firm.id };
}
