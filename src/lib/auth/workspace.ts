import "server-only";

import { redirect } from "next/navigation";

import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { requireFirmAccess, requirePermission } from "@/lib/auth/guards";
import { type Session, type SessionFirm, currentSession } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — the four lines every workspace page starts with.
 *
 * Signed in, a firm open, membership verified, scope in hand. Repeated at the
 * top of every page in the workspace, so it lives here once — and, more
 * importantly, so a new page cannot accidentally do three of the four.
 *
 * This is a convenience over the guards, not a replacement for them: it calls
 * exactly the same `requireFirmAccess` / `requirePermission`, which are what
 * actually decide.
 */

export type WorkspaceContext = {
  session: Session;
  firm: SessionFirm;
  scope: FirmScope;
};

/** Signed in, with a firm open and membership verified. */
export async function requireWorkspace(returnTo: string): Promise<WorkspaceContext> {
  const session = await currentSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  const active = await activeFirmFor(session);
  if (!active) {
    // A platform administrator holds no membership by design, so there is no
    // workspace for them to enter.
    redirect(session.user.isPlatformAdmin ? "/admin/firms" : "/403");
  }

  const { firm } = await requireFirmAccess(active.id);
  return { session, firm, scope: scopeFor(firm) };
}

/** The same, plus one permission. */
export async function requireWorkspacePermission(
  returnTo: string,
  permission: Permission,
): Promise<WorkspaceContext> {
  const context = await requireWorkspace(returnTo);
  const { firm } = await requirePermission(context.firm.id, permission);
  return { ...context, firm };
}

/** Matter, document and task screens all require the same thing to look. */
export function requireMatterAccess(): Promise<WorkspaceContext> {
  return requireWorkspacePermission("/matters", "matter.view");
}
