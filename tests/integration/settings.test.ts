// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TwoFirmFixture, createTwoFirmFixture } from "./fixtures";
import { LOCKED_APPROVALS } from "../../src/lib/constants";

/**
 * Orchelio — firm settings, against a real database.
 *
 * Three questions a unit test cannot answer:
 *
 *  1. Does saving a setting for one firm leave the other firm's untouched?
 *  2. Do the nine locked rules survive a request that names them?
 *  3. Can a firm lock itself out by demoting its last administrator?
 *
 * The third is the one that would otherwise be found by a user rather than by
 * a test — a platform administrator holds no membership, so there would be
 * nobody left able to undo it.
 */

let fixture: TwoFirmFixture;
let settings: typeof import("@/lib/data/settings");

beforeAll(async () => {
  fixture = await createTwoFirmFixture();
  settings = await import("@/lib/data/settings");
}, 180_000);

afterAll(async () => {
  await fixture?.dispose();
});

function scope(firmId: string) {
  return { firmId };
}

async function configurationOf(firmId: string) {
  return fixture.prisma.firmConfiguration.findFirst({ where: { firmId } });
}

describe("saving a setting", () => {
  it("changes one firm and not the other", async () => {
    await settings.updateProfile(scope(fixture.immigration.firmId), {
      firmName: "Renamed Immigration Law",
      contactName: "Claire Dupont",
      contactEmail: "claire@test.local",
      userCount: 9,
      jurisdiction: "CA",
      language: "en",
      currency: "EUR",
      timezone: "America/Los_Angeles",
    });

    const changed = await configurationOf(fixture.immigration.firmId);
    const untouched = await configurationOf(fixture.employment.firmId);

    expect(changed?.contactEmail).toBe("claire@test.local");
    expect(changed?.currency).toBe("EUR");
    expect(untouched?.contactEmail).toBeNull();
    expect(untouched?.currency).toBe("USD");

    const firm = await fixture.prisma.firm.findUnique({
      where: { id: fixture.immigration.firmId },
    });
    expect(firm?.name).toBe("Renamed Immigration Law");
  });

  it("stores AI features in the firm's own practice-area vocabulary", async () => {
    // The same question, two firms, two different stored keys. That is the
    // whole point of the vocabulary mapping, and it is decided by the firm's
    // configuration rather than by what the form sent.
    await settings.updateAiFeatures(scope(fixture.immigration.firmId), ["timeline"]);
    await settings.updateAiFeatures(scope(fixture.employment.firmId), ["timeline"]);

    const immigration = await configurationOf(fixture.immigration.firmId);
    const employment = await configurationOf(fixture.employment.firmId);

    expect(JSON.parse(immigration?.aiFeatures ?? "[]")).toEqual(["timeline"]);
    expect(JSON.parse(employment?.aiFeatures ?? "[]")).toEqual(["employment_timeline"]);
  });

  it("keeps the matter types it was given, and only for that firm", async () => {
    await settings.updateMatterTypes(scope(fixture.immigration.firmId), ["family_based"]);

    const immigration = await configurationOf(fixture.immigration.firmId);
    const employment = await configurationOf(fixture.employment.firmId);

    expect(JSON.parse(immigration?.matterTypes ?? "[]")).toEqual(["family_based"]);
    expect(JSON.parse(employment?.matterTypes ?? "[]")).toEqual(["unpaid_wages"]);
  });
});

