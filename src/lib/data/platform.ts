import "server-only";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { IS_DEMO } from "@/lib/app-config";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { buildApprovals } from "@/lib/onboarding/config";
import { type NewFirmInput, slugify, uniqueSlug } from "@/lib/platform/new-firm";

/**
 * Orchelio — the platform, as opposed to any one firm.
 *
 * Everything here is deliberately cross-firm, which is why it is in one module
 * with an obvious name rather than scattered through administration pages. A
 * reader auditing what can see across tenants has one file to read.
 *
 * Nothing here returns a matter title, a client name or a document. A platform
 * administrator operates the platform; that does not include reading a firm's
 * client files, and the way to keep that true is for the query never to ask.
 */

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** Every firm, with the counts an operator needs and nothing else. */
export async function listFirmsForAdministration() {
  return prisma.firm.findMany({
    orderBy: { name: "asc" },
    include: {
      configuration: { select: { onboardingStatus: true, onboardingStep: true } },
      _count: {
        select: {
          memberships: true,
          matters: true,
          documents: true,
          analyses: true,
          approvalRequests: true,
          auditEvents: true,
        },
      },
    },
  });
}

export type PlatformCounts = {
  firms: number;
  users: number;
  activeSessions: number;
  matters: number;
  documents: number;
  analyses: number;
  approvals: number;
  auditEvents: number;
};

/**
 * The totals across the instance.
 *
 * Summed from each firm's own counts rather than read with a cross-firm query,
 * and that is not a stylistic choice. `prisma.matter.count()` with no firm is
 * refused by the scoping guard, and the way to satisfy it — a filter that
 * matches every firm — would be a query that *looks* scoped and is not. A
 * bypass that a reader cannot see is worse than the count being awkward, so the
 * count is awkward: `_count` on `Firm` is a legitimate per-firm aggregate, and
 * addition is addition.
 */
export async function platformCounts(): Promise<PlatformCounts> {
  const [firms, users, activeSessions] = await Promise.all([
    listFirmsForAdministration(),
    prisma.user.count(),
    prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);

  const total = (pick: (counts: (typeof firms)[number]["_count"]) => number) =>
    firms.reduce((sum, firm) => sum + pick(firm._count), 0);

  return {
    firms: firms.length,
    users,
    activeSessions,
    matters: total((counts) => counts.matters),
    documents: total((counts) => counts.documents),
    analyses: total((counts) => counts.analyses),
    approvals: total((counts) => counts.approvalRequests),
    auditEvents: total((counts) => counts.auditEvents),
  };
}

// ---------------------------------------------------------------------------
// Creating a firm
// ---------------------------------------------------------------------------

export type CreatedFirm = {
  firmId: string;
  slug: string;
  name: string;
  administratorEmail: string;
  /** True when the account was invented here rather than already existing. */
  administratorCreated: boolean;
};

export type CreateFirmOutcome =
  | { ok: true; firm: CreatedFirm }
  | { ok: false; message: string };

/**
 * Creates a firm and its first administrator.
 *
 * The configuration row is written here, empty but for two things: the practice
 * area, and all nine locked approval rules. The rules are stored from the
 * firm's first second rather than from the moment it finishes the
 * questionnaire, because a firm that exists is a firm somebody can act in — and
 * `buildApprovals` is the same function onboarding uses, so there is no second
 * definition of what "locked" means.
 *
 * The firm is left in `onboarding` status with a draft configuration. It is not
 * a usable workspace until somebody answers the seven questions; saying so is
 * the screens' job, and pretending otherwise would be the alternative.
 */
export async function createFirm(input: NewFirmInput): Promise<CreateFirmOutcome> {
  const email = input.administratorEmail.trim().toLowerCase();

  const [existingSlugs, existingUser] = await Promise.all([
    prisma.firm.findMany({ select: { slug: true } }),
    prisma.user.findUnique({ where: { email } }),
  ]);

  // Inventing an account means choosing its password, and there is exactly one
  // password this build can choose honestly: the shared demonstration one,
  // already printed on the sign-in page. Anywhere else that would be a hole, and
  // the alternative — a generated password shown once — would have to travel
  // back to the screen through a URL, into browser history and the access log.
  // So outside the demonstration the firm still gets created, but its
  // administrator has to be somebody who already has an account.
  if (!existingUser && !IS_DEMO) {
    return {
      ok: false,
      message:
        `No account exists for ${email}, and this build cannot create one: it has no way to ` +
        "set a password without either sharing a known one or sending an invitation, and " +
        "Orchelio sends nothing. Create the account first, then name it here.",
    };
  }

  const slug = uniqueSlug(
    slugify(input.name),
    new Set(existingSlugs.map((firm) => firm.slug)),
  );

  const firm = await prisma.firm.create({
    data: {
      slug,
      name: input.name.trim(),
      primaryPracticeArea: input.primaryPracticeArea,
      status: "onboarding",
    },
  });

  await prisma.firmConfiguration.create({
    data: {
      firmId: firm.id,
      primaryPracticeArea: input.primaryPracticeArea,
      practiceAreas: JSON.stringify([input.primaryPracticeArea]),
      matterTypes: "[]",
      enabledWorkflows: "[]",
      aiFeatures: "[]",
      approvals: JSON.stringify(buildApprovals([])),
      contactName: input.administratorName.trim(),
      contactEmail: email,
      onboardingStatus: "draft",
      onboardingStep: 1,
    },
  });

  const administrator =
    existingUser ??
    (await prisma.user.create({
      data: {
        email,
        name: input.administratorName.trim(),
        passwordHash: await hashPassword(DEMO_PASSWORD),
        status: "active",
      },
    }));

  await prisma.firmMembership.upsert({
    where: { userId_firmId: { userId: administrator.id, firmId: firm.id } },
    update: { role: "firm_admin", status: "active" },
    create: { userId: administrator.id, firmId: firm.id, role: "firm_admin", status: "active" },
  });

  return {
    ok: true,
    firm: {
      firmId: firm.id,
      slug: firm.slug,
      name: firm.name,
      administratorEmail: email,
      administratorCreated: existingUser === null,
    },
  };
}
