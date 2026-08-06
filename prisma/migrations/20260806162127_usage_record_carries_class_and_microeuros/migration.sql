-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT NOT NULL DEFAULT 'simulated',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "costMicroEuros" INTEGER NOT NULL DEFAULT 0,
    "costEstimated" BOOLEAN NOT NULL DEFAULT false,
    "taskClass" TEXT NOT NULL DEFAULT '',
    "isRealCharge" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_records_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usage_records_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_usage_records" ("costCents", "createdAt", "firmId", "id", "inputTokens", "isRealCharge", "matterId", "model", "occurredAt", "operation", "outputTokens", "provider") SELECT "costCents", "createdAt", "firmId", "id", "inputTokens", "isRealCharge", "matterId", "model", "occurredAt", "operation", "outputTokens", "provider" FROM "usage_records";
DROP TABLE "usage_records";
ALTER TABLE "new_usage_records" RENAME TO "usage_records";
CREATE INDEX "usage_records_firmId_occurredAt_idx" ON "usage_records"("firmId", "occurredAt");
CREATE INDEX "usage_records_matterId_idx" ON "usage_records"("matterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
