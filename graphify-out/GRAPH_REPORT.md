# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 738 nodes · 1466 edges · 37 communities (29 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec20d4ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- session.ts
- [id]/page.tsx
- dashboard/page.tsx
- [step]/page.tsx
- scripts
- app-shell.tsx
- actions.ts
- compilerOptions
- allow
- devDependencies
- firm-scope.ts
- constants.ts
- onboarding.ts
- env.ts
- fields.ts
- codemap.mjs
- docs-check.mjs
- doctor.mjs
- deny
- app.json
- matters.spec.ts
- settings.json
- onboarding.spec.ts
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
4. `currentSession` - 20 edges
5. `POST()` - 17 edges
6. `recordAuditEvent()` - 17 edges
7. `Callout()` - 16 edges
8. `activeFirmFor()` - 15 edges
9. `Card()` - 13 edges
10. `FirmScope` - 13 edges

## Surprising Connections (you probably didn't know these)
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `AdminFirmsPage()` --calls--> `requirePlatformAdmin()`  [EXTRACTED]
  src/app/(app)/admin/firms/page.tsx → src/lib/auth/guards.ts
- `OnboardingStepPage()` --calls--> `matterTypeOptions()`  [EXTRACTED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/data/onboarding.ts
- `StepMatterTypes()` --calls--> `practiceAreaLabel()`  [EXTRACTED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/practice-areas.ts
- `StepSummary()` --indirect_call--> `practiceAreaLabel()`  [INFERRED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/practice-areas.ts

## Import Cycles
- None detected.

## Communities (37 total, 8 thin omitted)

### Community 0 - "session.ts"
Cohesion: 0.08
Nodes (56): POST(), POST(), POST(), POST(), stringList(), AppLayout(), OnboardingPage(), OnboardingStepPage() (+48 more)

### Community 1 - "[id]/page.tsx"
Cohesion: 0.07
Nodes (57): metadata, DocumentsPage(), metadata, one(), PageProps, IntakePage(), metadata, MatterPage() (+49 more)

### Community 2 - "dashboard/page.tsx"
Cohesion: 0.05
Nodes (30): DashboardPage(), metadata, BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, ADR-0009 (+22 more)

### Community 3 - "[step]/page.tsx"
Cohesion: 0.07
Nodes (44): AdminFirmsPage(), Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), FirmSwitcher(), CheckboxOption() (+36 more)

### Community 4 - "scripts"
Cohesion: 0.04
Nodes (48): next, dependencies, next, @prisma/adapter-better-sqlite3, react, react-dom, server-only, description (+40 more)

### Community 5 - "app-shell.tsx"
Cohesion: 0.06
Nodes (24): ADR-0011, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), metadata (+16 more)

### Community 6 - "actions.ts"
Cohesion: 0.09
Nodes (29): DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS (+21 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 8 - "allow"
Cohesion: 0.06
Nodes (35): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+27 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 10 - "firm-scope.ts"
Cohesion: 0.11
Nodes (25): @prisma/client, @prisma/client, CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache() (+17 more)

### Community 11 - "constants.ts"
Cohesion: 0.07
Nodes (31): ACCEPT, Chosen, UploadPanel(), AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_EXTENSIONS, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS (+23 more)

### Community 12 - "onboarding.ts"
Cohesion: 0.13
Nodes (19): metadata, NewMatterPage(), PageProps, requireWorkspace(), requireWorkspacePermission(), GENERIC_MATTER_STATUSES, allMatterTypes, allPracticeAreas (+11 more)

### Community 13 - "env.ts"
Cohesion: 0.14
Nodes (17): HomePage(), AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv() (+9 more)

### Community 14 - "fields.ts"
Cohesion: 0.17
Nodes (18): ADR-0002, POST(), createMatter(), nextReference(), EMPLOYMENT_CATEGORIES, IMMIGRATION_CATEGORIES, BY_PRACTICE_AREA, editableFieldsFor() (+10 more)

### Community 15 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 16 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 17 - "doctor.mjs"
Cohesion: 0.20
Nodes (7): databaseFile, graphReport, [major], results, ROOT, symbol, width

### Community 18 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 19 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 21 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 22 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **295 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `metadata` (+290 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `dashboard/page.tsx`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `dependencies` connect `scripts` to `firm-scope.ts`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _295 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08280701754385965 - nodes in this community are weakly interconnected._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06961770623742455 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05288207297726071 - nodes in this community are weakly interconnected._