import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS, GENERIC_MATTER_STATUSES, REPRESENTATION_SIDES } from "@/lib/constants";
import { can } from "@/lib/auth/permissions";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { createMatter } from "@/lib/data/matters";
import { firmConfiguration } from "@/lib/data/firms";
import { sanitiseFieldValues } from "@/lib/matters/fields";
import { parseStringArray } from "@/lib/json-field";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";

/**
 * Orchelio — create a matter.
 *
 * The practice area is taken from the firm, never from the form: a firm creates
 * matters in its own area, and accepting it as input would let a submission
 * conjure fields the firm has no template for.
 *
 * The matter type is checked against the types this firm enabled during
 * onboarding, so the configuration is a constraint and not merely a menu.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return seeOther("/403");

  const session = await currentSession();
  if (!session) return seeOther("/login?next=%2Fmatters%2Fnew");

  const firm = await activeFirmFor(session);
  if (!firm) return seeOther("/403");

  if (!can(actorFor(session.user, firm.id), "matter.create")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "matter.create",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const scope = scopeFor(firm);
  const form = await request.formData();

  const title = String(form.get("title") ?? "").trim();
  const clientName = String(form.get("clientName") ?? "").trim();
  const matterTypeKey = String(form.get("matterTypeKey") ?? "");
  const status = String(form.get("status") ?? "lead");
  const side = String(form.get("representationSide") ?? "");

  const back = (problem: string) =>
    seeOther(`/matters/new?error=${encodeURIComponent(problem)}`);

  if (!title) return back("Give the matter a title.");
  if (!clientName) return back("Enter a fictional client name.");

  const configuration = await firmConfiguration(scope);
  const enabledTypes = parseStringArray(configuration?.matterTypes);
  if (!enabledTypes.includes(matterTypeKey)) {
    return back("Choose a matter type this firm handles.");
  }

  if (!(GENERIC_MATTER_STATUSES as readonly string[]).includes(status)) {
    return back("Choose a status from the list.");
  }

  const submitted: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("field_")) submitted[key.slice("field_".length)] = value;
  }

  const matter = await createMatter(scope, {
    title: title.slice(0, 200),
    clientName: clientName.slice(0, 120),
    matterTypeKey,
    practiceAreaKey: firm.primaryPracticeArea,
    status,
    representationSide: (REPRESENTATION_SIDES as readonly string[]).includes(side) ? side : null,
    responsibleAttorneyId: session.user.id,
    createdById: session.user.id,
    fields: sanitiseFieldValues(firm.primaryPracticeArea, matterTypeKey, submitted),
  });

  await recordAuditEvent({
    action: AUDIT_ACTIONS.matterCreated,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "matter",
    resourceId: matter.id,
    newValue: { reference: matter.reference, matterTypeKey, status },
  });

  return seeOther(`/matters/${matter.id}`);
}
