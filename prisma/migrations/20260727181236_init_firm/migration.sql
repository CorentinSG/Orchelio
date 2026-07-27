-- CreateTable
CREATE TABLE "firms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryPracticeArea" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'onboarding',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "firms_slug_key" ON "firms"("slug");

-- CreateIndex
CREATE INDEX "firms_status_idx" ON "firms"("status");
