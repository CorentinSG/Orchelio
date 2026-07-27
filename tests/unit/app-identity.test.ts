import { describe, expect, it } from "vitest";

import {
  APP_DESCRIPTION,
  APP_FULL_NAME,
  APP_NAME,
  DEMO_NOTICE_LONG,
  DEMO_NOTICE_SHORT,
  POWERED_BY,
} from "@/lib/app-config";
import { PRACTICE_AREAS, isPracticeAreaAvailable, practiceAreaLabel } from "@/lib/practice-areas";

/**
 * Product naming is a requirement of the specification, not a cosmetic detail:
 * the demonstration must never present itself under a generic name. These
 * tests fail if a rename ever leaks in.
 */
describe("Orchelio identity", () => {
  it("is named Orchelio", () => {
    expect(APP_NAME).toBe("Orchelio");
    expect(APP_FULL_NAME).toBe("Orchelio Demo");
    expect(POWERED_BY).toBe("Powered by Orchelio");
    expect(APP_DESCRIPTION).toBe("Orchelio is a configurable AI operating system for law firms.");
  });

  it("never uses a generic product name", () => {
    const forbidden = ["Legal AI Platform", "Law Firm SaaS", "JurisFlow", "AI Legal Operating System"];
    const surfaces = [APP_NAME, APP_FULL_NAME, APP_DESCRIPTION, POWERED_BY].join(" ");

    for (const name of forbidden) {
      expect(surfaces).not.toContain(name);
    }
  });

  it("carries both mandated demonstration warnings", () => {
    expect(DEMO_NOTICE_SHORT).toBe(
      "Orchelio Demo — Do not upload real client information or confidential documents.",
    );
    expect(DEMO_NOTICE_LONG).toBe(
      "Demo environment — Do not upload real client information or confidential documents.",
    );
  });
});

describe("practice areas", () => {
  it("ships full templates for immigration and employment only", () => {
    const available = PRACTICE_AREAS.filter((area) => area.status === "available").map((a) => a.key);

    expect(available).toEqual(["immigration", "employment_law"]);
    expect(isPracticeAreaAvailable("immigration")).toBe(true);
    expect(isPracticeAreaAvailable("family_law")).toBe(false);
  });

  it("uses the agreed United States labels", () => {
    expect(practiceAreaLabel("immigration")).toBe("Immigration Law");
    expect(practiceAreaLabel("employment_law")).toBe("Employment & Labor Law");
  });

  it("does not invent a label for an unknown key", () => {
    expect(practiceAreaLabel("maritime_law")).toBe("Unassigned practice area");
  });
});
