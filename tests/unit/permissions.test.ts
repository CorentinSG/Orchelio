import { describe, expect, it } from "vitest";

import {
  type Actor,
  type FirmRole,
  can,
  isFirmRole,
  permissionsFor,
  roleLabel,
} from "@/lib/auth/permissions";

/**
 * The permission matrix is a safety property, not a convenience. These tests
 * assert the exclusions from the specification directly, so that widening a
 * role by accident fails the build rather than shipping.
 */

function actor(role: FirmRole | null, isPlatformAdmin = false): Actor {
  return { userId: "user-1", role, isPlatformAdmin };
}

describe("firm roles", () => {
  it("recognises the four firm roles and nothing else", () => {
    for (const role of ["firm_admin", "attorney", "paralegal", "read_only"]) {
      expect(isFirmRole(role)).toBe(true);
    }
    for (const role of ["platform_admin", "admin", "owner", ""]) {
      expect(isFirmRole(role)).toBe(false);
    }
  });
});

describe("attorney", () => {
  it("can run and approve analyses, and confirm deadlines", () => {
    const a = actor("attorney");

    expect(can(a, "ai.analysis.run")).toBe(true);
    expect(can(a, "ai.review.run")).toBe(true);
    expect(can(a, "approval.decide")).toBe(true);
    expect(can(a, "deadline.confirm")).toBe(true);
    expect(can(a, "matter.close")).toBe(true);
    expect(can(a, "communication.draft")).toBe(true);
  });

  it("cannot manage firm users or workflows", () => {
    const a = actor("attorney");

    expect(can(a, "firm.users.manage")).toBe(false);
    expect(can(a, "firm.workflows.manage")).toBe(false);
    expect(can(a, "firm.settings.edit")).toBe(false);
  });
});

describe("paralegal", () => {
  it("can prepare work", () => {
    const a = actor("paralegal");

    expect(can(a, "client.create")).toBe(true);
    expect(can(a, "intake.complete")).toBe(true);
    expect(can(a, "document.upload")).toBe(true);
    expect(can(a, "document.classify")).toBe(true);
    expect(can(a, "ai.analysis.run")).toBe(true);
    expect(can(a, "approval.view")).toBe(true);
  });

  it("cannot approve an analysis, confirm a deadline, close a matter or draft a communication", () => {
    const a = actor("paralegal");

    expect(can(a, "approval.decide")).toBe(false);
    expect(can(a, "deadline.confirm")).toBe(false);
    expect(can(a, "matter.close")).toBe(false);
    expect(can(a, "communication.draft")).toBe(false);
    expect(can(a, "firm.settings.edit")).toBe(false);
    expect(can(a, "firm.users.manage")).toBe(false);
  });
});

describe("read-only reviewer", () => {
  it("can only look", () => {
    const a = actor("read_only");
    const granted = permissionsFor(a);

    expect(granted.sort()).toEqual(
      ["approval.view", "ai.result.view", "document.view", "matter.view"].sort(),
    );
    for (const permission of granted) {
      expect(permission.endsWith(".view")).toBe(true);
    }
  });
});

describe("firm administrator", () => {
  it("can administer the firm and act on matters", () => {
    const a = actor("firm_admin");

    expect(can(a, "firm.settings.edit")).toBe(true);
    expect(can(a, "firm.users.manage")).toBe(true);
    expect(can(a, "firm.workflows.manage")).toBe(true);
    expect(can(a, "firm.audit.view")).toBe(true);
    expect(can(a, "approval.decide")).toBe(true);
  });
});

describe("platform administrator", () => {
  it("cannot read matter or document content by default", () => {
    const a = actor(null, true);

    expect(can(a, "matter.view")).toBe(false);
    expect(can(a, "document.view")).toBe(false);
    expect(can(a, "ai.result.view")).toBe(false);
    expect(can(a, "approval.decide")).toBe(false);
  });

  it("holds no firm role of its own", () => {
    expect(roleLabel(null, true)).toBe("Platform Administrator");
  });
});

describe("no membership", () => {
  it("grants nothing at all", () => {
    const a = actor(null, false);

    expect(permissionsFor(a)).toEqual([]);
    expect(can(a, "matter.view")).toBe(false);
    expect(roleLabel(null, false)).toBe("No access");
  });
});
