# Graph Report - .  (2026-07-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1218 nodes · 2814 edges · 84 communities (72 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a62ea80`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- approvals/page.tsx
- fields.ts
- firm-scope.ts
- devDependencies
- allow
- scripts
- compilerOptions
- login/actions.ts
- audit.ts
- app-config.ts
- ai/page.tsx
- onboarding/config.ts
- constants.ts
- fixtures.ts
- confidentiality-check.mjs
- activity/page.tsx
- session.ts
- [step]/page.tsx
- run.ts
- practice-areas.ts
- settings.ts
- [id]/page.tsx
- settings/config.ts
- onboarding.ts
- ui.tsx
- app/page.tsx
- analyst.ts
- types.ts
- workspace.ts
- provider.ts
- matters/page.tsx
- settings/page.tsx
- parseIsoDate
- demo-accounts.ts
- dependencies
- documents/page.tsx
- firms/page.tsx
- codemap.mjs
- ai-analyst.test.ts
- docs-check.mjs
- doctor.mjs
- new/page.tsx
- app-shell.tsx
- scope.ts
- env.ts
- audit.mjs
- acceptance-check.mjs
- data/matters.ts
- ai-reviewer.test.ts
- format/dates.ts
- deny
- app.json
- approvals.spec.ts
- demo.ts
- formatDate
- not-found-notice.tsx
- loading-screen.tsx
- package.json
- skills-check.mjs
- settings.json
- onboarding.spec.ts
- accessibility.spec.ts
- prisma.ts
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- 20260730163455_separate_approver/migration.sql
- 20260730180000_superseded_approvals/migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 36 edges
3. `Callout()` - 28 edges
4. `recordAuditEvent()` - 27 edges
5. `currentSession` - 26 edges
6. `formatDate()` - 24 edges
7. `Badge()` - 23 edges
8. `Card()` - 23 edges
9. `can()` - 22 edges
10. `compilerOptions` - 22 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `demo()` --references--> `DEMO_MATTERS`  [EXTRACTED]
  tests/unit/ai-analyst.test.ts → src/lib/demo/matters.ts
- `OnboardingPage()` --calls--> `scopeFor()`  [EXTRACTED]
  src/app/(app)/onboarding/page.tsx → src/lib/auth/firm-context.ts

## Import Cycles
- None detected.

## Communities (84 total, 12 thin omitted)

### Community 0 - "approvals/page.tsx"
Cohesion: 0.06
Nodes (59): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+51 more)

### Community 1 - "fields.ts"
Cohesion: 0.06
Nodes (43): ADR-0002, ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS, BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS (+35 more)

### Community 2 - "firm-scope.ts"
Cohesion: 0.07
Nodes (41): CLASS_TONE, ConfidentialityReport(), describe(), MODEL_LABELS, CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize() (+33 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 4 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 5 - "scripts"
Cohesion: 0.06
Nodes (36): scripts, acceptance:check, build, check, codemap, confidentiality:check, db:generate, db:migrate (+28 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 7 - "login/actions.ts"
Cohesion: 0.11
Nodes (24): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget(), signInAction() (+16 more)

### Community 8 - "audit.ts"
Cohesion: 0.24
Nodes (19): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, signOutAction(), AuditInput (+11 more)

### Community 9 - "app-config.ts"
Cohesion: 0.13
Nodes (10): metadata, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), OrchelioWordmark() (+2 more)

### Community 10 - "ai/page.tsx"
Cohesion: 0.13
Nodes (17): AiWorkspacePage(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage() (+9 more)

### Community 11 - "onboarding/config.ts"
Cohesion: 0.13
Nodes (21): AI_FEATURE_OPTIONS, AiFeatureOption, ApprovalOption, CONFIGURABLE_APPROVAL_OPTIONS, CURRENCIES, JURISDICTIONS, LANGUAGES, LOCKED_APPROVAL_OPTIONS (+13 more)

### Community 12 - "constants.ts"
Cohesion: 0.09
Nodes (22): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction, AuditStatus (+14 more)

### Community 13 - "fixtures.ts"
Cohesion: 0.15
Nodes (9): LOCKED_APPROVALS, FEATURES, configureApprovals(), pendingAnalysisApproval(), createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture (+1 more)

### Community 14 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (19): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+11 more)

### Community 15 - "activity/page.tsx"
Cohesion: 0.14
Nodes (18): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+10 more)

### Community 16 - "session.ts"
Cohesion: 0.16
Nodes (15): metadata, AppLayout(), Actor, can(), FirmRole, isFirmRole(), PERMISSIONS, permissionsFor() (+7 more)

### Community 17 - "[step]/page.tsx"
Cohesion: 0.12
Nodes (10): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+2 more)

### Community 18 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 19 - "practice-areas.ts"
Cohesion: 0.20
Nodes (14): PRACTICE_AREAS, POST(), FirmSwitcher(), ROLE_LABELS, createFirm(), looksLikeRealAddress(), NewFirmValidation, slugify() (+6 more)

### Community 20 - "settings.ts"
Cohesion: 0.22
Nodes (16): back(), POST(), back(), POST(), stringList(), allFirmMembers(), countDeciders(), MembershipChange (+8 more)

