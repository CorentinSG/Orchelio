import "server-only";

import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";

/**
 * Orchelio — platform self-check.
 *
 * The home page is not a static mock-up: it runs this check on every request so
 * that a broken install is visible immediately, with the exact command needed
 * to fix it. This is also the seed of the future `/admin/system-overview`
 * screen (Phase 8).
 */

export type DatabaseStatus =
  | {
      state: "connected";
      /** Round-trip time of a real query, in milliseconds. */
      latencyMs: number;
      /** Firm tenants currently registered. */
      firmCount: number;
      /** Migrations recorded by Prisma in `_prisma_migrations`. */
      migrationsApplied: number;
    }
  | {
      state: "unavailable";
      /** Short, non-sensitive explanation shown to the operator. */
      reason: string;
      /** The command that most likely fixes it. */
      remedy: string;
    };

export type SystemStatus = {
  database: DatabaseStatus;
  aiProvider: string;
  appEnv: string;
  nodeVersion: string;
};

type MigrationRow = { count: bigint | number };

/**
 * Distinguishes "the database file has no schema yet" from every other
 * failure, because the two need different instructions.
 */
function describeFailure(error: unknown): { reason: string; remedy: string } {
  const message = error instanceof Error ? error.message : String(error);

  if (/no such table|does not exist/i.test(message)) {
    return {
      reason: "The database file exists but the Orchelio tables have not been created yet.",
      remedy: "npm run db:migrate",
    };
  }

  if (/unable to open|no such file|ENOENT/i.test(message)) {
    return {
      reason: "No SQLite database file was found at DATABASE_URL.",
      remedy: "npm run db:migrate",
    };
  }

  return {
    reason: "The database could not be reached.",
    remedy: "npm run db:migrate",
  };
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const startedAt = performance.now();

  try {
    const [firmCount, migrationRows] = await Promise.all([
      prisma.firm.count(),
      prisma.$queryRaw<MigrationRow[]>`
        SELECT COUNT(*) AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL
      `,
    ]);

    return {
      state: "connected",
      latencyMs: Math.round(performance.now() - startedAt),
      firmCount,
      migrationsApplied: Number(migrationRows[0]?.count ?? 0),
    };
  } catch (error) {
    // Log the detail server-side; show the operator a generic, actionable message.
    console.error("[orchelio] database status check failed:", error);
    return { state: "unavailable", ...describeFailure(error) };
  }
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const env = serverEnv();

  return {
    database: await getDatabaseStatus(),
    aiProvider: env.aiProvider,
    appEnv: env.appEnv,
    nodeVersion: process.version,
  };
}

/**
 * Firms registered on this instance. Phase 1 shows the two seeded demo firms;
 * from Phase 3 this list becomes the platform administrator's firm switcher.
 */
export async function listFirms() {
  try {
    return await prisma.firm.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true, primaryPracticeArea: true, status: true },
    });
  } catch {
    return [];
  }
}
