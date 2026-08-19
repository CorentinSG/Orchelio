# Graph Report - .  (2026-08-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1340 nodes · 3204 edges · 79 communities (64 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7db4615b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ai/page.tsx
- approvals/page.tsx
- prisma.ts
- run.ts
- analyst.ts
- devDependencies
- allow
- scripts
- login/actions.ts
- compilerOptions
- app-shell.tsx
- confidentiality-check.mjs
- statistics.ts
- [id]/page.tsx
- local-provider.ts
- mistral-provider.ts
- audit.ts
- Callout
- onboarding/config.ts
- dashboard/page.tsx
- [step]/page.tsx
- practice-areas.ts
- firms.ts
- firms/page.tsx
- settings.ts
- constants.ts
- ui.tsx
- matters/page.tsx
- settings/page.tsx
- start/page.tsx
- start/route.ts
- analysis-ui.tsx
- ai/dates.ts
- local-provider.test.ts
- reviewer.ts
- fields.ts
- dependencies
- codemap.mjs
- firm-context.ts
- docs-check.mjs
- doctor.mjs
- audit.mjs
- acceptance-check.mjs
- documents/page.tsx
- deny
- app.json
- approvals.spec.ts
- loading-screen.tsx
- efficiency.spec.ts
- package.json
- skills-check.mjs
- settings.json
- members/route.ts
- onboarding.spec.ts
- ai-smoke.mjs
- accessibility.spec.ts
- app/layout.tsx
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- 20260730163455_separate_approver/migration.sql
- 20260730180000_superseded_approvals/migration.sql
- 20260806162127_usage_record_carries_class_and_microeuros/migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 37 edges
3. `Callout()` - 29 edges
4. `recordAuditEvent()` - 25 edges
5. `currentSession` - 25 edges
6. `Card()` - 24 edges
7. `Badge()` - 23 edges
8. `can()` - 23 edges
9. `analyseMatter()` - 23 edges
10. `compilerOptions` - 22 edges

## Surprising Connections (you probably didn't know these)
- `acceptableSummary()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/local-provider.test.ts → src/lib/ai/analyst.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `acceptableSummary()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/mistral-provider.test.ts → src/lib/ai/analyst.ts
- `matterInput()` --references--> `DEMO_MATTERS`  [EXTRACTED]
  tests/integration/local-model.test.ts → src/lib/demo/matters.ts

## Import Cycles
- None detected.

## Communities (79 total, 15 thin omitted)

### Community 0 - "ai/page.tsx"
Cohesion: 0.05
Nodes (59): ADR-0021, AiWorkspacePage(), analysisStateLabel(), featureLabel(), metadata, aiFeatureLabel(), StepAiFeatures(), formatTokens() (+51 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (61): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+53 more)

### Community 2 - "prisma.ts"
Cohesion: 0.06
Nodes (35): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError (+27 more)

### Community 3 - "run.ts"
Cohesion: 0.06
Nodes (32): ADR-0008, POST(), POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, summariseForApproval() (+24 more)

### Community 4 - "analyst.ts"
Cohesion: 0.08
Nodes (38): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+30 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 6 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 7 - "scripts"
Cohesion: 0.05
Nodes (37): scripts, acceptance:check, ai:smoke, build, check, codemap, confidentiality:check, db:generate (+29 more)

### Community 8 - "login/actions.ts"
Cohesion: 0.09
Nodes (28): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+20 more)

### Community 9 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 10 - "app-shell.tsx"
Cohesion: 0.09
Nodes (31): ADR-0015, ADR-0018, back(), POST(), stringList(), signOutAction(), ADMIN_NAV, ADMIN_PLANNED (+23 more)

### Community 11 - "confidentiality-check.mjs"
Cohesion: 0.06
Nodes (24): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, DISPLAY_MODULES, EGRESS_ALLOWED, EGRESS_PATTERNS (+16 more)

### Community 12 - "statistics.ts"
Cohesion: 0.09
Nodes (25): ADR-0009, DashboardPage(), ACCEPT, Chosen, UploadPanel(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS (+17 more)

### Community 13 - "[id]/page.tsx"
Cohesion: 0.11
Nodes (25): ActivityPage(), metadata, one(), PageProps, metadata, PageProps, metadata, ActivityDetail() (+17 more)

### Community 14 - "local-provider.ts"
Cohesion: 0.14
Nodes (20): ADR-0014, ADR-0023, LocalAIProvider, LocalModelSettings, localUsage(), NOTHING_USED, withWarning(), ADR-0024 (+12 more)

### Community 15 - "mistral-provider.ts"
Cohesion: 0.14
Nodes (18): MistralAIProvider, MistralSettings, NOTHING_USED, withWarning(), AIProvider, MockAIProvider, UnavailableAIProvider, estimateMicroEuros() (+10 more)

### Community 16 - "audit.ts"
Cohesion: 0.26
Nodes (16): ADR-0006, CHANNELS, POST(), POST(), ACTIONS, AuditInput, recordAuditEvent(), recordViewEvent() (+8 more)

### Community 17 - "Callout"
Cohesion: 0.12
Nodes (12): metadata, metadata, LoginPage(), metadata, safeNext(), metadata, OrchelioWordmark(), WordmarkProps (+4 more)

### Community 18 - "onboarding/config.ts"
Cohesion: 0.19
Nodes (24): POST(), stringList(), completeOnboarding(), EMPTY_ANSWERS, ensureConfiguration(), loadDraft(), OnboardingDraft, restartOnboarding() (+16 more)

### Community 19 - "dashboard/page.tsx"
Cohesion: 0.16
Nodes (19): metadata, FirmContext, requireFirmAccess(), requireFirmScope(), requirePermission(), requireSession(), Actor, FirmRole (+11 more)

### Community 20 - "[step]/page.tsx"
Cohesion: 0.10
Nodes (19): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+11 more)

