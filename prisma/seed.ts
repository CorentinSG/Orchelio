import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Orchelio — demonstration seed data.
 *
 * Everything created here is fictional. Nothing in this file describes a real
 * firm, a real person or a real legal matter.
 *
 * Phase 1 scope: the two demonstration firm tenants only. Phase 2 adds the
 * demo users and memberships, Phase 3 the firm configurations, Phase 5 the six
 * fictional matters and their documents. The command name stays `npm run seed`
 * throughout, so the instructions in README.md never change.
 */

const DEMO_FIRMS = [
  {
    slug: "dupont-immigration-law",
    name: "Dupont Immigration Law",
    primaryPracticeArea: "immigration",
    status: "active",
  },
  {
    slug: "carter-employment-labor-law",
    name: "Carter Employment & Labor Law",
    primaryPracticeArea: "employment_law",
    status: "active",
  },
] as const;

async function main() {
  const url = process.env["DATABASE_URL"] ?? "file:./prisma/orchelio-demo.db";
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  try {
    for (const firm of DEMO_FIRMS) {
      // Upsert keeps `npm run seed` safe to re-run without wiping the database.
      const saved = await prisma.firm.upsert({
        where: { slug: firm.slug },
        update: { name: firm.name, primaryPracticeArea: firm.primaryPracticeArea },
        create: { ...firm },
      });
      console.log(`  ✓ ${saved.name} (${saved.primaryPracticeArea})`);
    }

    const total = await prisma.firm.count();
    console.log(`\nSeed complete — ${total} demonstration firm(s) in orchelio-demo.db.`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log("Seeding Orchelio demonstration data (fictional only)…\n");

main().catch((error: unknown) => {
  console.error("\nSeed failed:", error);
  process.exit(1);
});
