/**
 * Orchelio — roles and permissions.
 *
 * Roles are coarse; permissions are fine. Screens ask "may this actor do X?",
 * never "is this actor an attorney?", so adding a role later does not mean
 * hunting for role checks scattered across the codebase.
 *
 * This module is pure data and pure functions: no database, no request context.
 * That makes the whole permission matrix unit-testable, which is the only way
 * to be confident it says what it is meant to say.
 */

// --- Roles ----------------------------------------------------------------

export const FIRM_ROLES = ["firm_admin", "attorney", "paralegal", "read_only"] as const;
export type FirmRole = (typeof FIRM_ROLES)[number];

export function isFirmRole(value: string): value is FirmRole {
  return (FIRM_ROLES as readonly string[]).includes(value);
}

export const ROLE_LABELS: Record<FirmRole, string> = {
  firm_admin: "Firm Administrator",
  attorney: "Attorney",
  paralegal: "Paralegal",
  read_only: "Read-only Reviewer",
};

export const PLATFORM_ADMIN_LABEL = "Platform Administrator";

// --- Permissions ----------------------------------------------------------

export const PERMISSIONS = [
  // Firm administration
  "firm.settings.view",
  "firm.settings.edit",
  "firm.users.manage",
  "firm.workflows.manage",
  "firm.costs.view",
  "firm.audit.view",

  // Matters
  "matter.view",
  "matter.create",
  "matter.edit",
  "matter.close",

  // Intake and clients
  "client.create",
  "intake.complete",

  // Documents
  "document.view",
  "document.upload",
  "document.classify",

  // Artificial intelligence
  "ai.analysis.run",
  "ai.review.run",
  "ai.result.view",

  // Human decisions
  "approval.view",
  "approval.decide",

  // Communications
  "communication.draft",

  // Deadlines
  "deadline.confirm",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * What each firm role may do.
 *
 * Deliberate exclusions, taken straight from the specification:
 *   * A paralegal may prepare work but may not approve a legal analysis,
 *     confirm a deadline, close a matter or draft an outgoing communication.
 *   * A read-only reviewer may look and nothing else.
 *   * No role can send anything: Orchelio has no send capability at all.
 */
const ROLE_PERMISSIONS: Record<FirmRole, readonly Permission[]> = {
  firm_admin: [
    "firm.settings.view",
    "firm.settings.edit",
    "firm.users.manage",
    "firm.workflows.manage",
    "firm.costs.view",
    "firm.audit.view",
    "matter.view",
    "matter.create",
    "matter.edit",
    "matter.close",
    "client.create",
    "intake.complete",
    "document.view",
    "document.upload",
    "document.classify",
    "ai.analysis.run",
    "ai.review.run",
    "ai.result.view",
    "approval.view",
    "approval.decide",
    "communication.draft",
    "deadline.confirm",
  ],
  attorney: [
    "firm.settings.view",
    "firm.costs.view",
    "matter.view",
    "matter.create",
    "matter.edit",
    "matter.close",
    "client.create",
    "intake.complete",
    "document.view",
    "document.upload",
    "document.classify",
    "ai.analysis.run",
    "ai.review.run",
    "ai.result.view",
    "approval.view",
    "approval.decide",
    "communication.draft",
    "deadline.confirm",
  ],
  paralegal: [
    "matter.view",
    "client.create",
    "intake.complete",
    "document.view",
    "document.upload",
    "document.classify",
    "ai.analysis.run",
    "ai.result.view",
    "approval.view",
  ],
  read_only: ["matter.view", "document.view", "ai.result.view", "approval.view"],
};

/**
 * What a platform administrator may do.
 *
 * Intentionally narrow. Operating the platform does not imply reading a firm's
 * client matters, so matter and document content are absent from this list.
 */
const PLATFORM_ADMIN_PERMISSIONS: readonly Permission[] = ["firm.settings.view"];

export type Actor = {
  userId: string;
  isPlatformAdmin: boolean;
  /** The role held in the firm currently in context, if any. */
  role: FirmRole | null;
};

/** Does this actor hold the given permission in the current context? */
export function can(actor: Actor, permission: Permission): boolean {
  if (actor.role && ROLE_PERMISSIONS[actor.role].includes(permission)) {
    return true;
  }
  return actor.isPlatformAdmin && PLATFORM_ADMIN_PERMISSIONS.includes(permission);
}

/** Every permission the actor holds. Used to render a menu without guessing. */
export function permissionsFor(actor: Actor): Permission[] {
  const granted = new Set<Permission>();
  if (actor.role) {
    for (const permission of ROLE_PERMISSIONS[actor.role]) granted.add(permission);
  }
  if (actor.isPlatformAdmin) {
    for (const permission of PLATFORM_ADMIN_PERMISSIONS) granted.add(permission);
  }
  return [...granted];
}

export function roleLabel(role: FirmRole | null, isPlatformAdmin: boolean): string {
  if (role) return ROLE_LABELS[role];
  return isPlatformAdmin ? PLATFORM_ADMIN_LABEL : "No access";
}
