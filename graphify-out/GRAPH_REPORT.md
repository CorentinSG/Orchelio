# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 953 nodes · 2131 edges · 50 communities (39 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27e56be7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyst.ts
- dashboard/page.tsx
- [id]/page.tsx
- constants.ts
- [step]/page.tsx
- firm-scope.ts
- new/page.tsx
- scripts
- compilerOptions
- allow
- devDependencies
- login/actions.ts
- ui.tsx
- run.ts
- statistics.ts
- scope.ts
- Callout
- app-shell.tsx
- codemap.mjs
- login/page.tsx
- docs-check.mjs
- ai/page.tsx
- env.ts
- prisma.ts
- doctor.mjs
- deny
- app.json
- matters.ts
- loading-screen.tsx
- settings.json
- data/documents.ts
- approvals.spec.ts
- onboarding.spec.ts
- app-config.ts
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
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `AdminFirmsPage()` --calls--> `requirePlatformAdmin()`  [EXTRACTED]
  src/app/(app)/admin/firms/page.tsx → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (50 total, 11 thin omitted)

### Community 0 - "analyst.ts"
Cohesion: 0.05
Nodes (70): analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline() (+62 more)

### Community 1 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (57): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), stringList() (+49 more)

### Community 2 - "[id]/page.tsx"
Cohesion: 0.05
Nodes (69): ActivityPage(), metadata, one(), PageProps, DocumentsPage(), metadata, one(), PageProps (+61 more)

### Community 3 - "constants.ts"
Cohesion: 0.05
Nodes (69): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard() (+61 more)

### Community 4 - "[step]/page.tsx"
Cohesion: 0.06
Nodes (56): AdminFirmsPage(), Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), FirmSwitcher(), CheckboxOption() (+48 more)

### Community 5 - "firm-scope.ts"
Cohesion: 0.06
Nodes (40): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+32 more)

### Community 6 - "new/page.tsx"
Cohesion: 0.08
Nodes (34): ADR-0002, POST(), POST(), metadata, NewMatterPage(), PageProps, ACCEPT, Chosen (+26 more)

### Community 7 - "scripts"
Cohesion: 0.05
Nodes (37): description, engines, node, name, private, scripts, build, check (+29 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 9 - "allow"
Cohesion: 0.06
Nodes (35): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+27 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 11 - "login/actions.ts"
Cohesion: 0.10
Nodes (26): DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS (+18 more)

### Community 12 - "ui.tsx"
Cohesion: 0.16
Nodes (17): metadata, HomePage(), PHASE_LABEL, PHASE_TONE, Badge(), badgeTone, calloutTone, Card() (+9 more)

### Community 13 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 14 - "statistics.ts"
Cohesion: 0.14
Nodes (17): DashboardPage(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, ADR-0009, widgetsFor() (+9 more)

### Community 15 - "scope.ts"
Cohesion: 0.16
Nodes (4): DraftFilters, NewDraft, FirmScope, SearchResult

### Community 16 - "Callout"
Cohesion: 0.20
Nodes (5): metadata, metadata, OrchelioWordmark(), WordmarkProps, Callout()

### Community 17 - "app-shell.tsx"
Cohesion: 0.16
Nodes (10): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+2 more)

### Community 18 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 19 - "login/page.tsx"
Cohesion: 0.23
Nodes (9): SignInState, INITIAL, LoginForm(), LoginPage(), metadata, safeNext(), DEMO_ACCOUNTS, DemoAccount (+1 more)

### Community 20 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 21 - "ai/page.tsx"
Cohesion: 0.27
Nodes (8): AiWorkspacePage(), featureLabel(), metadata, ReviewStatus, reviewStatusLabel(), listRecentAnalyses(), formatCost(), UsageSummary

### Community 22 - "env.ts"
Cohesion: 0.24
Nodes (8): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum()

### Community 23 - "prisma.ts"
Cohesion: 0.25
Nodes (8): ServerEnv, globalForPrisma, DatabaseStatus, describeFailure(), getDatabaseStatus(), getSystemStatus(), MigrationRow, SystemStatus

### Community 24 - "doctor.mjs"
Cohesion: 0.20
Nodes (7): databaseFile, graphReport, [major], results, ROOT, symbol, width

### Community 25 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 26 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 27 - "matters.ts"
Cohesion: 0.25
Nodes (7): createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 29 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 31 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 33 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **331 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `metadata` (+326 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Why does `dependencies` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _331 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05479059093516925 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09021451660299735 - nodes in this community are weakly interconnected._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05450165612767239 - nodes in this community are weakly interconnected._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05092592592592592 - nodes in this community are weakly interconnected._