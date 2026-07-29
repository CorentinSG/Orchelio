import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { currentSession } from "@/lib/auth/session";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";
import { createFirm } from "@/lib/data/platform";
import { validateNewFirm } from "@/lib/platform/new-firm";

/**
 * Orchelio — creating a firm from the platform administration screen.
 *
 * This is the handler the phase's acceptance criterion runs through: a third
 * firm, created entirely through the interface, with no code change.
 *
 * What it creates is a firm, its configuration — carrying the nine locked
 * approval rules from the first second — and its first administrator. What it
 * does not create is a *working* firm: the questionnaire has not been answered
 * yet, so the firm is left in `onboarding` and the screens say so rather than
 * showing an empty workspace that looks broken.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return seeOther("/403");
  }

  const session = await currentSession();
  if (!session) {
    return seeOther("/login?next=%2Fadmin%2Ffirms");
  }

  // Creating a tenant is a platform operation, not a firm one. There is no firm
  // to be a member of yet, so this is the one screen where the platform
  // administrator flag is the whole of the answer.
  if (!session.user.isPlatformAdmin) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      userId: session.user.id,
      resourceType: "platform_administration",
      status: "denied",
      newValue: { reason: "not_platform_admin", attempted: "firm.create" },
    });
    return seeOther("/403");
  }

  const formData = await request.formData();
  const input = {
    name: String(formData.get("name") ?? ""),
    primaryPracticeArea: String(formData.get("primaryPracticeArea") ?? ""),
    administratorName: String(formData.get("administratorName") ?? ""),
    administratorEmail: String(formData.get("administratorEmail") ?? ""),
  };

  const validation = validateNewFirm(input);
  if (!validation.ok) {
    return seeOther(`/admin/firms?error=${encodeURIComponent(validation.message)}`);
  }

  const outcome = await createFirm(input);
  if (!outcome.ok) {
    return seeOther(`/admin/firms?error=${encodeURIComponent(outcome.message)}`);
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.firmCreated,
    firmId: outcome.firm.firmId,
    userId: session.user.id,
    resourceType: "firm",
    resourceId: outcome.firm.firmId,
    newValue: {
      slug: outcome.firm.slug,
      primaryPracticeArea: input.primaryPracticeArea,
      administratorEmail: outcome.firm.administratorEmail,
      administratorCreated: outcome.firm.administratorCreated,
    },
  });

  // No password travels in this URL. In the demonstration build every account
  // shares the one already printed on the sign-in page, so the confirmation can
  // read it from the same constant the sign-in page does.
  const created = new URLSearchParams({
    created: outcome.firm.slug,
    email: outcome.firm.administratorEmail,
    ...(outcome.firm.administratorCreated ? { newAccount: "1" } : {}),
  });

  return seeOther(`/admin/firms?${created.toString()}`);
}
