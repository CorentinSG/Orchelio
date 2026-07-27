"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { recordAuditEvent, newCorrelationId } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { consumeAttempt, resetAttempts } from "@/lib/auth/rate-limit";
import { createSession, currentSession, destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * Orchelio — sign-in and sign-out.
 *
 * These are Server Actions, which Next.js protects against cross-site requests
 * by checking the request origin. No credential ever reaches client JavaScript.
 *
 * Two rules shape the error handling:
 *   1. One message for every failure. "No such account" and "wrong password"
 *      are indistinguishable to the caller, so the form cannot be used to
 *      enumerate which addresses exist.
 *   2. The same work is done either way — an unknown address still runs a
 *      password verification against a dummy hash — so response time does not
 *      leak the answer that the message withholds.
 */

export type SignInState = { error: string | null };

const GENERIC_FAILURE = "Incorrect email address or password.";

/** Only relative, single-slash paths are accepted, so `next` cannot send a user off-site. */
function safeRedirectTarget(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectTarget(formData.get("next"));
  const correlationId = newCorrelationId();

  if (email.length === 0 || password.length === 0) {
    return { error: "Enter both an email address and a password." };
  }

  const throttle = consumeAttempt(email);
  if (!throttle.allowed) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.loginThrottled,
      status: "denied",
      resourceType: "user",
      newValue: { email, resetAt: throttle.resetAt.toISOString() },
      correlationId,
    });
    return { error: "Too many sign-in attempts. Try again in a few minutes." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always verify something, so an unknown address costs the same as a known one.
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches || user.status !== "active") {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.loginFailed,
      userId: user?.id ?? null,
      status: "failure",
      resourceType: "user",
      // The submitted address is recorded; the submitted password never is.
      newValue: { email, reason: user ? "invalid_credentials_or_inactive" : "unknown_account" },
      correlationId,
    });
    return { error: GENERIC_FAILURE };
  }

  resetAttempts(email);

  const requestHeaders = await headers();
  const expiresAt = await createSession(user.id, requestHeaders.get("user-agent") ?? undefined);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.loginSucceeded,
    userId: user.id,
    resourceType: "user",
    resourceId: user.id,
    newValue: { expiresAt: expiresAt.toISOString() },
    correlationId,
  });

  // Drop anything the browser cached for the previous occupant of this browser.
  // Server rendering would have produced the right pages anyway, but a cached
  // payload could still be shown — and in this product that would mean one
  // person seeing another's workspace.
  revalidatePath("/", "layout");

  // redirect() throws to unwind the action, so it must be the last statement.
  redirect(next ?? "/dashboard");
}

export async function signOutAction(): Promise<void> {
  const session = await currentSession();

  if (session) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.logout,
      userId: session.user.id,
      resourceType: "user",
      resourceId: session.user.id,
    });
  }

  await destroySession();

  // Signing out must leave nothing behind that the next person at this browser
  // could see, including cached render payloads.
  revalidatePath("/", "layout");

  redirect("/login");
}
