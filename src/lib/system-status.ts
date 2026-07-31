import "server-only";

import { prisma } from "@/lib/prisma";
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";

/**
 * Orchelio — platform self-check.
 *
 * The home page is not a static mock-up: it runs this check on every request so
 * that a broken install is visible immediately, with the exact command needed
 * to fix it. The platform administrator's `/admin/system` screen reads the same
 * check, so the two cannot report different things about one instance.
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
  /** One word for what kind of run that provider produces. */
  aiProviderWord: string;
  /** The short sentence beneath it. All four come from `src/lib/ai/notice.ts`. */
  aiProviderHint: string;
  /** The banner a visitor reads before signing in: title and body. */
  aiProviderBannerTitle: string;
  aiProviderBanner: string;
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

  const notice = providerNotice(env);

  return {
    database: await getDatabaseStatus(),
    aiProvider: env.aiProvider,
    aiProviderWord: notice.word,
    aiProviderHint: notice.statusHint,
    aiProviderBannerTitle: notice.bannerTitle,
    aiProviderBanner: notice.banner,
    appEnv: env.appEnv,
    nodeVersion: process.version,
  };
}

/**
 * Firms registered on this instance, for the public status panel.
 *
 * Deliberately not what the administration screens read: those go through
 * `src/lib/data/platform.ts`, which is the one module allowed to look across
 * tenants and is written to be audited as such.
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
