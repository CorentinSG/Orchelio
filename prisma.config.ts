import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Orchelio — Prisma CLI configuration.
 *
 * The demo runs on a local SQLite file (orchelio-demo.db) so it costs nothing
 * to operate. Swapping to PostgreSQL later means changing the `provider` in
 * prisma/schema.prisma and the DATABASE_URL below — no application rewrite.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "file:./orchelio-demo.db",
  },
});
