# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 866 nodes · 1825 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b55dc7c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyst.ts
- [step]/page.tsx
- dashboard/page.tsx
- app-shell.tsx
- scripts
- firm-scope.ts
- actions.ts
- compilerOptions
- allow
- devDependencies
- constants.ts
- new/page.tsx
- [id]/page.tsx
- statistics.ts
- run.ts
- env.ts
- analysis-ui.tsx
- ui.tsx
- scope.ts
- codemap.mjs
- intake/page.tsx
- docs-check.mjs
- ai/page.tsx
- matters/page.tsx
- doctor.mjs
- matters.ts
- deny
- app.json
- documents/page.tsx
- prisma.ts
- matters.spec.ts
- settings.json
- data/documents.ts
- onboarding.spec.ts
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
3. `compilerOptions` - 22 edges
4. `currentSession` - 21 edges
5. `recordAuditEvent()` - 19 edges
6. `Callout()` - 18 edges
7. `POST()` - 17 edges
8. `activeFirmFor()` - 16 edges
9. `Card()` - 15 edges
10. `analyseMatter()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `AdminFirmsPage()` --calls--> `requirePlatformAdmin()`  [EXTRACTED]
  src/app/(app)/admin/firms/page.tsx → src/lib/auth/guards.ts
- `AdminFirmsPage()` --calls--> `practiceAreaLabel()`  [EXTRACTED]
  src/app/(app)/admin/firms/page.tsx → src/lib/practice-areas.ts
- `OnboardingStepPage()` --calls--> `loadDraft()`  [EXTRACTED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/data/onboarding.ts

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "analyst.ts"
Cohesion: 0.05
Nodes (74): DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions() (+66 more)

### Community 1 - "[step]/page.tsx"
Cohesion: 0.06
Nodes (61): POST(), stringList(), Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), FirmSwitcher() (+53 more)

### Community 2 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (51): ADR-0006, POST(), POST(), POST(), metadata, AppLayout(), OnboardingPage(), OnboardingStepPage() (+43 more)

### Community 3 - "app-shell.tsx"
Cohesion: 0.06
Nodes (32): ADR-0011, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), metadata (+24 more)

### Community 4 - "scripts"
Cohesion: 0.04
Nodes (48): next, dependencies, next, @prisma/adapter-better-sqlite3, react, react-dom, server-only, description (+40 more)

### Community 5 - "firm-scope.ts"
Cohesion: 0.10
Nodes (27): @prisma/client, @prisma/client, CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache() (+19 more)

### Community 6 - "actions.ts"
Cohesion: 0.10
Nodes (27): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+19 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 8 - "allow"
Cohesion: 0.06
Nodes (35): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+27 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 10 - "constants.ts"
Cohesion: 0.08
Nodes (27): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction, AuditStatus (+19 more)

### Community 11 - "new/page.tsx"
Cohesion: 0.15
Nodes (20): ADR-0002, metadata, NewMatterPage(), PageProps, requireWorkspace(), requireWorkspacePermission(), GENERIC_MATTER_STATUSES, BY_PRACTICE_AREA (+12 more)

### Community 12 - "[id]/page.tsx"
Cohesion: 0.14
Nodes (19): aiFeatureLabel(), MatterPage(), metadata, PageProps, PLANNED_TABS, TABS, ACCEPT, Chosen (+11 more)

### Community 13 - "statistics.ts"
Cohesion: 0.15
Nodes (17): DashboardPage(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, ADR-0009, widgetsFor() (+9 more)

### Community 14 - "run.ts"
Cohesion: 0.19
Nodes (12): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, beginAnalysis() (+4 more)

### Community 15 - "env.ts"
Cohesion: 0.16
Nodes (14): AI_PROVIDERS, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum(), ServerEnv (+6 more)

### Community 16 - "analysis-ui.tsx"
Cohesion: 0.17
Nodes (14): AnalysisStatus(), AnalysisWarnings(), ContradictionCard(), KeyFactRow(), QuestionList(), REVIEW_TONE, ReviewPanel(), sourceKindLabel() (+6 more)

### Community 17 - "ui.tsx"
Cohesion: 0.21
Nodes (10): AdminFirmsPage(), metadata, Badge(), badgeTone, Callout(), calloutTone, Card(), DataRow() (+2 more)

### Community 18 - "scope.ts"
Cohesion: 0.18
Nodes (4): FirmScope, SearchResult, formatCost(), UsageSummary

### Community 19 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 20 - "intake/page.tsx"
Cohesion: 0.27
Nodes (10): IntakePage(), metadata, metadata, TasksPage(), formatDate(), requireMatterAccess(), requestScoped, requestNow (+2 more)

### Community 21 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 22 - "ai/page.tsx"
Cohesion: 0.27
Nodes (9): AiWorkspacePage(), featureLabel(), metadata, ReviewStatus, reviewStatusLabel(), listRecentAnalyses(), parseJsonObject(), parseStringArray() (+1 more)

### Community 23 - "matters/page.tsx"
Cohesion: 0.27
Nodes (10): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+2 more)

### Community 24 - "doctor.mjs"
Cohesion: 0.20
Nodes (7): databaseFile, graphReport, [major], results, ROOT, symbol, width

### Community 25 - "matters.ts"
Cohesion: 0.22
Nodes (7): POST(), createMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 26 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 27 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 28 - "documents/page.tsx"
Cohesion: 0.39
Nodes (7): DocumentsPage(), metadata, one(), PageProps, fileSize(), listDocuments(), listMatters()

### Community 29 - "prisma.ts"
Cohesion: 0.25
Nodes (3): ActivityFilters, listActivity(), globalForPrisma

### Community 31 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 33 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **316 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `metadata` (+311 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `dependencies` connect `scripts` to `firm-scope.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _316 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05030643513789581 - nodes in this community are weakly interconnected._
- **Should `[step]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05561105561105561 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08713850837138508 - nodes in this community are weakly interconnected._