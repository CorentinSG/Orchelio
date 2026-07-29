import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { isSameOrigin, seeOther } from "@/lib/http/form-post";
import {
  updateAiFeatures,
  updateApprovals,
  updateBranding,
  updateMatterTypes,
  updateProfile,
} from "@/lib/data/settings";
import { isSettingsSection, validateProfile } from "@/lib/settings/config";

/**
 * Orchelio — saving a firm's settings.
 *
 * A plain form POST answered with a 303, like every other consequential form in
 * Orchelio. See src/lib/http/form-post.ts for the two bugs that decided it.
 *
 * Each section saves on its own. An administrator changing an AI feature does
 * not resubmit the firm's name, which means a stale tab cannot quietly revert
 * something somebody else changed in another one.
 */

function stringList(formData: FormData, name: string): string[] {
  return formData.getAll(name).map((value) => String(value));
}

function back(section: string, query = ""): string {
  return `/settings?section=${encodeURIComponent(section)}${query}`;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return seeOther("/403");
  }

  const session = await currentSession();
  if (!session) {
    return seeOther("/login?next=%2Fsettings");
  }

  const firm = await activeFirmFor(session);
  if (!firm) {
    return seeOther("/403");
  }

  // Reading the settings is an attorney's right; changing what the firm *is*
  // belongs to an administrator. The page renders read-only for everyone else,
  // and this is the check that makes that more than a presentation choice.
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
  const section = String(formData.get("section") ?? "");

  if (!isSettingsSection(section)) {
    return seeOther("/settings");
  }

  switch (section) {
    case "profile": {
      const update = {
        firmName: String(formData.get("firmName") ?? ""),
        contactName: String(formData.get("contactName") ?? ""),
        contactEmail: String(formData.get("contactEmail") ?? ""),
        userCount: Math.max(1, Number(formData.get("userCount") ?? 1) || 1),
        jurisdiction: String(formData.get("jurisdiction") ?? "NY"),
        language: String(formData.get("language") ?? "en"),
        currency: String(formData.get("currency") ?? "USD"),
        timezone: String(formData.get("timezone") ?? "America/New_York"),
      };

      const validation = validateProfile(update);
      if (!validation.ok) {
        return seeOther(back(section, `&error=${encodeURIComponent(validation.message)}`));
      }

      await updateProfile(scope, update);
      break;
    }

    case "matter-types":
      await updateMatterTypes(scope, stringList(formData, "matterTypes"));
      break;

    case "ai":
      await updateAiFeatures(scope, stringList(formData, "aiFeatureIds"));
      break;

    case "approvals":
      // Whatever arrives, the nine locked rules are written back in as
      // required. A submission naming one of them is not rejected — it simply
      // has no effect, because there is no state in which it could.
      await updateApprovals(scope, stringList(formData, "approvalKeys"));
      break;

    case "branding":
      await updateBranding(
        scope,
        String(formData.get("displayName") ?? ""),
        String(formData.get("accent") ?? "default"),
      );
      break;

    default:
      return seeOther("/settings");
  }

  await recordAuditEvent({
    action: AUDIT_ACTIONS.firmConfigurationUpdated,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "firm_configuration",
    resourceId: firm.id,
    newValue: { section, via: "settings" },
  });

  return seeOther(back(section, "&saved=1"));
}
