import { describe, expect, it } from "vitest";

import {
  FIRM_SCOPED_MODELS,
  FirmScopeError,
  PLATFORM_MODELS,
  assertFirmScoped,
} from "@/lib/data/firm-scope";

/**
 * The guard is the backstop that turns a forgotten `where` clause from a silent
 * data leak into a loud failure. A backstop nobody tests is not a backstop, so
 * the rule is exercised directly here, without a database.
 */

describe("model classification", () => {
  it("classifies every model in the schema as either firm-scoped or platform-wide", () => {
    // Kept in step with prisma/schema.prisma by hand; this test is what makes
    // "by hand" safe. A new model that appears in neither set fails here.
    const modelsInSchema = [
      "User",
      "Session",
      "Firm",
      "FirmMembership",
      "FirmConfiguration",
      "PracticeArea",
      "MatterType",
      "WorkflowTemplate",
      "ClientProfile",
      "Matter",
      "IntakeResponse",
      "Document",
      "FirmWorkflow",
      "WorkflowRun",
      "WorkflowStep",
      "AIAnalysis",
      "AIReview",
      "ApprovalRequest",
      "Task",
      "DraftCommunication",
      "UsageRecord",
      "AuditEvent",
    ];

    for (const model of modelsInSchema) {
      const classified = FIRM_SCOPED_MODELS.has(model) || PLATFORM_MODELS.has(model);
      expect(classified, `${model} is classified`).toBe(true);
    }

    expect(FIRM_SCOPED_MODELS.size + PLATFORM_MODELS.size).toBe(modelsInSchema.length);
  });

  it("never classifies a model as both", () => {
    for (const model of FIRM_SCOPED_MODELS) {
      expect(PLATFORM_MODELS.has(model)).toBe(false);
    }
  });

  it("treats every model that holds client information as firm-scoped", () => {
    for (const model of ["Matter", "Document", "ClientProfile", "AIAnalysis", "AIReview"]) {
      expect(FIRM_SCOPED_MODELS.has(model)).toBe(true);
    }
  });
});

describe("reads", () => {
  it("refuses a read that does not name a firm", () => {
    for (const operation of ["findFirst", "findMany", "count", "aggregate", "groupBy"]) {
      expect(() => assertFirmScoped("Matter", operation, { where: { id: "m1" } })).toThrow(
        FirmScopeError,
      );
    }
  });

  it("refuses a read with no where clause at all", () => {
    expect(() => assertFirmScoped("Matter", "findMany", {})).toThrow(FirmScopeError);
    expect(() => assertFirmScoped("Matter", "findMany", undefined)).toThrow(FirmScopeError);
  });

  it("allows a read that names a firm", () => {
    expect(() =>
      assertFirmScoped("Matter", "findFirst", { where: { id: "m1", firmId: "f1" } }),
    ).not.toThrow();
  });

  it("accepts a firm named inside a compound unique key", () => {
    expect(() =>
      assertFirmScoped("Matter", "findUnique", {
        where: { firmId_reference: { firmId: "f1", reference: "IMM-2026-001" } },
      }),
    ).not.toThrow();
  });

  it("accepts a firm named inside a relation filter", () => {
    expect(() =>
      assertFirmScoped("Matter", "findMany", { where: { firm: { slug: "dupont-immigration-law" } } }),
    ).not.toThrow();
  });
});

/**
 * AND and OR need opposite treatment, and getting it backwards is itself a
 * leak. These are the cases that matter most in the whole guard.
 */
