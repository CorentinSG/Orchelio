# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 954 nodes · 2133 edges · 61 communities (50 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f9cf5e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyst.ts
- dashboard/page.tsx
- [step]/page.tsx
- fields.ts
- prisma.ts
- compilerOptions
- allow
- devDependencies
- scripts
- app/page.tsx
- constants.ts
- raise.ts
- [id]/page.tsx
- run.ts
- activity/page.tsx
- ui.tsx
- login/actions.ts
- seed.ts
- app-shell.tsx
- dependencies
- codemap.mjs
- brand.tsx
- intake/page.tsx
- login/page.tsx
- docs-check.mjs
- approvals/actions.ts
- matters/page.tsx
- doctor.mjs
- data/documents.ts
- new/page.tsx
- approvals/page.tsx
- approval-ui.tsx
- scope.ts
- deny
- app.json
- documents/page.tsx
- matters.ts
- loading-screen.tsx
- package.json
- upload-panel.tsx
- settings.json
- communications.ts
- approvals.spec.ts
- onboarding.spec.ts
- app/layout.tsx
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 36 edges
2. `scripts` - 31 edges
3. `currentSession` - 24 edges
4. `recordAuditEvent()` - 23 edges
5. `compilerOptions` - 22 edges
6. `Callout()` - 21 edges
7. `activeFirmFor()` - 19 edges
8. `actorFor()` - 18 edges
9. `POST()` - 17 edges
10. `Card()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts
- `AdminFirmsPage()` --calls--> `requirePlatformAdmin()`  [EXTRACTED]
  src/app/(app)/admin/firms/page.tsx → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (61 total, 11 thin omitted)

### Community 0 - "analyst.ts"
Cohesion: 0.05
Nodes (73): DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions() (+65 more)

### Community 1 - "dashboard/page.tsx"
Cohesion: 0.10
Nodes (52): ADR-0006, CHANNELS, POST(), POST(), ACTIONS, POST(), stringList(), metadata (+44 more)

### Community 2 - "[step]/page.tsx"
Cohesion: 0.06
Nodes (55): Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), FirmSwitcher(), CheckboxOption(), Field() (+47 more)

### Community 3 - "fields.ts"
Cohesion: 0.07
Nodes (42): ADR-0002, POST(), DashboardPage(), NewMatterPage(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS (+34 more)

### Community 4 - "prisma.ts"
Cohesion: 0.09
Nodes (28): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError (+20 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 6 - "allow"
Cohesion: 0.06
Nodes (35): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+27 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 8 - "scripts"
Cohesion: 0.06
Nodes (31): scripts, build, check, codemap, db:generate, db:migrate, db:reset, db:studio (+23 more)

### Community 9 - "app/page.tsx"
Cohesion: 0.10
Nodes (25): HomePage(), PHASE_LABEL, PHASE_TONE, CommandLine(), StatusDot(), AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS (+17 more)

### Community 10 - "constants.ts"
Cohesion: 0.08
Nodes (26): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction, AuditStatus (+18 more)

### Community 11 - "raise.ts"
Cohesion: 0.16
Nodes (18): POST(), ApprovableAction, ApprovalDecision, decisionApproves(), requiresApproval(), DecisionResult, raiseApproval(), RaiseOutcome (+10 more)

### Community 12 - "[id]/page.tsx"
Cohesion: 0.15
Nodes (20): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+12 more)

### Community 13 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 14 - "activity/page.tsx"
Cohesion: 0.20
Nodes (15): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+7 more)

### Community 15 - "ui.tsx"
Cohesion: 0.19
Nodes (15): AdminFirmsPage(), metadata, AiWorkspacePage(), featureLabel(), metadata, Badge(), badgeTone, Callout() (+7 more)

### Community 16 - "login/actions.ts"
Cohesion: 0.21
Nodes (14): safeRedirectTarget(), signInAction(), signOutAction(), newCorrelationId(), consumeAttempt(), RateLimitResult, resetAllAttempts(), resetAttempts() (+6 more)

### Community 17 - "seed.ts"
Cohesion: 0.23
Nodes (11): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, encode() (+3 more)

### Community 18 - "app-shell.tsx"
Cohesion: 0.16
Nodes (10): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+2 more)

### Community 19 - "dependencies"
Cohesion: 0.15
Nodes (13): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+5 more)

### Community 20 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 21 - "brand.tsx"
Cohesion: 0.19
Nodes (4): metadata, metadata, OrchelioWordmark(), WordmarkProps

### Community 22 - "intake/page.tsx"
Cohesion: 0.27
Nodes (10): IntakePage(), metadata, metadata, TasksPage(), formatDate(), requireMatterAccess(), requestScoped, requestNow (+2 more)

### Community 23 - "login/page.tsx"
Cohesion: 0.24
Nodes (8): SignInState, INITIAL, LoginForm(), LoginPage(), metadata, safeNext(), DemoAccount, visibleDemoAccounts()

### Community 24 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 25 - "approvals/actions.ts"
Cohesion: 0.26
Nodes (10): POST(), APPROVABLE_ACTIONS, APPROVAL_DECISIONS, DECISIONS_REQUIRING_NOTE, isApprovalDecision(), rulesWithoutActions(), LockedApproval, RiskLevel (+2 more)

### Community 26 - "matters/page.tsx"
Cohesion: 0.27
Nodes (10): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+2 more)

### Community 27 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 28 - "data/documents.ts"
Cohesion: 0.18
Nodes (6): POST(), POST(), addDocument(), NewDocument, setDocumentVerified(), touchMatter()

### Community 29 - "new/page.tsx"
Cohesion: 0.25
Nodes (8): metadata, PageProps, requireWorkspace(), requireWorkspacePermission(), GENERIC_MATTER_STATUSES, parseJsonObject(), parseStringArray(), toJsonColumn()

### Community 30 - "approvals/page.tsx"
Cohesion: 0.33
Nodes (9): ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, actionLabel(), approvalReason(), approvalActions() (+1 more)

### Community 31 - "approval-ui.tsx"
Cohesion: 0.29
Nodes (8): ApprovalCard(), ApprovalCardData, ApprovalStatusBadge(), resourceHref(), RISK_TONE, STATUS_TONE, decisionLabel(), requiresNote()

### Community 33 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 34 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 35 - "documents/page.tsx"
Cohesion: 0.36
Nodes (8): DocumentsPage(), metadata, one(), PageProps, fileSize(), listDocuments(), listMatters(), categoryLabel()

### Community 36 - "matters.ts"
Cohesion: 0.25
Nodes (7): createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 38 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 39 - "upload-panel.tsx"
Cohesion: 0.29
Nodes (5): ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS, DocumentCategory

### Community 40 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 41 - "communications.ts"
Cohesion: 0.33
Nodes (3): DraftFilters, listDrafts(), NewDraft

### Community 42 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 44 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **331 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `metadata` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `prisma.ts` to `dependencies`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `dependencies` to `prisma.ts`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _331 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051201671891327065 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09923409923409923 - nodes in this community are weakly interconnected._
- **Should `[step]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056338028169014086 - nodes in this community are weakly interconnected._