### Community 21 - "[id]/page.tsx"
Cohesion: 0.16
Nodes (17): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+9 more)

### Community 22 - "settings/config.ts"
Cohesion: 0.20
Nodes (16): ADR-0015, ADR-0018, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING, firmDisplayName() (+8 more)

### Community 23 - "onboarding.ts"
Cohesion: 0.23
Nodes (16): POST(), stringList(), completeOnboarding(), EMPTY_ANSWERS, ensureConfiguration(), loadDraft(), OnboardingDraft, restartOnboarding() (+8 more)

### Community 24 - "ui.tsx"
Cohesion: 0.22
Nodes (13): metadata, metadata, metadata, metadata, Badge(), badgeTone, Callout(), calloutTone (+5 more)

### Community 25 - "app/page.tsx"
Cohesion: 0.16
Nodes (15): HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase, PHASES, PhaseStatus (+7 more)

### Community 26 - "analyst.ts"
Cohesion: 0.19
Nodes (17): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+9 more)

### Community 27 - "types.ts"
Cohesion: 0.11
Nodes (17): AnalysisDocument, CONFIDENCE_BY_SUPPORT, Contradiction, FactSource, KeyFact, MissingDocument, Question, REVIEW_ISSUE_CATEGORIES (+9 more)

### Community 28 - "workspace.ts"
Cohesion: 0.17
Nodes (15): OnboardingPage(), activeFirmFor(), resolveActiveFirm(), FirmContext, requireFirmAccess(), requireFirmScope(), requirePermission(), requirePlatformAdmin() (+7 more)

### Community 29 - "provider.ts"
Cohesion: 0.22
Nodes (12): analystInternals, AIProvider, MockAIProvider, UnavailableAIProvider, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim() (+4 more)

### Community 30 - "matters/page.tsx"
Cohesion: 0.23
Nodes (13): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+5 more)

### Community 31 - "settings/page.tsx"
Cohesion: 0.21
Nodes (12): metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules(), MemberList(), MemberRow (+4 more)

### Community 32 - "parseIsoDate"
Cohesion: 0.33
Nodes (13): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), labelOf(), build(), formatWritten(), isoDateWithin() (+5 more)

### Community 33 - "demo-accounts.ts"
Cohesion: 0.22
Nodes (10): DECISIONS_REQUIRING_NOTE, isLockedApproval(), DEMO_ACCOUNTS, DemoAccount, visibleDemoAccounts(), GUIDE_STEPS, guideAccounts(), guideAccountsExist() (+2 more)

### Community 34 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 35 - "documents/page.tsx"
Cohesion: 0.15
Nodes (8): POST(), metadata, PageProps, addDocument(), listDocuments(), NewDocument, listMatters(), touchMatter()

### Community 36 - "firms/page.tsx"
Cohesion: 0.22
Nodes (12): AdminDemoPage(), AdminFirmsPage(), metadata, one(), PageProps, AdminSystemPage(), CreatedFirm, CreateFirmOutcome (+4 more)

### Community 37 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 38 - "ai-analyst.test.ts"
Cohesion: 0.22
Nodes (11): STANDING_WARNINGS, SUPPORT_LEVELS, supportCaveat(), DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, ALL_FEATURES (+3 more)

### Community 40 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 41 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 42 - "new/page.tsx"
Cohesion: 0.24
Nodes (9): metadata, NewMatterPage(), PageProps, requireWorkspace(), requireWorkspacePermission(), GENERIC_MATTER_STATUSES, parseJsonObject(), parseStringArray() (+1 more)

### Community 43 - "app-shell.tsx"
Cohesion: 0.17
Nodes (10): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+2 more)

### Community 44 - "scope.ts"
Cohesion: 0.20
Nodes (5): DraftFilters, listDrafts(), NewDraft, FirmScope, SearchResult

### Community 45 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 46 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 47 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 48 - "data/matters.ts"
Cohesion: 0.22
Nodes (8): POST(), createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 49 - "ai-reviewer.test.ts"
Cohesion: 0.27
Nodes (6): MatterAnalysisInput, MatterAnalysisResult, CONFLICTED, damage(), FEATURES, NOW

### Community 50 - "format/dates.ts"
Cohesion: 0.40
Nodes (8): calendarDayIn(), firmTimezone(), formatMoment(), KNOWN_ZONES, timezoneLabel(), timezoneNotice(), toDate(), EVENING_IN_PACIFIC

### Community 51 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 52 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 53 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 54 - "demo.ts"
Cohesion: 0.29
Nodes (7): ADR-0016, POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor()

### Community 55 - "formatDate"
Cohesion: 0.36
Nodes (8): POST(), DocumentsPage(), one(), IntakePage(), TasksPage(), fileSize(), firmTimezoneFor(), formatDate()

### Community 56 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 58 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 59 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 61 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 64 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 65 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **410 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `viewport` (+405 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `firm-scope.ts`, `fixtures.ts`, `prisma.ts`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _410 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06479081821547575 - nodes in this community are weakly interconnected._
- **Should `fields.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06431372549019608 - nodes in this community are weakly interconnected._
- **Should `firm-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07294117647058823 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._