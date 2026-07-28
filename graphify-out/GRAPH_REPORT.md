# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 547 nodes · 1007 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e56ea9f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app-shell.tsx
- [step]/page.tsx
- dashboard/page.tsx
- prisma.ts
- actions.ts
- compilerOptions
- devDependencies
- firm-scope.ts
- scripts
- constants.ts
- onboarding.ts
- env.ts
- dependencies
- codemap.mjs
- doctor.mjs
- package.json
- onboarding.spec.ts
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `scripts` - 30 edges
2. `compilerOptions` - 22 edges
3. `DashboardPage()` - 17 edges
4. `POST()` - 17 edges
5. `currentSession` - 17 edges
6. `recordAuditEvent()` - 14 edges
7. `practiceAreaLabel()` - 13 edges
8. `activeFirmFor()` - 12 edges
9. `FirmScope` - 12 edges
10. `signInAction()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `main()` --references--> `@prisma/client`  [EXTRACTED]
  prisma/seed.ts → package.json
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/lib/auth/password.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `createTwoFirmFixture()` --calls--> `withFirmScopeGuard()`  [EXTRACTED]
  tests/integration/fixtures.ts → src/lib/data/firm-scope.ts

## Import Cycles
- None detected.

## Communities (29 total, 5 thin omitted)

### Community 0 - "app-shell.tsx"
Cohesion: 0.06
Nodes (37): metadata, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), metadata (+29 more)

### Community 1 - "[step]/page.tsx"
Cohesion: 0.07
Nodes (46): AdminFirmsPage(), Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), FirmSwitcher(), CheckboxOption() (+38 more)

### Community 2 - "dashboard/page.tsx"
Cohesion: 0.10
Nodes (39): DashboardPage(), metadata, AppLayout(), OnboardingPage(), OnboardingStepPage(), activeFirmFor(), resolveActiveFirm(), scopeFor() (+31 more)

### Community 3 - "prisma.ts"
Cohesion: 0.06
Nodes (14): BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, WidgetTone, ActivityFilters, GuardedPrismaClient (+6 more)

### Community 4 - "actions.ts"
Cohesion: 0.08
Nodes (35): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+27 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 6 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 7 - "firm-scope.ts"
Cohesion: 0.12
Nodes (23): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError (+15 more)

### Community 8 - "scripts"
Cohesion: 0.07
Nodes (30): scripts, build, check, codemap, db:generate, db:migrate, db:reset, db:studio (+22 more)

### Community 9 - "constants.ts"
Cohesion: 0.08
Nodes (28): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_EXTENSIONS, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction (+20 more)

### Community 10 - "onboarding.ts"
Cohesion: 0.14
Nodes (22): POST(), POST(), stringList(), allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor() (+14 more)

### Community 11 - "env.ts"
Cohesion: 0.14
Nodes (17): HomePage(), AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv() (+9 more)

### Community 12 - "dependencies"
Cohesion: 0.15
Nodes (13): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+5 more)

### Community 13 - "codemap.mjs"
Cohesion: 0.20
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, walk()

### Community 14 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, [major], newestSource, newestSourceChange(), results, ROOT, run(), symbol (+1 more)

### Community 15 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 16 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **206 isolated node(s):** `eslintConfig`, `nextConfig`, `PORT`, `config`, `PRACTICE_AREAS` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `dependencies` to `actions.ts`, `firm-scope.ts`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`, `dependencies`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `PORT` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059322033898305086 - nodes in this community are weakly interconnected._
- **Should `[step]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06610169491525424 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09506531204644413 - nodes in this community are weakly interconnected._