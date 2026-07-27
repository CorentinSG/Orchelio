import { describe, expect, it } from "vitest";

import { resolveActiveFirm } from "@/lib/auth/firm-context";
import type { SessionFirm } from "@/lib/auth/session";

/**
 * The active-firm cookie is a preference, not a credential. This is the rule
 * that makes that true, so it is tested on its own: editing the cookie must
 * never grant access to a firm the user does not belong to.
 */

function firm(id: string, name: string): SessionFirm {
  return {
    id,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    primaryPracticeArea: "immigration",
    status: "active",
    role: "attorney",
  };
}

const DUPONT = firm("firm-dupont", "Dupont Immigration Law");
const CARTER = firm("firm-carter", "Carter Employment Law");

describe("resolveActiveFirm", () => {
  it("honours a preference for a firm the user belongs to", () => {
    expect(resolveActiveFirm([DUPONT, CARTER], "firm-carter")).toBe(CARTER);
  });

  it("ignores a preference for a firm the user does not belong to", () => {
    // The whole point: a forged cookie selects nothing.
    expect(resolveActiveFirm([DUPONT], "firm-carter")).toBe(DUPONT);
  });

  it("ignores a preference that is not a firm identifier at all", () => {
    for (const forged of ["", "  ", "../admin", "null", "undefined", "*"]) {
      expect(resolveActiveFirm([DUPONT], forged)).toBe(DUPONT);
    }
  });

  it("falls back to the first firm when no preference is stored", () => {
    expect(resolveActiveFirm([DUPONT, CARTER], null)).toBe(DUPONT);
    expect(resolveActiveFirm([DUPONT, CARTER], undefined)).toBe(DUPONT);
  });

  it("returns nothing when the user belongs to no firm", () => {
    // A platform administrator. No membership means no workspace, by design.
    expect(resolveActiveFirm([], "firm-dupont")).toBeNull();
    expect(resolveActiveFirm([], null)).toBeNull();
  });

  it("drops the preference when the membership behind it is revoked", () => {
    // Yesterday the user was in Carter and the cookie says so; today the
    // membership is gone. They land in Dupont, not in an error.
    expect(resolveActiveFirm([DUPONT], "firm-carter")).toBe(DUPONT);
  });
});
