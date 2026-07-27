-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "firm_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "firm_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "firm_memberships_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "firm_configurations" (
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
    "onboardingStatus" TEXT NOT NULL DEFAULT 'draft',
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "branding" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "firm_configurations_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_areas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matter_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "practiceAreaKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "matter_types_practiceAreaKey_fkey" FOREIGN KEY ("practiceAreaKey") REFERENCES "practice_areas" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "practiceAreaKey" TEXT,
    "description" TEXT,
    "steps" TEXT NOT NULL DEFAULT '[]',
    "requiredApprovals" TEXT NOT NULL DEFAULT '[]',
    "aiFeatures" TEXT NOT NULL DEFAULT '[]',
    "allowedRoles" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "isFictional" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "client_profiles_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientProfileId" TEXT,
    "practiceAreaKey" TEXT NOT NULL,
    "matterTypeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lead',
    "representationSide" TEXT,
    "responsibleAttorneyId" TEXT,
    "fields" TEXT NOT NULL DEFAULT '{}',
    "aiStatus" TEXT NOT NULL DEFAULT 'none',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDeadlineAt" DATETIME,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "matters_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matters_clientProfileId_fkey" FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matters_matterTypeKey_fkey" FOREIGN KEY ("matterTypeKey") REFERENCES "matter_types" ("key") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matters_responsibleAttorneyId_fkey" FOREIGN KEY ("responsibleAttorneyId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matters_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "intake_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedById" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "intake_responses_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "intake_responses_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "intake_responses_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "storageKey" TEXT,
    "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documents_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documents_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "firm_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "overrides" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "firm_workflows_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "firm_workflows_templateKey_fkey" FOREIGN KEY ("templateKey") REFERENCES "workflow_templates" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "firmWorkflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_runs_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_runs_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_runs_firmWorkflowId_fkey" FOREIGN KEY ("firmWorkflowId") REFERENCES "firm_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "completedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_steps_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_steps_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "workflow_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflow_steps_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT NOT NULL DEFAULT 'simulated',
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "status" TEXT NOT NULL DEFAULT 'running',
    "result" TEXT,
    "warnings" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    CONSTRAINT "ai_analyses_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_analyses_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_analyses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT NOT NULL DEFAULT 'simulated',
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "status" TEXT NOT NULL,
    "result" TEXT,
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_reviews_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_reviews_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ai_analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "decisionNote" TEXT,
    "requestedById" TEXT,
    "decidedById" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "approval_requests_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_requests_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "approval_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "approval_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueAt" DATETIME,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "draft_communications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "templateKey" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "draft_communications_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "draft_communications_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "draft_communications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "matterId" TEXT,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT NOT NULL DEFAULT 'simulated',
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "isRealCharge" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_records_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usage_records_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "correlationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "firms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "firm_memberships_firmId_idx" ON "firm_memberships"("firmId");

-- CreateIndex
CREATE INDEX "firm_memberships_role_idx" ON "firm_memberships"("role");

-- CreateIndex
CREATE UNIQUE INDEX "firm_memberships_userId_firmId_key" ON "firm_memberships"("userId", "firmId");

-- CreateIndex
CREATE UNIQUE INDEX "firm_configurations_firmId_key" ON "firm_configurations"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "practice_areas_key_key" ON "practice_areas"("key");

-- CreateIndex
CREATE UNIQUE INDEX "matter_types_key_key" ON "matter_types"("key");

-- CreateIndex
CREATE INDEX "matter_types_practiceAreaKey_idx" ON "matter_types"("practiceAreaKey");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_key_key" ON "workflow_templates"("key");

-- CreateIndex
CREATE INDEX "workflow_templates_practiceAreaKey_idx" ON "workflow_templates"("practiceAreaKey");

-- CreateIndex
CREATE INDEX "client_profiles_firmId_idx" ON "client_profiles"("firmId");

-- CreateIndex
CREATE INDEX "matters_firmId_status_idx" ON "matters"("firmId", "status");

-- CreateIndex
CREATE INDEX "matters_firmId_matterTypeKey_idx" ON "matters"("firmId", "matterTypeKey");

-- CreateIndex
CREATE INDEX "matters_responsibleAttorneyId_idx" ON "matters"("responsibleAttorneyId");

-- CreateIndex
CREATE UNIQUE INDEX "matters_firmId_reference_key" ON "matters"("firmId", "reference");

-- CreateIndex
CREATE INDEX "intake_responses_firmId_idx" ON "intake_responses"("firmId");

-- CreateIndex
CREATE INDEX "intake_responses_matterId_idx" ON "intake_responses"("matterId");

-- CreateIndex
CREATE INDEX "documents_firmId_idx" ON "documents"("firmId");

-- CreateIndex
CREATE INDEX "documents_matterId_category_idx" ON "documents"("matterId", "category");

-- CreateIndex
CREATE INDEX "firm_workflows_firmId_idx" ON "firm_workflows"("firmId");

-- CreateIndex
CREATE UNIQUE INDEX "firm_workflows_firmId_templateKey_key" ON "firm_workflows"("firmId", "templateKey");

-- CreateIndex
CREATE INDEX "workflow_runs_firmId_status_idx" ON "workflow_runs"("firmId", "status");

-- CreateIndex
CREATE INDEX "workflow_runs_matterId_idx" ON "workflow_runs"("matterId");

-- CreateIndex
CREATE INDEX "workflow_steps_firmId_idx" ON "workflow_steps"("firmId");

-- CreateIndex
CREATE INDEX "workflow_steps_workflowRunId_position_idx" ON "workflow_steps"("workflowRunId", "position");

-- CreateIndex
CREATE INDEX "ai_analyses_firmId_status_idx" ON "ai_analyses"("firmId", "status");

-- CreateIndex
CREATE INDEX "ai_analyses_matterId_idx" ON "ai_analyses"("matterId");

-- CreateIndex
CREATE INDEX "ai_reviews_firmId_idx" ON "ai_reviews"("firmId");

-- CreateIndex
CREATE INDEX "ai_reviews_analysisId_idx" ON "ai_reviews"("analysisId");

-- CreateIndex
CREATE INDEX "approval_requests_firmId_status_idx" ON "approval_requests"("firmId", "status");

-- CreateIndex
CREATE INDEX "approval_requests_matterId_idx" ON "approval_requests"("matterId");

-- CreateIndex
CREATE INDEX "tasks_firmId_status_idx" ON "tasks"("firmId", "status");

-- CreateIndex
CREATE INDEX "tasks_matterId_idx" ON "tasks"("matterId");

-- CreateIndex
CREATE INDEX "draft_communications_firmId_status_idx" ON "draft_communications"("firmId", "status");

-- CreateIndex
CREATE INDEX "draft_communications_matterId_idx" ON "draft_communications"("matterId");

-- CreateIndex
CREATE INDEX "usage_records_firmId_occurredAt_idx" ON "usage_records"("firmId", "occurredAt");

-- CreateIndex
CREATE INDEX "usage_records_matterId_idx" ON "usage_records"("matterId");

-- CreateIndex
CREATE INDEX "audit_events_firmId_createdAt_idx" ON "audit_events"("firmId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_userId_createdAt_idx" ON "audit_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

-- CreateIndex
CREATE INDEX "audit_events_correlationId_idx" ON "audit_events"("correlationId");
