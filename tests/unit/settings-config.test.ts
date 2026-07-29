import { describe, expect, it } from "vitest";

import {
  ACCENT_COLOURS,
  SETTINGS_SECTIONS,
  configurableApprovalKeys,
  firmDisplayName,
  isSettingsSection,
  parseBranding,
  settingsSection,
  validateProfile,
} from "@/lib/settings/config";
import { LOCKED_APPROVALS, CONFIGURABLE_APPROVALS } from "@/lib/constants";
import { buildApprovals } from "@/lib/onboarding/config";

/**
 * Orchelio — the rules behind the settings screen.
 *
 * Two of these are the point of the file. A locked rule submitted by a hostile
 * form must have no effect, and branding must not be able to put an arbitrary
 * value into a `style` attribute. Both are checked by giving them exactly what
 * an attacker would.
 */

describe("sections", () => {
  it("has a section for every part of the specification", () => {
    const slugs = SETTINGS_SECTIONS.map((section) => section.slug);
    expect(slugs).toEqual([
      "profile",
      "matter-types",
      "ai",
      "approvals",
      "people",
      "branding",
      "demonstration",
    ]);
  });

  it("gives every section a distinct slug", () => {
    const slugs = SETTINGS_SECTIONS.map((section) => section.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("falls back to the first section rather than showing nothing", () => {
    expect(settingsSection(undefined).slug).toBe("profile");
    expect(settingsSection("not-a-section").slug).toBe("profile");
    expect(isSettingsSection("not-a-section")).toBe(false);
    expect(isSettingsSection("branding")).toBe(true);
  });
});

describe("approval rules", () => {
  it("keeps the rules a firm may choose", () => {
    expect(configurableApprovalKeys(["sendEmail", "closeMatter"])).toEqual([
      "sendEmail",
      "closeMatter",
    ]);
  });

  it("drops a locked rule submitted by a form", () => {
    // Every locked rule, sent as if the firm had ticked it off and on.
    expect(configurableApprovalKeys([...LOCKED_APPROVALS])).toEqual([]);
  });

  it("drops a key that is not an approval rule at all", () => {
    expect(configurableApprovalKeys(["__proto__", "isPlatformAdmin", ""])).toEqual([]);
  });

  it("still stores every locked rule as required after a hostile submission", () => {
    // The whole chain: a submission naming no rule at all, and one naming only
    // locked rules. Both must end with all nine locked rules stored as true.
    for (const submitted of [[], [...LOCKED_APPROVALS]]) {
      const stored = buildApprovals(configurableApprovalKeys(submitted));
      for (const locked of LOCKED_APPROVALS) {
        expect(stored[locked]).toBe(true);
      }
    }
  });

  it("does not invent a configurable rule that was not chosen", () => {
    const stored = buildApprovals(configurableApprovalKeys(["sendEmail"]));
    for (const key of CONFIGURABLE_APPROVALS) {
      if (key === "sendEmail") expect(stored[key]).toBe(true);
      else expect(stored[key]).toBeUndefined();
    }
  });
});

describe("branding", () => {
  it("reads a stored value", () => {
    expect(parseBranding({ displayName: "Dupont Law", accent: "teal" })).toEqual({
      displayName: "Dupont Law",
      accent: "teal",
    });
  });

  it("refuses an accent that is not in the palette", () => {
    // The accent reaches a `style` attribute, so anything outside the palette
    // has to become the default rather than being passed through.
    expect(parseBranding({ accent: "red; background: url(javascript:alert(1))" }).accent).toBe(
      "default",
    );
    expect(parseBranding({ accent: "#ff0000" }).accent).toBe("default");
  });

  it("survives rubbish in the column", () => {
    expect(parseBranding(null).accent).toBe("default");
    expect(parseBranding("not an object").displayName).toBe("");
    expect(parseBranding({ displayName: 42 }).displayName).toBe("");
  });

  it("bounds the display name", () => {
    expect(parseBranding({ displayName: "x".repeat(500) }).displayName).toHaveLength(80);
  });

  it("falls back to the firm's real name when no display name is set", () => {
    expect(firmDisplayName({ displayName: "", accent: "default" }, "Dupont Immigration Law")).toBe(
      "Dupont Immigration Law",
    );
    expect(firmDisplayName({ displayName: "  ", accent: "default" }, "Dupont")).toBe("Dupont");
    expect(firmDisplayName({ displayName: "Dupont Law", accent: "default" }, "Dupont")).toBe(
      "Dupont Law",
    );
  });

  it("gives every accent a light and a dark value", () => {
    // A single colour cannot stay legible in both themes, so the palette
    // carries both rather than letting one theme guess.
    for (const colour of ACCENT_COLOURS) {
      expect(colour.light).toMatch(/^#[0-9a-f]{6}$/);
      expect(colour.dark).toMatch(/^#[0-9a-f]{6}$/);
      expect(colour.light).not.toBe(colour.dark);
    }
  });
});

describe("profile validation", () => {
  const valid = {
    firmName: "Test Firm",
    contactName: "Alex Carter",
    contactEmail: "alex@test.local",
    userCount: 5,
    jurisdiction: "NY",
    language: "en",
    currency: "USD",
    timezone: "America/New_York",
  };

  it("accepts a complete profile", () => {
    expect(validateProfile(valid)).toEqual({ ok: true });
  });

  it("refuses what onboarding would have refused", () => {
    // Same rules as onboarding step 1, deliberately: a firm that could not have
    // been created with an empty name should not acquire one afterwards.
    expect(validateProfile({ ...valid, firmName: "  " }).ok).toBe(false);
    expect(validateProfile({ ...valid, contactName: "" }).ok).toBe(false);
    expect(validateProfile({ ...valid, contactEmail: "not-an-email" }).ok).toBe(false);
    expect(validateProfile({ ...valid, userCount: 0 }).ok).toBe(false);
  });
});
