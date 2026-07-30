-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_firm_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "primaryPracticeArea" TEXT NOT NULL,
    "practiceAreas" TEXT NOT NULL DEFAULT '[]',
    "matterTypes" TEXT NOT NULL DEFAULT '[]',
    "enabledWorkflows" TEXT NOT NULL DEFAULT '[]',
    "aiFeatures" TEXT NOT NULL DEFAULT '[]',
    "approvals" TEXT NOT NULL DEFAULT '{}',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "userCount" INTEGER,
    "jurisdiction" TEXT,
    "requireSeparateApprover" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'draft',
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "branding" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "firm_configurations_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_firm_configurations" ("aiFeatures", "approvals", "branding", "contactEmail", "contactName", "createdAt", "currency", "enabledWorkflows", "firmId", "id", "jurisdiction", "language", "matterTypes", "onboardingStatus", "onboardingStep", "practiceAreas", "primaryPracticeArea", "timezone", "updatedAt", "userCount") SELECT "aiFeatures", "approvals", "branding", "contactEmail", "contactName", "createdAt", "currency", "enabledWorkflows", "firmId", "id", "jurisdiction", "language", "matterTypes", "onboardingStatus", "onboardingStep", "practiceAreas", "primaryPracticeArea", "timezone", "updatedAt", "userCount" FROM "firm_configurations";
DROP TABLE "firm_configurations";
ALTER TABLE "new_firm_configurations" RENAME TO "firm_configurations";
CREATE UNIQUE INDEX "firm_configurations_firmId_key" ON "firm_configurations"("firmId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