describe("the nine locked rules", () => {
  it("are stored as required even when the request names none of them", async () => {
    await settings.updateApprovals(scope(fixture.immigration.firmId), [], false);

    const stored = JSON.parse(
      (await configurationOf(fixture.immigration.firmId))?.approvals ?? "{}",
    ) as Record<string, boolean>;

    for (const locked of LOCKED_APPROVALS) {
      expect(stored[locked], `${locked} was not written in`).toBe(true);
    }
  });

  it("survive a request that tries to switch every one of them off", async () => {
    // The hostile case, written the way a hand-crafted POST would arrive: every
    // locked key submitted as if it were a firm's own choice. The result must be
    // indistinguishable from the honest request above.
    await settings.updateApprovals(scope(fixture.immigration.firmId), [...LOCKED_APPROVALS], false);

    const stored = JSON.parse(
      (await configurationOf(fixture.immigration.firmId))?.approvals ?? "{}",
    ) as Record<string, boolean>;

    for (const locked of LOCKED_APPROVALS) {
      expect(stored[locked], `${locked} was switched off`).toBe(true);
    }
  });

  it("do not swallow the firm's own choices", async () => {
    await settings.updateApprovals(scope(fixture.employment.firmId), ["sendEmail", "closeMatter"], false);

    const stored = JSON.parse(
      (await configurationOf(fixture.employment.firmId))?.approvals ?? "{}",
    ) as Record<string, boolean>;

    expect(stored["sendEmail"]).toBe(true);
    expect(stored["closeMatter"]).toBe(true);
    expect(stored["legalAnalysis"]).toBeUndefined();
    expect(stored["permanentDeletion"]).toBe(true);
  });
});

describe("branding", () => {
  it("round-trips, per firm", async () => {
    await settings.updateBranding(scope(fixture.immigration.firmId), "Dupont Law", "teal");

    expect(await settings.readBranding(scope(fixture.immigration.firmId))).toEqual({
      displayName: "Dupont Law",
      accent: "teal",
    });
    expect(await settings.readBranding(scope(fixture.employment.firmId))).toEqual({
      displayName: "",
      accent: "default",
    });
  });

  it("stores the default rather than an accent outside the palette", async () => {
    await settings.updateBranding(
      scope(fixture.employment.firmId),
      "Carter",
      "url(javascript:alert(1))",
    );

    expect(await settings.readBranding(scope(fixture.employment.firmId))).toEqual({
      displayName: "Carter",
      accent: "default",
    });
  });
});