describe("boolean combinators", () => {
  it("accepts AND when one branch names the firm, because every branch must hold", () => {
    expect(() =>
      assertFirmScoped("Document", "findMany", {
        where: { AND: [{ firmId: "f1" }, { category: "passport" }] },
      }),
    ).not.toThrow();
  });

  it("refuses OR unless every branch names the firm", () => {
    // `OR: [{ firmId }, { status }]` matches every active matter in the
    // database, in every firm. It must not be allowed to look scoped.
    expect(() =>
      assertFirmScoped("Matter", "findMany", {
        where: { OR: [{ firmId: "f1" }, { status: "active" }] },
      }),
    ).toThrow(FirmScopeError);
  });

  it("accepts OR when every branch names the firm", () => {
    expect(() =>
      assertFirmScoped("Matter", "findMany", {
        where: {
          OR: [
            { firmId: "f1", status: "active" },
            { firmId: "f1", status: "closed" },
          ],
        },
      }),
    ).not.toThrow();
  });

  it("accepts the real shape used by the matter search: firm outside, OR inside", () => {
    expect(() =>
      assertFirmScoped("Matter", "findMany", {
        where: {
          firmId: "f1",
          OR: [{ reference: { contains: "IMM" } }, { title: { contains: "IMM" } }],
        },
      }),
    ).not.toThrow();
  });

  it("refuses an empty OR, which constrains nothing", () => {
    expect(() => assertFirmScoped("Matter", "findMany", { where: { OR: [] } })).toThrow(
      FirmScopeError,
    );
  });

  it("does not accept a negated firm as a scope", () => {
    // `NOT: { firmId }` is every firm except one — the opposite of scoping.
    expect(() =>
      assertFirmScoped("Matter", "findMany", { where: { NOT: { firmId: "f1" } } }),
    ).toThrow(FirmScopeError);
  });
});

describe("writes", () => {
  it("refuses a create that does not name a firm", () => {
    expect(() => assertFirmScoped("Matter", "create", { data: { title: "Untitled" } })).toThrow(
      FirmScopeError,
    );
  });

  it("allows a create that names a firm", () => {
    expect(() =>
      assertFirmScoped("Matter", "create", { data: { title: "Untitled", firmId: "f1" } }),
    ).not.toThrow();
  });

  it("requires every record of a createMany to name a firm, not just the first", () => {
    expect(() =>
      assertFirmScoped("Document", "createMany", {
        data: [{ filename: "a.pdf", firmId: "f1" }, { filename: "b.pdf" }],
      }),
    ).toThrow(FirmScopeError);

    expect(() =>
      assertFirmScoped("Document", "createMany", {
        data: [
          { filename: "a.pdf", firmId: "f1" },
          { filename: "b.pdf", firmId: "f1" },
        ],
      }),
    ).not.toThrow();
  });

  it("refuses an update, delete or upsert that does not name a firm", () => {
    for (const operation of ["update", "updateMany", "delete", "deleteMany", "upsert"]) {
      expect(() =>
        assertFirmScoped("Matter", operation, { where: { id: "m1" }, data: { status: "closed" } }),
      ).toThrow(FirmScopeError);
    }
  });
});

describe("platform models", () => {
  it("lets unscoped queries through, because they belong to no firm", () => {
    expect(() => assertFirmScoped("User", "findUnique", { where: { email: "a@demo.local" } })).not.toThrow();
    expect(() => assertFirmScoped("Firm", "findMany", {})).not.toThrow();
    expect(() => assertFirmScoped("PracticeArea", "findMany", {})).not.toThrow();
    expect(() => assertFirmScoped("Session", "findUnique", { where: { tokenHash: "x" } })).not.toThrow();
  });
});

describe("audit events", () => {
  it("accepts an explicit platform-level event, which has no firm", () => {
    // A sign-in happens before any firm is chosen. `firmId: null` is a
    // deliberate statement, not an omission, so it is allowed.
    expect(() =>
      assertFirmScoped("AuditEvent", "create", {
        data: { action: "auth.login.succeeded", firmId: null },
      }),
    ).not.toThrow();
  });

  it("refuses an audit event that simply forgot the firm", () => {
    expect(() =>
      assertFirmScoped("AuditEvent", "create", { data: { action: "matter.viewed" } }),
    ).toThrow(FirmScopeError);
  });

  it("refuses a read of the activity log that does not name a firm", () => {
    expect(() =>
      assertFirmScoped("AuditEvent", "findMany", { where: { action: "matter.viewed" } }),
    ).toThrow(FirmScopeError);
  });
});

describe("the error itself", () => {
  it("says which query was refused and points at the rule", () => {
    try {
      assertFirmScoped("Matter", "findMany", {});
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(FirmScopeError);
      expect((error as Error).message).toContain("Matter");
      expect((error as Error).message).toContain("findMany");
      expect((error as Error).message).toContain("firmId");
    }
  });
});
