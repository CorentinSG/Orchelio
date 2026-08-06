import { describe, expect, it } from "vitest";

import { statusLabel } from "@/components/matter-ui";
import { MATTER_STATUSES } from "@/lib/constants";

/**
 * Orchelio — the words a matter status wears.
 *
 * Until V1 the label was manufactured from the key ("conflict_review" →
 * "Conflict review"), which cannot produce French. Now it is a table, and a
 * table can be incomplete — a status added to MATTER_STATUSES without a label
 * would render as its raw key. Visibly wrong beats silently invented, but
 * this test makes it a build failure instead of a screenshot surprise.
 */
describe("statusLabel", () => {
  it("has a French label for every status the product knows", () => {
    for (const status of MATTER_STATUSES) {
      const label = statusLabel(status);
      expect(label, status).not.toBe(status);
      expect(label, status).not.toMatch(/_/);
    }
  });

  it("keeps an unknown key raw, so a mistake shows instead of guessing", () => {
    expect(statusLabel("not_a_real_status")).toBe("not_a_real_status");
  });
});
