import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can, type Permission } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { getMatter } from "@/lib/data/matters";
import { formatDate } from "@/lib/format/dates";
import { firmTimezoneFor } from "@/lib/data/firms";
import { raiseApproval } from "@/lib/approvals/raise";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — the two sensitive things a person can ask for on a matter.
 *
 * Closing it, and confirming the date recorded on it. Neither happens here:
 * both go through `raiseApproval`, which either raises a request for a person
 * to decide or — for a configurable rule the firm switched off — applies the
 * effect through the same function the approval path uses.
 *
 * The difference between the two is the point of the screen:
 *
 * - **Close a matter** is configurable. A firm may decide it needs no
 *   approval, and then it closes immediately. That is the firm's call and it
 *   is recorded as such.
 * - **Confirm a date** is locked. There is no configuration, at this firm or
 *   any other, under which it happens without somebody deciding — because
 *   Orchelio never calculates or confirms a date, and the only thing that can
 *   make one confirmed is a person saying so.
 */

const ACTIONS: Record<string, { permission: Permission; summarise: (reference: string, title: string, date: string) => string }> = {
  close_matter: {
    permission: "matter.close",
    summarise: (reference, title) => `Close ${reference} — ${title}.`,
  },
  deadline_confirmation: {
    permission: "deadline.confirm",
    summarise: (reference, title, date) =>
      `Confirm the date recorded on ${reference} (${title}): ${date}. Orchelio has not checked it against anything.`,
  },
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fmatters");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  const form = await request.formData();
  const matterId = String(form.get("matterId") ?? "");
  const actionKey = String(form.get("action") ?? "");

  // Back to the tab the request was made from, not to the matter's front page.
  // Landing somewhere else after pressing a button reads as nothing happening.
  const back = (query: string) =>
    seeOther(`/matters/${encodeURIComponent(matterId)}?tab=approvals&${query}`);

  const action = ACTIONS[actionKey];
  if (!matterId || !action) return seeOther("/matters");

  if (!can(actorFor(session.user, firm.id), action.permission)) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: action.permission,
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const scope = scopeFor(firm);
  const matter = await getMatter({ matterId, firmId: firm.id });
  if (!matter) return seeOther("/403");

  // The summary is stored and read back months later on the approval card, so
  // the date in it must be the firm's day rather than the server's.
  const timezone = await firmTimezoneFor(scope);

  if (actionKey === "close_matter" && matter.closedAt) {
    return back(`problem=${encodeURIComponent("This matter is already closed.")}`);
  }
  if (actionKey === "deadline_confirmation" && !matter.nextDeadlineAt) {
    return back(
      `problem=${encodeURIComponent("There is no date recorded on this matter to confirm.")}`,
    );
  }

  const outcome = await raiseApproval(scope, {
    actionKey,
    resourceId: matter.id,
    matterId: matter.id,
    summary: action.summarise(matter.reference, matter.title, formatDate(matter.nextDeadlineAt, timezone)),
    requestedById: session.user.id,
  });

  if (outcome.required) {
    return back(`raised=${encodeURIComponent(outcome.approvalId)}`);
  }

  if (outcome.reason === "matter_not_found") return seeOther("/403");

  // Applied without a decision, because this firm switched the rule off.
  if (actionKey === "close_matter" && outcome.applied) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.matterClosed,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "matter",
      resourceId: matter.id,
      newValue: { reference: matter.reference, approvalRequired: false },
    });
  }

  return back("applied=1");
}
