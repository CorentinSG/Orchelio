# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 622 nodes · 1077 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c0b6d99b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard/page.tsx
- app/page.tsx
- [step]/page.tsx
- session.ts
- actions.ts
- onboarding.ts
- compilerOptions
- allow
- devDependencies
- firm-scope.ts
- scripts
- constants.ts
- dependencies
- codemap.mjs
- docs-check.mjs
- env.ts
- doctor.mjs
- deny
- app.json
- package.json
- settings.json
- onboarding.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `allow` - 36 edges
2. `scripts` - 31 edges
3. `compilerOptions` - 22 edges
4. `DashboardPage()` - 17 edges
5. `POST()` - 17 edges
6. `currentSession` - 17 edges
7. `recordAuditEvent()` - 14 edges
8. `practiceAreaLabel()` - 13 edges
9. `activeFirmFor()` - 12 edges
10. `FirmScope` - 12 edges

## Surprising Connections (you probably didn't know these)
- `main()` --references--> `@prisma/client`  [EXTRACTED]
  prisma/seed.ts → package.json
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/lib/auth/password.ts
- `StepSummary()` --indirect_call--> `practiceAreaLabel()`  [INFERRED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/practice-areas.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts

## Import Cycles
- None detected.

## Communities (35 total, 6 thin omitted)

### Community 0 - "dashboard/page.tsx"
Cohesion: 0.05
Nodes (24): DashboardPage(), metadata, BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, widgetsFor() (+16 more)

### Community 1 - "app/page.tsx"
Cohesion: 0.06
Nodes (36): metadata, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), metadata (+28 more)

### Community 2 - "[step]/page.tsx"
Cohesion: 0.07
Nodes (41): Answers, metadata, PageProps, StepSummary(), CheckboxOption(), Field(), LockIcon(), ProgressBar() (+33 more)

### Community 3 - "session.ts"
Cohesion: 0.08
Nodes (37): AdminFirmsPage(), AppLayout(), StepMatterTypes(), ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED (+29 more)

### Community 4 - "actions.ts"
Cohesion: 0.08
Nodes (35): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+27 more)

### Community 5 - "onboarding.ts"
Cohesion: 0.13
Nodes (28): POST(), POST(), stringList(), OnboardingPage(), OnboardingStepPage(), activeFirmFor(), resolveActiveFirm(), scopeFor() (+20 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 7 - "allow"
Cohesion: 0.06
Nodes (35): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+27 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 9 - "firm-scope.ts"
Cohesion: 0.12
Nodes (23): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError (+15 more)

### Community 10 - "scripts"
Cohesion: 0.06
Nodes (31): scripts, build, check, codemap, db:generate, db:migrate, db:reset, db:studio (+23 more)

### Community 11 - "constants.ts"
Cohesion: 0.08
Nodes (28): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_EXTENSIONS, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction (+20 more)

### Community 12 - "dependencies"
Cohesion: 0.15
Nodes (13): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+5 more)

### Community 13 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 14 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 15 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 16 - "doctor.mjs"
Cohesion: 0.20
Nodes (7): databaseFile, graphReport, [major], results, ROOT, symbol, width

### Community 17 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 18 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 19 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 20 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 21 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **269 isolated node(s):** `eslintConfig`, `PORT`, `config`, `PRACTICE_AREAS`, `Step` (+264 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `dependencies` to `firm-scope.ts`, `actions.ts`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `dashboard/page.tsx`, `dependencies`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _269 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0546448087431694 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06291591046581972 - nodes in this community are weakly interconnected._
- **Should `[step]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07337526205450734 - nodes in this community are weakly interconnected._