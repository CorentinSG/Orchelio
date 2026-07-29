import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";
import { type FirmRole, isFirmRole } from "@/lib/auth/permissions";
import { parseJsonObject } from "@/lib/json-field";
import { aiFeatureKeysFor, buildApprovals } from "@/lib/onboarding/config";
import {
  type Branding,
  configurableApprovalKeys,
  isAccentColour,
  parseBranding,
  type ProfileUpdate,
} from "@/lib/settings/config";

/**
 * Orchelio — writing a firm's settings.
 *
 * Every function here changes the same `FirmConfiguration` the onboarding
 * questionnaire writes, through the same pure builders, so the two cannot end
 * up disagreeing about what a valid configuration looks like. In particular
 * `buildApprovals` is used unchanged: it writes in all nine locked rules
 * whatever arrived, which is why there is no code path in settings that could
 * turn one off.
 *
 * The primary practice area is deliberately absent. Changing it re-derives the
 * matter types, the workflow vocabulary, the AI feature keys and the dashboard
 * widgets — that is the questionnaire's job, and settings links to it instead
 * of half-doing it.
 */

export async function updateProfile(scope: FirmScope, update: ProfileUpdate): Promise<void> {
  await prisma.firm.update({
    where: { id: scope.firmId },
    data: { name: update.firmName.trim() },
  });

  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: {
      contactName: update.contactName.trim(),
      contactEmail: update.contactEmail.trim(),
      userCount: update.userCount,
      jurisdiction: update.jurisdiction,
      language: update.language,
      currency: update.currency,
      timezone: update.timezone,
    },
  });
}

export async function updateMatterTypes(scope: FirmScope, keys: readonly string[]): Promise<void> {
  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: { matterTypes: JSON.stringify([...keys]) },
  });
}

/**
 * Saves the AI features.
 *
 * The form submits checkbox ids; what is stored is the practice-area
 * vocabulary, exactly as the questionnaire stores it — `timeline` at an
 * immigration firm, `employment_timeline` at an employment one.
 */
export async function updateAiFeatures(
  scope: FirmScope,
  featureIds: readonly string[],
): Promise<void> {
  const configuration = await prisma.firmConfiguration.findFirst({
    where: { firmId: scope.firmId },
    select: { primaryPracticeArea: true },
  });
  if (!configuration) return;

  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: {
      aiFeatures: JSON.stringify(aiFeatureKeysFor(featureIds, configuration.primaryPracticeArea)),
    },
  });
}

/**
 * Saves the approval rules.
 *
 * Two filters, not one. `configurableApprovalKeys` drops anything that is not a
 * rule a firm may choose, and `buildApprovals` then writes every locked rule in
 * as required. A request naming `permanentDeletion: false` therefore results in
 * `permanentDeletion: true` being stored — not an error, which would imply the
 * request was close to working.
 */
export async function updateApprovals(scope: FirmScope, keys: readonly string[]): Promise<void> {
  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: { approvals: JSON.stringify(buildApprovals(configurableApprovalKeys(keys))) },
  });
}

export async function readBranding(scope: FirmScope): Promise<Branding> {
  const configuration = await prisma.firmConfiguration.findFirst({
    where: { firmId: scope.firmId },
    select: { branding: true },
  });
  return parseBranding(parseJsonObject(configuration?.branding));
}

export async function updateBranding(
  scope: FirmScope,
  displayName: string,
  accent: string,
): Promise<void> {
  const branding: Branding = {
    displayName: displayName.trim().slice(0, 80),
    accent: isAccentColour(accent) ? accent : "default",
  };

  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: { branding: JSON.stringify(branding) },
  });
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/** Every member of the firm, suspended ones included. */
export async function allFirmMembers(scope: FirmScope) {
  return prisma.firmMembership.findMany({
    where: { firmId: scope.firmId },
    include: { user: { select: { id: true, name: true, email: true, lastLoginAt: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export type MembershipChange =
  | { ok: true }
  | { ok: false; message: string };

/**
 * How many people can still administer this firm if the given membership stops
 * being able to.
 *
 * A firm that demotes or suspends its last administrator has locked itself out
 * of its own settings, and — because a platform administrator holds no
 * membership by design — there is nobody left who can undo it. So the change is
 * refused. This is the one place where the product declines an instruction from
 * somebody entitled to give it, and the refusal says why.
 */
async function otherActiveAdministrators(
  scope: FirmScope,
  membershipId: string,
): Promise<number> {
  return prisma.firmMembership.count({
    where: {
      firmId: scope.firmId,
      role: "firm_admin",
      status: "active",
      id: { not: membershipId },
    },
  });
}

export async function updateMemberRole(
  scope: FirmScope,
  membershipId: string,
  role: string,
): Promise<MembershipChange> {
  if (!isFirmRole(role)) {
    return { ok: false, message: "That is not a role this firm has." };
  }

  const membership = await prisma.firmMembership.findFirst({
    where: { id: membershipId, firmId: scope.firmId },
  });
  if (!membership) {
    return { ok: false, message: "That person is not a member of this firm." };
  }

  if (membership.role === "firm_admin" && role !== "firm_admin") {
    const remaining = await otherActiveAdministrators(scope, membershipId);
    if (remaining === 0) {
      return {
        ok: false,
        message:
          "This is the firm's only administrator. Give somebody else that role first, or the firm would have nobody who can change its settings.",
      };
    }
  }

  await prisma.firmMembership.updateMany({
    where: { id: membershipId, firmId: scope.firmId },
    data: { role: role satisfies FirmRole },
  });

  return { ok: true };
}

export async function updateMemberStatus(
  scope: FirmScope,
  membershipId: string,
  status: string,
): Promise<MembershipChange> {
  if (status !== "active" && status !== "suspended") {
    return { ok: false, message: "A membership is either active or suspended." };
  }

  const membership = await prisma.firmMembership.findFirst({
    where: { id: membershipId, firmId: scope.firmId },
  });
  if (!membership) {
    return { ok: false, message: "That person is not a member of this firm." };
  }

  if (status === "suspended" && membership.role === "firm_admin") {
    const remaining = await otherActiveAdministrators(scope, membershipId);
    if (remaining === 0) {
      return {
        ok: false,
        message:
          "This is the firm's only administrator. Suspending them would leave nobody who can change the firm's settings.",
      };
    }
  }

  await prisma.firmMembership.updateMany({
    where: { id: membershipId, firmId: scope.firmId },
    data: { status },
  });

  return { ok: true };
}
