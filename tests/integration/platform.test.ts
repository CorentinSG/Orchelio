// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TwoFirmFixture, createTwoFirmFixture } from "./fixtures";
import { LOCKED_APPROVALS } from "../../src/lib/constants";

/**
 * Orchelio — creating a third firm, against a real database.
 *
 * This is the phase's acceptance criterion at the layer where it can be
 * checked exactly. The browser test proves a person can do it; this proves what
 * they end up with — a firm that is isolated from the two that already existed,
 * carrying all nine locked approval rules from its first second, and containing
 * nothing.
 *
 * "Containing nothing" is worth asserting rather than assuming. A new tenant
 * that could see an existing one's matters would be the single worst defect
 * this product could have, and it would look like success from every screen.
 */

let fixture: TwoFirmFixture;
let platform: typeof import("@/lib/data/platform");
let demo: typeof import("@/lib/data/demo");
let matters: typeof import("@/lib/data/matters");

beforeAll(async () => {
  fixture = await createTwoFirmFixture();
  platform = await import("@/lib/data/platform");
  demo = await import("@/lib/data/demo");
  matters = await import("@/lib/data/matters");
}, 180_000);

afterAll(async () => {
  await fixture?.dispose();
});

const NEW_FIRM = {
  name: "Rivera Immigration Group",
  primaryPracticeArea: "immigration",
  administratorName: "Dana Rivera",
  administratorEmail: "dana@rivera.local",
};

describe("creating a firm", () => {
  it("creates the firm, its configuration and its first administrator", async () => {
    const outcome = await platform.createFirm(NEW_FIRM);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.firm.slug).toBe("rivera-immigration-group");
    expect(outcome.firm.administratorCreated).toBe(true);

    const firm = await fixture.prisma.firm.findUnique({ where: { id: outcome.firm.firmId } });
    expect(firm?.status).toBe("onboarding");
    expect(firm?.primaryPracticeArea).toBe("immigration");

    const membership = await fixture.prisma.firmMembership.findFirst({
      where: { firmId: outcome.firm.firmId },
      include: { user: true },
    });
    expect(membership?.role).toBe("firm_admin");
    expect(membership?.status).toBe("active");
    expect(membership?.user.email).toBe("dana@rivera.local");
  });

  it("carries all nine locked approval rules from the first second", async () => {
    // Not from the moment the questionnaire is finished: a firm that exists is
    // a firm somebody can act in.
    const firm = await fixture.prisma.firm.findFirst({
      where: { slug: "rivera-immigration-group" },
    });
    const configuration = await fixture.prisma.firmConfiguration.findFirst({
      where: { firmId: firm!.id },
    });

    const approvals = JSON.parse(configuration?.approvals ?? "{}") as Record<string, boolean>;
    for (const locked of LOCKED_APPROVALS) {
      expect(approvals[locked], `${locked} missing from a new firm`).toBe(true);
    }

    expect(configuration?.onboardingStatus).toBe("draft");
    expect(configuration?.onboardingStep).toBe(1);
  });

  it("leaves the new firm empty, and blind to the firms that already existed", async () => {
    const firm = await fixture.prisma.firm.findFirst({
      where: { slug: "rivera-immigration-group" },
    });
    const scope = { firmId: firm!.id };

    expect(await matters.listMatters(scope)).toEqual([]);
    expect(await fixture.prisma.document.count({ where: { firmId: firm!.id } })).toBe(0);
    expect(await fixture.prisma.clientProfile.count({ where: { firmId: firm!.id } })).toBe(0);

    // The existing firms' matters exist and are not reachable from the new one.
    const theirs = await matters.getMatter({
      firmId: firm!.id,
      matterId: fixture.immigration.matterId,
    });
    expect(theirs).toBeNull();
  });

  it("gives a second firm of the same name a different identifier", async () => {
    const outcome = await platform.createFirm({ ...NEW_FIRM, administratorEmail: "b@rivera.local" });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.firm.slug).toBe("rivera-immigration-group-2");
  });

  it("adds an existing account to the new firm rather than refusing", async () => {
    const outcome = await platform.createFirm({
      name: "Second Chair Law",
      primaryPracticeArea: "employment_law",
      administratorName: "Existing Person",
      administratorEmail: "dana@rivera.local",
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.firm.administratorCreated).toBe(false);

    // Asked firm by firm rather than "every membership this person holds": the
    // scoping guard refuses the second shape, and rightly — it is a cross-firm
    // read, and this assertion does not need one.
    const original = await fixture.prisma.firm.findFirst({
      where: { slug: "rivera-immigration-group" },
    });

    for (const firmId of [original!.id, outcome.firm.firmId]) {
      const membership = await fixture.prisma.firmMembership.findFirst({
        where: { firmId, user: { email: "dana@rivera.local" } },
      });
      expect(membership?.role).toBe("firm_admin");
    }
  });
});

