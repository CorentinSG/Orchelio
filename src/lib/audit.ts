import "server-only";

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { AuditStatus } from "@/lib/constants";

/**
 * Orchelio — activity log.
 *
 * Append-only: this module exposes exactly one write function, and no update or
 * delete path for `AuditEvent` exists anywhere in the codebase. That is an
 * application-level guarantee, not a database one — a production deployment
 * needs write-once storage or an INSERT-only database role. See
 * docs/PRODUCTION_READINESS.md.
 *
 * Recording must never break the action being recorded: if the log write fails,
 * the failure is reported to the server console and the caller proceeds. Losing
 * a log line is bad; losing the user's work because of a log line is worse.
 */

export type AuditInput = {
  action: string;
  /** Null for platform-level events that belong to no firm. */
  firmId?: string | null;
  userId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  status?: AuditStatus;
  /** Ties together the events produced by one user action. */
  correlationId?: string | null;
};

function serialise(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ unserialisable: true });
  }
}

export async function recordAuditEvent(input: AuditInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        action: input.action,
        firmId: input.firmId ?? null,
        userId: input.userId ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        oldValue: serialise(input.oldValue),
        newValue: serialise(input.newValue),
        status: input.status ?? "success",
        correlationId: input.correlationId ?? null,
      },
    });
  } catch (error) {
    console.error("[orchelio] failed to record audit event:", input.action, error);
  }
}

/** A correlation identifier for one user action spanning several events. */
export function newCorrelationId(): string {
  return randomUUID();
}

/** How long an identical view by the same user counts as the same visit. */
const VIEW_DEDUPLICATION_MS = 15 * 60 * 1000;

/**
 * Records that a user looked at something, at most once per quarter of an hour.
 *
 * Viewing is worth logging — a firm should be able to see who opened a matter —
 * but writing a line on every re-render would bury the decisions that matter
 * under thousands of refreshes. Consequential actions use `recordAuditEvent`
 * and are never de-duplicated.
 */
export async function recordViewEvent(input: AuditInput): Promise<void> {
  try {
    const since = new Date(Date.now() - VIEW_DEDUPLICATION_MS);
    const recent = await prisma.auditEvent.findFirst({
      where: {
        action: input.action,
        userId: input.userId ?? null,
        firmId: input.firmId ?? null,
        resourceId: input.resourceId ?? null,
        createdAt: { gte: since },
      },
      select: { id: true },
    });

    if (recent) {
      return;
    }
  } catch (error) {
    // If the lookup fails, fall through and record: an extra line is better
    // than a missing one.
    console.error("[orchelio] view de-duplication check failed:", error);
  }

  await recordAuditEvent(input);
}