describe("people", () => {
  it("lists this firm's members and no others", async () => {
    const members = await settings.allFirmMembers(scope(fixture.immigration.firmId));
    expect(members).toHaveLength(1);
    expect(members[0]?.user.id).toBe(fixture.immigration.attorneyId);
  });

  it("refuses a membership from another firm", async () => {
    const theirs = await fixture.prisma.firmMembership.findFirst({
      where: { firmId: fixture.employment.firmId },
    });
    expect(theirs).not.toBeNull();

    const result = await settings.updateMemberRole(
      scope(fixture.immigration.firmId),
      theirs!.id,
      "read_only",
    );

    expect(result.ok).toBe(false);
    // The refusal is worded as "not a member of this firm", exactly as it would
    // be for an identifier that does not exist anywhere — it does not confirm
    // that the other firm's membership is real.
    if (!result.ok) expect(result.message).toContain("not a member of this firm");

    const unchanged = await fixture.prisma.firmMembership.findFirst({
      where: { id: theirs!.id, firmId: fixture.employment.firmId },
    });
    expect(unchanged?.role).toBe("attorney");
  });

  it("refuses a role the firm does not have", async () => {
    const [membership] = await settings.allFirmMembers(scope(fixture.immigration.firmId));
    const result = await settings.updateMemberRole(
      scope(fixture.immigration.firmId),
      membership!.id,
      "platform_admin",
    );
    expect(result.ok).toBe(false);
  });

  it("will not let a firm demote its last administrator", async () => {
    const [membership] = await settings.allFirmMembers(scope(fixture.immigration.firmId));
    await settings.updateMemberRole(scope(fixture.immigration.firmId), membership!.id, "firm_admin");

    const result = await settings.updateMemberRole(
      scope(fixture.immigration.firmId),
      membership!.id,
      "paralegal",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("only administrator");

    const after = await fixture.prisma.firmMembership.findFirst({
      where: { id: membership!.id, firmId: fixture.immigration.firmId },
    });
    expect(after?.role).toBe("firm_admin");
  });

  it("will not let a firm suspend its last administrator either", async () => {
    const [membership] = await settings.allFirmMembers(scope(fixture.immigration.firmId));
    const result = await settings.updateMemberStatus(
      scope(fixture.immigration.firmId),
      membership!.id,
      "suspended",
    );

    expect(result.ok).toBe(false);

    const after = await fixture.prisma.firmMembership.findFirst({
      where: { id: membership!.id, firmId: fixture.immigration.firmId },
    });
    expect(after?.status).toBe("active");
  });

  it("allows the demotion once somebody else can administer the firm", async () => {
    const second = await fixture.prisma.user.create({
      data: {
        email: "second.admin@test.local",
        name: "Second Administrator",
        passwordHash: "scrypt$16384$8$1$AAAA$AAAA",
      },
    });
    await fixture.prisma.firmMembership.create({
      data: {
        userId: second.id,
        firmId: fixture.immigration.firmId,
        role: "firm_admin",
        status: "active",
      },
    });

    const members = await settings.allFirmMembers(scope(fixture.immigration.firmId));
    const original = members.find((member) => member.user.id === fixture.immigration.attorneyId);

    const result = await settings.updateMemberRole(
      scope(fixture.immigration.firmId),
      original!.id,
      "paralegal",
    );

    expect(result).toEqual({ ok: true });
  });
});

describe("switching separation of duties on", () => {
  it("is refused while only one person may decide", async () => {
    // The fixture firm has one attorney. Turning the rule on would make every
    // request they raise undecidable — including by them.
    const result = await settings.updateApprovals(scope(fixture.employment.firmId), [], true);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/indécidable/i);

    const stored = await configurationOf(fixture.employment.firmId);
    expect(stored?.requireSeparateApprover).toBe(false);
  });

  it("does not silently save the other approval rules when it refuses", async () => {
    // A partial save would be worse than a refusal: the administrator would
    // believe the whole form applied.
    const before = await configurationOf(fixture.employment.firmId);
    await settings.updateApprovals(scope(fixture.employment.firmId), ["prepareFiling"], true);
    const after = await configurationOf(fixture.employment.firmId);

    expect(after?.approvals).toBe(before?.approvals);
  });

  it("is allowed once a second person may decide", async () => {
    const second = await fixture.prisma.user.create({
      data: {
        email: "second.decider@test.local",
        name: "Second Decider",
        passwordHash: "scrypt$16384$8$1$AAAA$AAAA",
      },
    });
    await fixture.prisma.firmMembership.create({
      data: {
        userId: second.id,
        firmId: fixture.employment.firmId,
        role: "attorney",
        status: "active",
      },
    });

    const result = await settings.updateApprovals(scope(fixture.employment.firmId), [], true);
    expect(result).toEqual({ ok: true });
    expect((await configurationOf(fixture.employment.firmId))?.requireSeparateApprover).toBe(true);
  });

  it("counts only people who may actually decide", async () => {
    // A paralegal and a read-only reviewer do not hold `approval.decide`, so
    // adding them does not make the rule workable.
    const before = await settings.countDeciders(scope(fixture.immigration.firmId));

    for (const [index, role] of ["paralegal", "read_only"].entries()) {
      const user = await fixture.prisma.user.create({
        data: {
          email: `non-decider-${index}@test.local`,
          name: `Not A Decider ${index}`,
          passwordHash: "scrypt$16384$8$1$AAAA$AAAA",
        },
      });
      await fixture.prisma.firmMembership.create({
        data: { userId: user.id, firmId: fixture.immigration.firmId, role, status: "active" },
      });
    }

    expect(await settings.countDeciders(scope(fixture.immigration.firmId))).toBe(before);
  });

  it("does not count a suspended member", async () => {
    const suspended = await fixture.prisma.user.create({
      data: {
        email: "suspended.attorney@test.local",
        name: "Suspended Attorney",
        passwordHash: "scrypt$16384$8$1$AAAA$AAAA",
      },
    });
    const before = await settings.countDeciders(scope(fixture.immigration.firmId));

    await fixture.prisma.firmMembership.create({
      data: {
        userId: suspended.id,
        firmId: fixture.immigration.firmId,
        role: "attorney",
        status: "suspended",
      },
    });

    expect(await settings.countDeciders(scope(fixture.immigration.firmId))).toBe(before);
  });
});