### Community 21 - "practice-areas.ts"
Cohesion: 0.14
Nodes (21): POST(), AdminDemoPage(), AdminFirmsPage(), onboardingLabel(), one(), StepMatterTypes(), StepSummary(), FirmSwitcher() (+13 more)

### Community 22 - "firms.ts"
Cohesion: 0.14
Nodes (19): POST(), IntakePage(), metadata, TasksPage(), AnalysisStatus(), UnconfirmedDate(), listIntakes(), firmTimezoneFor() (+11 more)

### Community 23 - "firms/page.tsx"
Cohesion: 0.14
Nodes (17): metadata, metadata, PageProps, metadata, Badge(), DataRow(), requirePlatformAdmin(), CreatedFirm (+9 more)

### Community 24 - "settings.ts"
Cohesion: 0.13
Nodes (17): AppLayout(), isSelfDecision(), judgeSeparation(), SeparationReadiness, SeparationVerdict, allFirmMembers(), countDeciders(), MembershipChange (+9 more)

### Community 25 - "constants.ts"
Cohesion: 0.10
Nodes (20): AI_STATUSES, AiStatus, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction, AuditStatus, DOCUMENT_ANALYSIS_STATUSES (+12 more)

### Community 26 - "ui.tsx"
Cohesion: 0.16
Nodes (15): metadata, HomePage(), PHASE_LABEL, PHASE_TONE, badgeTone, calloutTone, Card(), CommandLine() (+7 more)

### Community 27 - "matters/page.tsx"
Cohesion: 0.18
Nodes (15): metadata, NewMatterPage(), PageProps, MattersPage(), metadata, one(), PageProps, MatterLink() (+7 more)

### Community 28 - "settings/page.tsx"
Cohesion: 0.17
Nodes (15): OnboardingStepPage(), metadata, one(), PageProps, SettingsPage(), ADR-0016, AccentChoice(), LockedRules() (+7 more)

### Community 29 - "start/page.tsx"
Cohesion: 0.15
Nodes (13): metadata, PageProps, StartPage(), ACCEPT, Chosen, StartPanel(), ALLOWED_DOCUMENT_EXTENSIONS, firmConfiguration() (+5 more)

### Community 30 - "start/route.ts"
Cohesion: 0.19
Nodes (7): POST(), ALLOWED_DOCUMENT_MIME_TYPES, addDocument(), listDocuments(), NewDocument, touchMatter(), isKnownCategory()

### Community 31 - "analysis-ui.tsx"
Cohesion: 0.15
Nodes (16): AnalysisWarnings(), ContradictionCard(), KeyFactRow(), QuestionList(), REVIEW_TONE, ReviewPanel(), sourceKindLabel(), SourceList() (+8 more)

### Community 32 - "ai/dates.ts"
Cohesion: 0.28
Nodes (15): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), labelOf(), build(), formatWritten(), isoDateWithin() (+7 more)

### Community 33 - "local-provider.test.ts"
Cohesion: 0.15
Nodes (11): DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, matterInput(), NOW, acceptableSummary(), ALL_FEATURES (+3 more)

### Community 34 - "reviewer.ts"
Cohesion: 0.17
Nodes (14): analystInternals, STANDING_WARNINGS, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), AnalysisReviewResult, ReviewCheck (+6 more)

### Community 35 - "fields.ts"
Cohesion: 0.23
Nodes (13): ADR-0002, POST(), BY_PRACTICE_AREA, editableFieldsFor(), editableSectionsFor(), EMPLOYMENT_FIELDS, FieldType, groupIntoSections() (+5 more)

### Community 36 - "dependencies"
Cohesion: 0.15
Nodes (13): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+5 more)

### Community 37 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 38 - "firm-context.ts"
Cohesion: 0.21
Nodes (9): POST(), OnboardingPage(), activeFirmFor(), resolveActiveFirm(), scopeFor(), SessionFirm, setDocumentVerified(), CARTER (+1 more)

### Community 39 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 40 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 41 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 42 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 43 - "documents/page.tsx"
Cohesion: 0.36
Nodes (9): DocumentsPage(), metadata, one(), PageProps, MatterPage(), TABS, fileSize(), categoriesFor() (+1 more)

### Community 44 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 45 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 46 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 48 - "efficiency.spec.ts"
Cohesion: 0.33
Nodes (3): ADR-0029, signIn(), wordsOn()

### Community 49 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 50 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 51 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 52 - "members/route.ts"
Cohesion: 0.60
Nodes (5): back(), POST(), otherActiveAdministrators(), updateMemberRole(), updateMemberStatus()

### Community 57 - "accessibility.spec.ts"
Cohesion: 0.50
Nodes (3): audit(), expectNoViolations(), Page

## Knowledge Gaps
- **444 isolated node(s):** `eslintConfig`, `PORT`, `config`, `badgeTone`, `calloutTone` (+439 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `prisma.ts` to `dependencies`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `dependencies` to `prisma.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _444 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ai/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07077625570776255 - nodes in this community are weakly interconnected._
- **Should `prisma.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06170598911070781 - nodes in this community are weakly interconnected._