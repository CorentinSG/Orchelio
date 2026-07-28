# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 600 nodes · 1059 edges · 32 communities (26 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea5fa637`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard/page.tsx
- [step]/page.tsx
- app-shell.tsx
- prisma.ts
- firm-scope.ts
- actions.ts
- compilerOptions
- allow
- devDependencies
- constants.ts
- scripts
- env.ts
- dependencies
- codemap.mjs
- doctor.mjs
- deny
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
2. `scripts` - 30 edges
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
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `createTwoFirmFixture()` --calls--> `withFirmScopeGuard()`  [EXTRACTED]
  tests/integration/fixtures.ts → src/lib/data/firm-scope.ts

## Import Cycles
- None detected.

## Communities (32 total, 6 thin omitted)

### Community 0 - "dashboard/page.tsx"
Cohesion: 0.08
Nodes (53): POST(), POST(), stringList(), DashboardPage(), metadata, AppLayout(), OnboardingPage(), OnboardingStepPage() (+45 more)

### Community 1 - "[step]/page.tsx"
Cohesion: 0.06
Nodes (52): Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), FirmSwitcher(), CheckboxOption(), Field() (+44 more)

### Community 2 - "app-shell.tsx"
Cohesion: 0.06
Nodes (38): metadata, AdminFirmsPage(), metadata, metadata, viewport, LoginPage(), metadata, safeNext() (+30 more)

### Community 3 - "prisma.ts"
Cohesion: 0.06
Nodes (14): BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, WidgetTone, ActivityFilters, GuardedPrismaClient (+6 more)

### Community 4 - "firm-scope.ts"
Cohesion: 0.09
Nodes (29): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError (+21 more)

### Community 5 - "actions.ts"
Cohesion: 0.09
Nodes (29): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+21 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 7 - "allow"
Cohesion: 0.06
Nodes (35): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+27 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 9 - "constants.ts"
Cohesion: 0.07
Nodes (29): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_EXTENSIONS, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction (+21 more)

### Community 10 - "scripts"
Cohesion: 0.07
Nodes (30): scripts, build, check, codemap, db:generate, db:migrate, db:reset, db:studio (+22 more)

### Community 11 - "env.ts"
Cohesion: 0.14
Nodes (17): HomePage(), AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv() (+9 more)

### Community 12 - "dependencies"
Cohesion: 0.15
Nodes (13): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+5 more)

### Community 13 - "codemap.mjs"
Cohesion: 0.18
Nodes (9): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target (+1 more)

### Community 14 - "doctor.mjs"
Cohesion: 0.20
Nodes (7): databaseFile, graphReport, [major], results, ROOT, symbol, width

### Community 15 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 16 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 17 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 18 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **249 isolated node(s):** `eslintConfig`, `PORT`, `config`, `PRACTICE_AREAS`, `Step` (+244 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `dependencies` to `firm-scope.ts`, `actions.ts`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`, `dependencies`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _249 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07967806841046278 - nodes in this community are weakly interconnected._
- **Should `[step]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05839727195225917 - nodes in this community are weakly interconnected._
- **Should `app-shell.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05792349726775956 - nodes in this community are weakly interconnected._