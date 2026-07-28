import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env";
import { type GuardedPrismaClient, withFirmScopeGuard } from "@/lib/data/firm-scope";

/**
 * Orchelio — Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * SQLite connection on every save until the process runs out of handles. The
 * client is therefore cached on `globalThis`.
 *
 * `server-only` makes the build fail loudly if this module is ever pulled into
 * a client component — the database must never be reachable from the browser.
 *
 * The client is wrapped in the firm scoping guard, so a query against a
 * firm-scoped model that forgets `firmId` throws instead of quietly returning
 * another firm's rows. There is deliberately no unguarded client exported from
 * anywhere: opting out would have to be a visible, reviewable change to this
 * file.
 *
 * Prisma 7 talks to SQLite through a driver adapter. Replacing SQLite with
 * PostgreSQL later means swapping this adapter for `@prisma/adapter-pg` and
 * changing the datasource provider; no query in the application changes.
 */
/**
 * Set ORCHELIO_LOG_QUERIES=1 to print every SQL statement.
 *
 * This is how the caching work in `src/lib/cache.ts` was measured rather than
 * guessed: start the server with it on, load a page, count the statements.
 * See docs/HARNESS.md.
 */
const logQueries = process.env["ORCHELIO_LOG_QUERIES"] === "1";

function createPrismaClient(): GuardedPrismaClient {
  const { databaseUrl } = serverEnv();
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

  const client = new PrismaClient({
    adapter,
    log: logQueries
      ? ["query", "warn", "error"]
      : process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

  return withFirmScopeGuard(client);
}

const globalForPrisma = globalThis as unknown as {
  orchelioPrisma?: GuardedPrismaClient;
};

export const prisma: GuardedPrismaClient = globalForPrisma.orchelioPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.orchelioPrisma = prisma;
}
