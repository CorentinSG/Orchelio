import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { createDraft } from "@/lib/data/communications";
import { raiseApproval } from "@/lib/approvals/raise";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

const CHANNELS = ["email", "letter", "note"] as const;

/**
 * Orchelio — prepare a draft.
 *
 * Preparing is not sending, and Orchelio has no sending. What this endpoint
 * creates is text in `"draft"`, plus an approval request that a person must
 * decide before anybody treats those words as ready to leave the firm.
 *
 * That approval is governed by `externalTransmission`, one of the nine locked
 * rules, so it is raised whatever the firm's configuration says. There is no
 * setting, in this product or in a firm's own configuration, that produces a
 * draft nobody had to approve.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fmatters");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  if (!can(actorFor(session.user, firm.id), "communication.draft")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "communication.draft",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const form = await request.formData();
  const matterId = String(form.get("matterId") ?? "");
  const channel = String(form.get("channel") ?? "email");
  const subject = String(form.get("subject") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();

  const back = (query: string) =>
    seeOther(`/matters/${encodeURIComponent(matterId)}?tab=communications&${query}`);

  if (!matterId) return seeOther("/matters");
  if (!subject) return back(`problem=${encodeURIComponent("Give the draft a subject.")}`);
  if (!body) return back(`problem=${encodeURIComponent("A draft with no text is not a draft.")}`);
  if (!(CHANNELS as readonly string[]).includes(channel)) {
    return back(`problem=${encodeURIComponent("Choose a channel from the list.")}`);
  }

  const scope = scopeFor(firm);
  const draft = await createDraft(scope, {
    matterId,
    channel,
    subject,
    body,
    createdById: session.user.id,
  });

  if (!draft) {
    // Real identifier, wrong firm, or no such matter. Same answer to all.
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "matter",
      resourceId: matterId,
      status: "denied",
      newValue: { reason: "matter_not_in_firm" },
    });
    return seeOther("/403");
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.draftPrepared,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "draft_communication",
    resourceId: draft.id,
    newValue: { matterId, channel, subject, status: draft.status },
  });

  await raiseApproval(scope, {
    actionKey: "external_transmission",
    resourceId: draft.id,
    matterId,
    summary: `${channel === "email" ? "Email" : channel === "letter" ? "Letter" : "Note"} draft — "${subject}"`,
    requestedById: session.user.id,
  });

  return back("prepared=1");
}
