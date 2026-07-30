-- Adds "superseded" as a state an approval request can end in, and the moment
-- it happened. Separate from decidedAt because nobody decided it.
ALTER TABLE "approval_requests" ADD COLUMN "supersededAt" DATETIME;

-- One-time correction of rows created by the defect this column exists to fix.
--
-- Re-running an analysis used to leave the previous analysis's request waiting
-- for a decision nobody could sensibly make. A demonstration matter had
-- accumulated 113 of them, which buried the request that mattered under a
-- hundred that were no longer the question.
--
-- The predicate below is the steady state of the rule the application now
-- applies as each analysis finishes: a pending "rely on an AI analysis" request
-- whose analysis has been overtaken by a later one on the same matter. It marks
-- nothing that a person decided, and creates no audit entries — a schema
-- migration is not a user action, and inventing a person to attribute it to
-- would be worse than the gap.
UPDATE "approval_requests"
SET "status" = 'superseded',
    "supersededAt" = CURRENT_TIMESTAMP
WHERE "status" = 'pending'
  AND "action" = 'legal_analysis'
  AND EXISTS (
    SELECT 1
    FROM "ai_analyses" AS mine
    JOIN "ai_analyses" AS newer
      ON newer."matterId" = mine."matterId"
     AND newer."firmId" = mine."firmId"
     AND newer."createdAt" > mine."createdAt"
    WHERE mine."id" = "approval_requests"."resourceId"
      AND mine."firmId" = "approval_requests"."firmId"
  );