describe("platform counts", () => {
  it("adds up the firms' own totals", async () => {
    const counts = await platform.platformCounts();
    const firms = await platform.listFirmsForAdministration();

    expect(counts.firms).toBe(firms.length);
    expect(counts.matters).toBe(firms.reduce((sum, firm) => sum + firm._count.matters, 0));
    // The fixture's two firms each hold one matter; the new ones hold none.
    expect(counts.matters).toBe(2);
  });

  it("names no matter, client or document", async () => {
    // The shape of the answer is the guarantee: a platform administrator's
    // screen cannot show what its query never asked for.
    const firms = await platform.listFirmsForAdministration();
    const serialised = JSON.stringify(firms);

    expect(serialised).not.toContain("Alex Rivera");
    expect(serialised).not.toContain("identity-document.pdf");
    expect(serialised).not.toContain("Initial consultation");
  });
});

describe("adding sample matters", () => {
  it("adds them to the firm that asked and to no other", async () => {
    const firm = await fixture.prisma.firm.findFirst({
      where: { slug: "rivera-immigration-group" },
    });
    const scope = { firmId: firm!.id };

    // The sample matters only appear for matter types the firm handles, so the
    // firm has to say it handles them first.
    await fixture.prisma.firmConfiguration.updateMany({
      where: { firmId: firm!.id },
      data: { matterTypes: JSON.stringify(["family_based", "employment_based", "naturalisation"]) },
    });

    const administrator = await fixture.prisma.firmMembership.findFirst({
      where: { firmId: firm!.id },
    });

    const before = await fixture.prisma.matter.count({ where: { firmId: fixture.immigration.firmId } });
    const result = await demo.addSampleMatters(scope, administrator!.userId);

    expect(result.created.length).toBeGreaterThan(0);
    expect(result.skipped).toEqual([]);

    const added = await matters.listMatters(scope);
    expect(added).toHaveLength(result.created.length);

    // The other firm is untouched, including the matter that shares a reference.
    const after = await fixture.prisma.matter.count({ where: { firmId: fixture.immigration.firmId } });
    expect(after).toBe(before);
  });

  it("is additive: running it twice adds nothing and destroys nothing", async () => {
    const firm = await fixture.prisma.firm.findFirst({
      where: { slug: "rivera-immigration-group" },
    });
    const scope = { firmId: firm!.id };
    const administrator = await fixture.prisma.firmMembership.findFirst({
      where: { firmId: firm!.id },
    });

    const inventoryBefore = await demo.demonstrationInventory(scope);
    const result = await demo.addSampleMatters(scope, administrator!.userId);

    expect(result.created).toEqual([]);
    expect(result.skipped.length).toBeGreaterThan(0);
    expect(await demo.demonstrationInventory(scope)).toEqual(inventoryBefore);
  });

  it("reports the matters it did not offer rather than dropping them silently", async () => {
    const firm = await fixture.prisma.firm.findFirst({ where: { slug: "second-chair-law" } });
    const scope = { firmId: firm!.id };

    // An employment firm that has switched on only one matter type.
    await fixture.prisma.firmConfiguration.updateMany({
      where: { firmId: firm!.id },
      data: { matterTypes: JSON.stringify(["unpaid_wages"]) },
    });

    const administrator = await fixture.prisma.firmMembership.findFirst({
      where: { firmId: firm!.id },
    });
    const result = await demo.addSampleMatters(scope, administrator!.userId);

    expect(result.created).toHaveLength(1);
    expect(result.notOffered.length).toBeGreaterThan(0);
  });

  it("gives a new firm the same fictional matters, under its own identifiers", async () => {
    const ours = await fixture.prisma.firm.findFirst({
      where: { slug: "rivera-immigration-group" },
    });
    const mine = await matters.listMatters({ firmId: ours!.id });
    const theirs = await matters.listMatters({ firmId: fixture.immigration.firmId });

    // Same reference, different row, different firm. That the unique constraint
    // is per firm rather than global is what makes this possible.
    const shared = mine.filter((matter) =>
      theirs.some((other) => other.reference === matter.reference),
    );
    for (const matter of shared) {
      const other = theirs.find((candidate) => candidate.reference === matter.reference)!;
      expect(matter.id).not.toBe(other.id);
    }
  });
});
