# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1172 nodes · 2691 edges · 65 communities (56 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edc6cfdb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- session.ts
- analyst.ts
- [id]/page.tsx
- documents/page.tsx
- settings.ts
- run.ts
- scripts
- devDependencies
- allow
- compilerOptions
- app-config.ts
- ui.tsx
- [step]/page.tsx
- ai/page.tsx
- constants.ts
- matters/page.tsx
- confidentiality-check.mjs
- settings/page.tsx
- platform.ts
- Callout
- fixtures.ts
- approvals/page.tsx
- approvals/actions.ts
- confidentiality.test.ts
- onboarding/config.ts
- dependencies
- seed.ts
- codemap.mjs
- onboarding.ts
- firm-scope.ts
- docs-check.mjs
- approval-ui.tsx
- audit.mjs
- doctor.mjs
- cache.ts
- acceptance-check.mjs
- app/page.tsx
- deny
- app.json
- loading-screen.tsx
- skills-check.mjs
- settings.json
- practiceAreaLabel
- approvals.spec.ts
- onboarding.spec.ts
- accessibility.spec.ts
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
2. `scripts` - 36 edges
3. `Callout()` - 28 edges
4. `recordAuditEvent()` - 27 edges
5. `currentSession` - 27 edges
6. `Badge()` - 23 edges
7. `Card()` - 23 edges
8. `compilerOptions` - 22 edges
9. `activeFirmFor()` - 21 edges
10. `can()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json

## Import Cycles
- None detected.

## Communities (65 total, 9 thin omitted)

### Community 0 - "session.ts"
Cohesion: 0.06
Nodes (78): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), POST() (+70 more)

### Community 1 - "analyst.ts"
Cohesion: 0.05
Nodes (73): analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline() (+65 more)

### Community 2 - "[id]/page.tsx"
Cohesion: 0.05
Nodes (57): ActivityPage(), metadata, one(), PageProps, metadata, aiFeatureLabel(), MatterPage(), metadata (+49 more)

### Community 3 - "documents/page.tsx"
Cohesion: 0.05
Nodes (49): ADR-0002, POST(), POST(), DocumentsPage(), metadata, one(), PageProps, fileSize() (+41 more)

### Community 4 - "settings.ts"
Cohesion: 0.08
Nodes (44): ADR-0015, ADR-0018, back(), POST(), back(), POST(), stringList(), AppLayout() (+36 more)

### Community 5 - "run.ts"
Cohesion: 0.06
Nodes (33): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+25 more)

### Community 6 - "scripts"
Cohesion: 0.05
Nodes (42): description, engines, node, name, private, scripts, acceptance:check, build (+34 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 8 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 9 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 10 - "app-config.ts"
Cohesion: 0.10
Nodes (18): metadata, metadata, viewport, SignInState, INITIAL, LoginForm(), LoginPage(), metadata (+10 more)

### Community 11 - "ui.tsx"
Cohesion: 0.14
Nodes (24): AdminDemoPage(), metadata, AdminFirmsPage(), metadata, one(), PageProps, AdminSystemPage(), metadata (+16 more)

### Community 12 - "[step]/page.tsx"
Cohesion: 0.10
Nodes (20): Answers, metadata, PageProps, CheckboxOption(), LockIcon(), ProgressBar(), StepActions(), WorkflowPreview() (+12 more)

### Community 13 - "ai/page.tsx"
Cohesion: 0.14
Nodes (18): AiWorkspacePage(), featureLabel(), metadata, metadata, NewMatterPage(), PageProps, formatTokens(), metadata (+10 more)

### Community 14 - "constants.ts"
Cohesion: 0.08
Nodes (25): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction, AuditStatus (+17 more)

### Community 15 - "matters/page.tsx"
Cohesion: 0.16
Nodes (19): IntakePage(), metadata, MattersPage(), metadata, one(), PageProps, metadata, TasksPage() (+11 more)

### Community 16 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (19): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+11 more)

### Community 17 - "settings/page.tsx"
Cohesion: 0.15
Nodes (17): ADR-0016, POST(), metadata, PageProps, AccentChoice(), LockedRules(), MemberList(), MemberRow (+9 more)

### Community 18 - "platform.ts"
Cohesion: 0.19
Nodes (16): POST(), CreatedFirm, createFirm(), CreateFirmOutcome, buildApprovals(), creatablePracticeAreas(), looksLikeRealAddress(), NewFirmInput (+8 more)

### Community 19 - "Callout"
Cohesion: 0.15
Nodes (7): metadata, metadata, metadata, OrchelioWordmark(), WordmarkProps, NotFoundNotice(), Callout()

### Community 20 - "fixtures.ts"
Cohesion: 0.20
Nodes (9): LOCKED_APPROVALS, FEATURES, configureApprovals(), pendingAnalysisApproval(), createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture (+1 more)

### Community 21 - "approvals/page.tsx"
Cohesion: 0.18
Nodes (12): ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, approvalActions(), approvalCounts(), ApprovalFilters (+4 more)

### Community 22 - "approvals/actions.ts"
Cohesion: 0.24
Nodes (14): POST(), APPROVABLE_ACTIONS, ApprovableAction, APPROVAL_DECISIONS, approvalReason(), decisionApproves(), DECISIONS_REQUIRING_NOTE, isApprovalDecision() (+6 more)

### Community 23 - "confidentiality.test.ts"
Cohesion: 0.26
Nodes (13): CLASS_DEFINITIONS, ClassDefinition, classify(), clientMaterialModels(), CONFIDENTIALITY_CLASSES, ConfidentialityClass, Enforcement, isClientMaterial() (+5 more)

### Community 24 - "onboarding/config.ts"
Cohesion: 0.28
Nodes (13): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildConfiguration(), FirmConfigurationPayload, mapKeys(), sampleAnswersFor() (+5 more)

### Community 25 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 26 - "seed.ts"
Cohesion: 0.23
Nodes (11): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, encode() (+3 more)

### Community 27 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 28 - "onboarding.ts"
Cohesion: 0.22
Nodes (11): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), EMPTY_ANSWERS, ensureConfiguration(), matterTypeOptions() (+3 more)

### Community 29 - "firm-scope.ts"
Cohesion: 0.29
Nodes (10): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, isRecord(), PLATFORM_MODELS, QueryArgs (+2 more)

### Community 30 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 31 - "approval-ui.tsx"
Cohesion: 0.23
Nodes (10): ApprovalCard(), ApprovalCardData, ApprovalStatusBadge(), resourceHref(), RISK_TONE, STATUS_TONE, actionLabel(), ApprovalDecision (+2 more)

### Community 32 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 33 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 34 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 35 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 36 - "app/page.tsx"
Cohesion: 0.27
Nodes (8): HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase, PHASES, PhaseStatus

### Community 37 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 38 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 40 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 41 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 42 - "practiceAreaLabel"
Cohesion: 0.40
Nodes (5): StepMatterTypes(), StepSummary(), FirmSwitcher(), ROLE_LABELS, practiceAreaLabel()

### Community 44 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 46 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 47 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **405 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `PageProps` (+400 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `run.ts`, `fixtures.ts`, `firm-scope.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _405 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06163639186461729 - nodes in this community are weakly interconnected._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05172413793103448 - nodes in this community are weakly interconnected._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051759834368530024 - nodes in this community are weakly interconnected._
- **Should `documents/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05273937532002048 - nodes in this community are weakly interconnected._