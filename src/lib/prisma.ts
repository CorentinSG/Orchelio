import "server-only";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/lib/env";

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
 * Prisma 7 talks to SQLite through a driver adapter. Replacing SQLite with
 * PostgreSQL later means swapping this adapter for `@prisma/adapter-pg` and
 * changing the datasource provider; no query in the application changes.
 */
function createPrismaClient(): PrismaClient {
  const { databaseUrl } = serverEnv();
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  orchelioPrisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.orchelioPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.orchelioPrisma = prisma;
}
