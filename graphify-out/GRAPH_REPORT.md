# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1128 nodes · 2616 edges · 68 communities (59 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9091c91f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- approvals/page.tsx
- firm-scope.ts
- fields.ts
- app/page.tsx
- settings.ts
- login/actions.ts
- scripts
- devDependencies
- allow
- compilerOptions
- matters/page.tsx
- [step]/page.tsx
- ai/page.tsx
- dashboard/page.tsx
- run.ts
- settings/page.tsx
- [id]/page.tsx
- platform.ts
- types.ts
- activity/page.tsx
- analyst.ts
- onboarding/config.ts
- parseIsoDate
- provider.ts
- codemap.mjs
- reviewer.ts
- docs-check.mjs
- ai-analyst.test.ts
- onboarding.ts
- env.ts
- audit.mjs
- doctor.mjs
- scope.ts
- acceptance-check.mjs
- workspace.ts
- prisma.ts
- deny
- app.json
- firms/page.tsx
- data/matters.ts
- skills-check.mjs
- demo.ts
- settings.json
- practiceAreaLabel
- approvals.spec.ts
- onboarding.spec.ts
- accessibility.spec.ts
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
1. `allow` - 39 edges
2. `scripts` - 35 edges
3. `Callout()` - 27 edges
4. `recordAuditEvent()` - 27 edges
5. `currentSession` - 27 edges
6. `Badge()` - 22 edges
7. `Card()` - 22 edges
8. `compilerOptions` - 22 edges
9. `activeFirmFor()` - 21 edges
10. `can()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `demo()` --references--> `DEMO_MATTERS`  [EXTRACTED]
  tests/unit/ai-analyst.test.ts → src/lib/demo/matters.ts

## Import Cycles
- None detected.

## Communities (68 total, 9 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (76): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), stringList() (+68 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.08
Nodes (47): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard() (+39 more)

### Community 2 - "firm-scope.ts"
Cohesion: 0.06
Nodes (41): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+33 more)

### Community 3 - "fields.ts"
Cohesion: 0.06
Nodes (45): ADR-0002, POST(), POST(), ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS, BY_PRACTICE_AREA (+37 more)

### Community 4 - "app/page.tsx"
Cohesion: 0.06
Nodes (28): ADR-0011, metadata, AdminSystemPage(), metadata, LoginPage(), metadata, safeNext(), metadata (+20 more)

### Community 5 - "settings.ts"
Cohesion: 0.08
Nodes (42): ADR-0015, back(), POST(), back(), POST(), stringList(), AppLayout(), ADMIN_NAV (+34 more)

### Community 6 - "login/actions.ts"
Cohesion: 0.08
Nodes (34): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget(), signInAction() (+26 more)

### Community 7 - "scripts"
Cohesion: 0.05
Nodes (41): description, engines, node, name, private, scripts, acceptance:check, build (+33 more)

### Community 8 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 9 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 10 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 11 - "matters/page.tsx"
Cohesion: 0.14
Nodes (15): metadata, NewMatterPage(), PageProps, MattersPage(), metadata, one(), PageProps, MatterLink() (+7 more)

### Community 12 - "[step]/page.tsx"
Cohesion: 0.10
Nodes (19): Answers, metadata, PageProps, CheckboxOption(), LockIcon(), ProgressBar(), StepActions(), WorkflowPreview() (+11 more)

### Community 13 - "ai/page.tsx"
Cohesion: 0.20
Nodes (15): AiWorkspacePage(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage() (+7 more)

### Community 14 - "dashboard/page.tsx"
Cohesion: 0.17
Nodes (12): metadata, metadata, metadata, metadata, Badge(), badgeTone, Callout(), calloutTone (+4 more)

### Community 15 - "run.ts"
Cohesion: 0.13
Nodes (15): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+7 more)

### Community 16 - "settings/page.tsx"
Cohesion: 0.16
Nodes (16): ADR-0016, metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules(), MemberList() (+8 more)

### Community 17 - "[id]/page.tsx"
Cohesion: 0.16
Nodes (19): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+11 more)

### Community 18 - "platform.ts"
Cohesion: 0.19
Nodes (15): PRACTICE_AREAS, POST(), CreatedFirm, createFirm(), CreateFirmOutcome, looksLikeRealAddress(), NewFirmInput, NewFirmValidation (+7 more)

### Community 19 - "types.ts"
Cohesion: 0.11
Nodes (18): KeyFactRow(), AnalysisDocument, CONFIDENCE_BY_SUPPORT, Contradiction, FactSource, KeyFact, MissingDocument, Question (+10 more)

### Community 20 - "activity/page.tsx"
Cohesion: 0.16
Nodes (19): ActivityPage(), metadata, one(), PageProps, metadata, TasksPage(), ActivityDetail(), activityLabel() (+11 more)

### Community 21 - "analyst.ts"
Cohesion: 0.19
Nodes (17): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+9 more)

### Community 22 - "onboarding/config.ts"
Cohesion: 0.25
Nodes (15): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+7 more)

### Community 23 - "parseIsoDate"
Cohesion: 0.33
Nodes (13): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), labelOf(), build(), formatWritten(), isoDateWithin() (+5 more)

### Community 24 - "provider.ts"
Cohesion: 0.30
Nodes (7): AIProvider, MockAIProvider, UnavailableAIProvider, AnalysisReviewInput, AnalysisReviewResult, MatterAnalysisInput, MatterAnalysisResult

### Community 25 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 26 - "reviewer.ts"
Cohesion: 0.21
Nodes (11): analystInternals, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), ReviewCheck, ReviewIssue, CONFLICTED (+3 more)

### Community 27 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 28 - "ai-analyst.test.ts"
Cohesion: 0.24
Nodes (10): STANDING_WARNINGS, SUPPORT_LEVELS, DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, ALL_FEATURES, demo() (+2 more)

### Community 29 - "onboarding.ts"
Cohesion: 0.24
Nodes (10): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), EMPTY_ANSWERS, ensureConfiguration(), matterTypeOptions() (+2 more)

### Community 30 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 31 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 32 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 33 - "scope.ts"
Cohesion: 0.22
Nodes (4): DraftFilters, NewDraft, FirmScope, SearchResult

### Community 34 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 35 - "workspace.ts"
Cohesion: 0.19
Nodes (17): DocumentsPage(), metadata, one(), PageProps, IntakePage(), metadata, fileSize(), formatDate() (+9 more)

### Community 36 - "prisma.ts"
Cohesion: 0.20
Nodes (3): NewDocument, GuardedPrismaClient, globalForPrisma

### Community 37 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 38 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 39 - "firms/page.tsx"
Cohesion: 0.36
Nodes (8): AdminDemoPage(), AdminFirmsPage(), metadata, one(), PageProps, listFirmsForAdministration(), PlatformCounts, creatablePracticeAreas()

### Community 40 - "data/matters.ts"
Cohesion: 0.25
Nodes (7): createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 41 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 42 - "demo.ts"
Cohesion: 0.33
Nodes (6): POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor()

### Community 43 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 44 - "practiceAreaLabel"
Cohesion: 0.40
Nodes (5): StepMatterTypes(), StepSummary(), FirmSwitcher(), ROLE_LABELS, practiceAreaLabel()

### Community 46 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 48 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 49 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **380 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `PageProps` (+375 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `dependencies` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _380 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06624785836664764 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07743496672716274 - nodes in this community are weakly interconnected._
- **Should `firm-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._
- **Should `fields.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05805515239477504 - nodes in this community are weakly interconnected._