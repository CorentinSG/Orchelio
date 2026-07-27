import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { currentSession } from "@/lib/auth/session";
import { actorFor } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";
import {
  completeOnboarding,
  loadDraft,
  restartOnboarding,
  saveStep,
} from "@/lib/data/onboarding";
import {
  ONBOARDING_STEP_COUNT,
  buildApprovals,
  buildConfiguration,
  validateStep,
} from "@/lib/onboarding/config";

/**
 * Orchelio — the onboarding questionnaire's submissions.
 *
 * A plain form POST answered with a 303. See src/lib/http/form-post.ts for why
 * this is not a Server Action.
 *
 * Every submission is re-validated here. The browser's own validation is a
 * courtesy to the person filling the form; this is the copy that decides — and
 * `tests/e2e/onboarding.spec.ts` strips the browser's `required` attributes to
 * prove it.
 */

function stringList(formData: FormData, name: string): string[] {
  return formData.getAll(name).map((value) => String(value));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return seeOther("/403");
  }

  const session = await currentSession();
  if (!session) {
    return seeOther("/login?next=%2Fonboarding");
  }

  const firm = await activeFirmFor(session);
  if (!firm) {
    return seeOther("/403");
  }

  // Configuring what the firm *is* belongs to a firm administrator. An attorney
  // may read the settings; only an administrator may change them.
  if (!can(actorFor(session.user, firm.id), "firm.settings.edit")) {
    await recordAuditEvent({
      action: AUDIT_ACTIONS.accessDenied,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "permission",
      resourceId: "firm.settings.edit",
      status: "denied",
      newValue: { reason: "missing_permission", role: firm.role },
    });
    return seeOther("/403");
  }

  const scope = scopeFor(firm);
  const formData = await request.formData();
  const action = String(formData.get("action") ?? "step");

  if (action === "restart") {
    await restartOnboarding(scope);
    await recordAuditEvent({
      action: AUDIT_ACTIONS.firmConfigurationUpdated,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "firm_configuration",
      resourceId: firm.id,
      newValue: { status: "draft", reason: "restarted" },
    });
    return seeOther("/onboarding/1");
  }

  if (action === "confirm") {
    const draft = await loadDraft(scope);

    // Re-check every step before the configuration becomes live. A firm could
    // otherwise reach the summary holding an answer that was valid when given
    // and is not any more — a matter type belonging to a practice area it has
    // since deselected, for instance.
    for (let step = 1; step <= 6; step += 1) {
      const validation = validateStep(step, draft.answers);
      if (!validation.ok) {
        return seeOther(`/onboarding/${step}?error=${encodeURIComponent(validation.message)}`);
      }
    }

    await completeOnboarding(scope);
    await recordAuditEvent({
      action: AUDIT_ACTIONS.firmConfigurationUpdated,
      firmId: firm.id,
      userId: session.user.id,
      resourceType: "firm_configuration",
      resourceId: firm.id,
      newValue: { status: "complete", configuration: buildConfiguration(draft.answers) },
    });

    return seeOther("/dashboard?configured=1");
  }

  const step = Number(formData.get("step") ?? 1);
  const intent = String(formData.get("intent") ?? "continue");

  if (!Number.isInteger(step) || step < 1 || step > ONBOARDING_STEP_COUNT) {
    return seeOther("/onboarding/1");
  }

  if (intent === "back") {
    return seeOther(`/onboarding/${Math.max(1, step - 1)}`);
  }

  const update: Parameters<typeof saveStep>[2] = {};

  switch (step) {
    case 1:
      update.firmName = String(formData.get("firmName") ?? "");
      update.contactName = String(formData.get("contactName") ?? "");
      update.contactEmail = String(formData.get("contactEmail") ?? "");
      update.userCount = Math.max(1, Number(formData.get("userCount") ?? 1) || 1);
      update.jurisdiction = String(formData.get("jurisdiction") ?? "NY");
      update.language = String(formData.get("language") ?? "en");
      update.currency = String(formData.get("currency") ?? "USD");
      update.timezone = String(formData.get("timezone") ?? "America/New_York");
      break;
    case 2:
      update.practiceAreas = stringList(formData, "practiceAreas");
      update.primaryPracticeArea = String(formData.get("primaryPracticeArea") ?? "");
      break;
    case 3:
      update.matterTypes = stringList(formData, "matterTypes");
      break;
    case 4:
      update.workflowStepIds = stringList(formData, "workflowStepIds");
      break;
    case 5:
      update.aiFeatureIds = stringList(formData, "aiFeatureIds");
      break;
    case 6:
      update.approvalKeys = stringList(formData, "approvalKeys");
      break;
    default:
      break;
  }

  // A draft may be incomplete — that is what a draft is. Moving forward may not.
  if (intent === "continue") {
    const validation = validateStep(step, update);
    if (!validation.ok) {
      return seeOther(`/onboarding/${step}?error=${encodeURIComponent(validation.message)}`);
    }
  }

  await saveStep(scope, step, update, buildApprovals);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.firmConfigurationUpdated,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "firm_configuration",
    resourceId: firm.id,
    newValue: { step, intent },
  });

  if (intent === "draft") {
    return seeOther(`/onboarding/${step}?saved=1`);
  }

  return seeOther(`/onboarding/${Math.min(ONBOARDING_STEP_COUNT, step + 1)}`);
}
