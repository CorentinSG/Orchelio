import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { isApprovalDecision, requiresNote } from "@/lib/approvals/actions";
import { recordDecision } from "@/lib/approvals/raise";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";
import { SELF_DECISION_REFUSAL } from "@/lib/approvals/separation";
import { SUPERSEDED_REFUSAL } from "@/lib/approvals/status";

/**
 * Orchelio — record a decision on an approval request.
 *
 * The one endpoint through which a sensitive action takes effect. Everything
 * it can do is governed by the request being decided, not by the form: the
 * form carries an identifier, a decision and a note, and nothing else. What
 * happens next is read from the stored request.
 *
 * `approval.decide` is held by firm administrators and attorneys. A paralegal
 * may see the queue and may not decide — which is the point of having a queue.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fapprovals");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  if (!can(actorFor(session.user, firm.id), "approval.decide")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "approval.decide",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const form = await request.formData();
  const approvalId = String(form.get("approvalId") ?? "");
  const decision = String(form.get("decision") ?? "");
  const note = String(form.get("note") ?? "");
  const returnTo = String(form.get("returnTo") ?? "/approvals");

  const back = (query: string) =>
    seeOther(`${returnTo.startsWith("/") ? returnTo : "/approvals"}?${query}`);

  if (!approvalId) return seeOther("/approvals");
  if (!isApprovalDecision(decision)) {
    return back(`problem=${encodeURIComponent("Choose one of the four decisions.")}`);
  }

  // Checked here as well as in the data layer. The browser's `required`
  // attribute is a courtesy on a machine the user controls.
  if (requiresNote(decision) && note.trim() === "") {
    return back(
      `focus=${encodeURIComponent(approvalId)}&problem=${encodeURIComponent(
        "That decision needs a note saying why — it leaves somebody with work to do.",
      )}`,
    );
  }

  const outcome = await recordDecision(scopeFor(firm), {
    approvalId,
    decision,
    note,
    decidedById: session.user.id,
  });

  if (!outcome.ok) {
    switch (outcome.reason) {
      case "not_found":
        // Missing and not-this-firm's get the same answer.
        return seeOther("/403");
      case "already_decided":
        return back(
          `problem=${encodeURIComponent("Somebody has already decided this one. Nothing was changed.")}`,
        );
      case "note_required":
        return back(`problem=${encodeURIComponent("That decision needs a note saying why.")}`);
      case "same_person":
        // Refused by the server, not merely hidden from the screen: the buttons
        // are absent for a self-decision, and this is what answers a request
        // built by hand.
        return back(
          `focus=${encodeURIComponent(approvalId)}&problem=${encodeURIComponent(SELF_DECISION_REFUSAL)}`,
        );
      case "superseded":
        // Distinct from "already decided" on purpose: nobody decided this one,
        // and saying they had would send the reader looking for a decision that
        // does not exist.
        return back(`problem=${encodeURIComponent(SUPERSEDED_REFUSAL)}`);
    }
  }

  return back(`decided=${encodeURIComponent(approvalId)}`);
}
