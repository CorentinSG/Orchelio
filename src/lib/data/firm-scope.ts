/**
 * Orchelio — firm scoping guard.
 *
 * The single rule this product depends on: a query for a firm-scoped resource
 * must say which firm it is for. `getMatter({ matterId, firmId })`, never
 * `getMatter(matterId)`.
 *
 * Conventions are not enough. One forgotten `where` clause on one query, on one
 * page, written in a hurry two years from now, and a firm reads another firm's
 * client file. So the rule is enforced by the database client itself: every
 * operation on a firm-scoped model is inspected, and one that does not mention
 * `firmId` throws before it reaches SQLite.
 *
 * This is a backstop, not a substitute for writing the `where` clause. It turns
 * a silent data leak into a loud, immediate failure — the difference between a
 * bug you find in a test and a breach you find in the press.
 *
 * Known limitation, stated rather than hidden: the check asks whether `firmId`
 * appears in the query, not whether it is used *correctly*. A deliberately
 * perverse query such as `{ NOT: { firmId } }` would satisfy it. It defends
 * against omission, which is the realistic mistake, not against sabotage.
 */

import type { PrismaClient } from "@/generated/prisma/client";

/** Models that belong to a firm. Every query against these must name a firm. */
export const FIRM_SCOPED_MODELS = new Set([
  "FirmMembership",
  "FirmConfiguration",
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
]);

/**
 * Models that are deliberately not firm-scoped.
 *
 *   User, Session          — a person exists before, and independently of, any firm.
 *   Firm                   — it *is* the firm; scoping it to itself is meaningless.
 *   PracticeArea,
 *   MatterType,
 *   WorkflowTemplate       — platform-wide catalogues, identical for every firm.
 *
 * Listed explicitly so that adding a model forces a decision: a new model that
 * appears in neither set fails the completeness test in
 * tests/unit/firm-scope.test.ts.
 */
export const PLATFORM_MODELS = new Set([
  "User",
  "Session",
  "Firm",
  "PracticeArea",
  "MatterType",
  "WorkflowTemplate",
]);

/** Operations whose firm must be named in `where`. */
const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/** Operations whose firm must be named in `data`. */
const DATA_OPERATIONS = new Set(["create", "createMany", "createManyAndReturn"]);

export class FirmScopeError extends Error {
  constructor(model: string, operation: string) {
    super(
      `Refused an unscoped ${operation} on ${model}: every query for a firm-scoped ` +
        "resource must include firmId. See docs/ARCHITECTURE.md §4.",
    );
    this.name = "FirmScopeError";
  }
}

const MAX_DEPTH = 6;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Is this `where` clause restricted to a single firm?
 *
 * Boolean combinators need opposite treatment, and getting it backwards is
 * itself a leak:
 *
 *   AND — every condition must hold, so **one** scoped branch is enough.
 *   OR  — any condition may match, so **every** branch must be scoped.
 *         `OR: [{ firmId }, { status: "active" }]` would return every active
 *         matter in the database. It is refused.
 *   NOT — a negated firm is not a scope, so it never counts.
 *
 * Outside the combinators the search is recursive, because Prisma nests the
 * firm in legitimate shapes: a compound unique key
 * `{ firmId_reference: { firmId, reference } }`, or a relation filter
 * `{ firm: { slug } }`.
 */
function whereIsFirmScoped(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false;

  if (Array.isArray(value)) {
    return value.length > 0 && value.every((entry) => whereIsFirmScoped(entry, depth + 1));
  }
  if (!isRecord(value)) return false;

  if ("firmId" in value) return true;
  if (isRecord(value["firm"])) return true;

  const or = value["OR"];
  if (Array.isArray(or) && or.length > 0 && or.every((b) => whereIsFirmScoped(b, depth + 1))) {
    return true;
  }

  const and = value["AND"];
  if (Array.isArray(and) && and.some((b) => whereIsFirmScoped(b, depth + 1))) {
    return true;
  }
  if (isRecord(and) && whereIsFirmScoped(and, depth + 1)) {
    return true;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (key === "AND" || key === "OR" || key === "NOT") continue;
    if (whereIsFirmScoped(nested, depth + 1)) return true;
  }

  return false;
}

/**
 * Does this `data` payload name a firm?
 *
 * For `createMany` every record must carry one — a batch where only the first
 * row is scoped would insert the rest into no firm at all.
 */
function dataIsFirmScoped(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false;

  if (Array.isArray(value)) {
    return value.length > 0 && value.every((entry) => dataIsFirmScoped(entry, depth + 1));
  }
  if (!isRecord(value)) return false;

  if ("firmId" in value) return true;
  // `{ firm: { connect: { id } } }` sets the same column by another route.
  if (isRecord(value["firm"])) return true;

  return Object.values(value).some((nested) => dataIsFirmScoped(nested, depth + 1));
}

type QueryArgs = {
  where?: unknown;
  data?: unknown;
};

/**
 * Throws unless this operation names a firm.
 *
 * Pure and exported so the rule can be unit-tested directly, without a
 * database — the guard is only worth having if it is itself verified.
 */
export function assertFirmScoped(model: string, operation: string, args: unknown): void {
  if (!FIRM_SCOPED_MODELS.has(model)) {
    return;
  }

  const { where, data } = (args ?? {}) as QueryArgs;

  // For update, delete and upsert it is `where` that decides which row is
  // affected, so that is what must be scoped.
  if (WHERE_OPERATIONS.has(operation) || operation === "upsert") {
    if (!whereIsFirmScoped(where)) {
      throw new FirmScopeError(model, operation);
    }
    return;
  }

  if (DATA_OPERATIONS.has(operation)) {
    if (!dataIsFirmScoped(data)) {
      throw new FirmScopeError(model, operation);
    }
    return;
  }

  // Raw queries and anything unrecognised cannot be inspected. They bypass the
  // guard by construction, so they must be written with care — and there are
  // none in the codebase outside the platform status check, which reads a
  // Prisma-owned table.
}

/**
 * Wraps a Prisma client so that every firm-scoped query is checked.
 *
 * Applied once, to the application's single client, so no caller can opt out by
 * importing the raw client instead.
 */
export function withFirmScopeGuard(client: PrismaClient) {
  return client.$extends({
    name: "orchelio-firm-scope",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          assertFirmScoped(model, operation, args);
          return query(args);
        },
      },
    },
  });
}

/**
 * The client the application actually uses. Named so that the guard is visible
 * in every signature that passes a database client around.
 */
export type GuardedPrismaClient = ReturnType<typeof withFirmScopeGuard>;
