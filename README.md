# Orchelio

**Orchelio — The adaptive operating system for law firms.**

Orchelio is a configurable SaaS platform for law firms. One codebase serves every firm: a short
onboarding questionnaire configures each firm's matter types, workflows, AI features, human
approval rules and vocabulary, and each firm's data stays isolated from every other firm.

This repository contains **Orchelio Demo**, a local demonstration build.

> **Orchelio Demo — Do not upload real client information or confidential documents.**
>
> Every firm, person, matter and document in this environment is fictional. The AI features are
> simulated: no Anthropic API key is required and no request leaves your machine.

---

## Current status: Phase 1 of 9 complete

Orchelio is built in nine phases. **Phase 1 (Initialisation)** is finished. It delivers the
technical foundation and a working home page; it does **not** yet deliver sign-in, firms
workspaces, matters, documents or the AI analysis.

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 1 | Next.js, TypeScript, Tailwind, Prisma, SQLite, tests, documentation | ✅ Delivered |
| 2 | Full data model, migrations, seed data, local sign-in, roles | Planned |
| 3 | Firm memberships, `firmId` scoping on every query, isolation tests | Planned |
| 4 | Seven-step onboarding questionnaire and generated configuration | Planned |
| 5 | Matters, practice-area fields, simulated document upload | Planned |
| 6 | `AIProvider` interface, `MockAIProvider`, Claude Analyst and Claude Reviewer | Planned |
| 7 | Approval centre, human decisions, append-only audit log | Planned |
| 8 | Simulated AI costs, firm creation, settings, guided demo | Planned |
| 9 | Unit, integration and end-to-end tests, accessibility, final documentation | Planned |

The running application shows this same table, so a screen never claims more than it does.
See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the detail of each phase.

---

## Requirements

| Tool | Version | How to check |
| ---- | ------- | ------------ |
| Node.js | 20.9 or later (22 recommended) | `node --version` |
| npm | 10 or later (installed with Node.js) | `npm --version` |

Nothing else is needed. No paid hosting, no cloud database, no domain name, no authentication
service and no AI API key. Everything runs on your machine, for free.

If you do not have Node.js, download the **LTS** version from <https://nodejs.org> and install it,
then reopen your terminal.

---

## Installation

Open a terminal **inside the project folder**, then run the four commands below, one at a time.

### 1. Install the dependencies

```bash
npm install
```

*Expected result:* npm downloads the libraries into a `node_modules` folder. This takes one to
three minutes the first time. A summary such as `added 400 packages` at the end means it worked.

### 2. Create your configuration file

```bash
cp .env.example .env
```

On Windows PowerShell, use `copy .env.example .env` instead.

*Expected result:* a new `.env` file appears next to `.env.example`. You do not need to change
anything inside it — the default values are already correct for the demonstration.

### 3. Create the database

```bash
npm run db:migrate
```

*Expected result:* a file `prisma/orchelio-demo.db` is created and the terminal prints
`Your database is now in sync with your schema.`

### 4. Load the demonstration data

```bash
npm run seed
```

*Expected result:* the terminal lists the two fictional firms:

```
  ✓ Dupont Immigration Law (immigration)
  ✓ Carter Employment & Labor Law (employment_law)
```

---

## Running the application

```bash
npm run dev
```

*Expected result:* the terminal prints `Local: http://localhost:3000`. Open that address in your
browser. You should see the Orchelio home page with:

- the orange demonstration warning across the top;
- a **Platform status** panel showing `Database (SQLite) — Connected`, the number of migrations
  applied and the number of firms registered;
- the two fictional firms;
- the nine-phase build progress.

The status panel is read live from the database on every page load. If it says the database is
unavailable, it also tells you which command to run.

To stop the application, press `Ctrl` + `C` in the terminal.

---

## Demonstration accounts

Sign-in arrives in **Phase 2**. The accounts below are the ones that will be created; they do not
work yet. All of them are fictional and all use the reserved `.local` domain, which cannot exist on
the real internet.

| Email | Role |
| ----- | ---- |
| `platform.admin@demo.local` | Platform Administrator |
| `immigration.attorney@demo.local` | Attorney — Dupont Immigration Law |
| `immigration.paralegal@demo.local` | Paralegal — Dupont Immigration Law |
| `employment.attorney@demo.local` | Attorney — Carter Employment & Labor Law |
| `employment.paralegal@demo.local` | Paralegal — Carter Employment & Labor Law |

---

## Available commands

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Starts the application for development on <http://localhost:3000>. |
| `npm run build` | Builds the optimised production version. |
| `npm run start` | Runs the built version (requires `npm run build` first). |
| `npm run db:migrate` | Creates or updates the local SQLite database. |
| `npm run seed` | Loads the fictional demonstration data. Safe to re-run. |
| `npm run reset-demo` | Erases the database, rebuilds it and reloads the demo data. |
| `npm run db:studio` | Opens Prisma Studio, a visual browser for the database. |
| `npm run lint` | Checks code style. |
| `npm run typecheck` | Checks TypeScript types. |
| `npm run test` | Runs the unit and component tests. |
| `npm run test:e2e` | Runs the browser tests (see the note below). |
| `npm run check` | Runs lint + typecheck + tests in one go. |

**`npm run reset-demo` erases the local database.** It only ever touches
`prisma/orchelio-demo.db`, which contains fictional data only, but it cannot be undone. Prisma
deliberately refuses to run it when an AI coding assistant invokes it, and asks for your explicit
confirmation first — run it yourself in your own terminal.

**Before the first `npm run test:e2e`,** Playwright needs a browser:

```bash
npx playwright install chromium
```

If your machine already has a Chromium you would rather reuse, point Orchelio at it instead:
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium npm run test:e2e`.

---

## Project structure

```
orchelio/
├── prisma/
│   ├── schema.prisma        Database model (Phase 1: the Firm tenant only)
│   ├── migrations/          Versioned database changes
│   └── seed.ts              Fictional demonstration data
├── src/
│   ├── app/                 Pages (Next.js App Router)
│   │   ├── layout.tsx       Shared shell, Orchelio metadata
│   │   ├── page.tsx         Home page with the live platform status
│   │   ├── loading.tsx      Loading screen
│   │   ├── error.tsx        Error screen
│   │   └── not-found.tsx    404 screen
│   ├── components/          Reusable interface pieces (brand, cards, badges)
│   ├── lib/                 Configuration, database access, status checks
│   └── generated/           Prisma client, generated — never edited by hand
├── tests/
│   ├── unit/                Unit and component tests (Vitest)
│   └── e2e/                 Browser tests (Playwright)
├── docs/                    Architecture, roadmap, production readiness
├── .env.example             Template for your own .env
└── README.md
```

---

## Technical choices

| Area | Choice | Why |
| ---- | ------ | --- |
| Framework | Next.js 16 (App Router) + React 19 | Pages and server logic in one project. |
| Language | TypeScript, strict mode | Catches mistakes before they reach the screen. |
| Styling | Tailwind CSS 4 with Orchelio design tokens | One consistent, accessible visual system. |
| Database | SQLite via Prisma 7 | Free, local, no server to install. |
| Tests | Vitest (units) + Playwright (browser) | Fast feedback plus real-browser confidence. |
| AI | Simulated provider, selected by `AI_PROVIDER` | No key, no cost, no data leaving the machine. |

---

## Known limitations

Stated plainly, because the demonstration should not be mistaken for a finished product.

1. **Phase 1 only.** Sign-in, firms workspaces, onboarding, matters, documents, AI analysis,
   approvals, the audit log and the cost screens are not built yet.
2. **No authentication.** Every page is currently public. Access control arrives in Phase 2.
3. **Simulated AI.** The `AIProvider` interface and the mock implementation land in Phase 6.
   Nothing in this build calls Anthropic.
4. **Multi-tenant isolation is not yet enforced.** The `Firm` table exists, but the `firmId`
   scoping rules and their tests arrive in Phase 3. Do not read the current build as proof of
   isolation.
5. **SQLite, single machine.** Fine for a demonstration, not for concurrent real-world use.
6. **No production security audit.** See the warning below.
7. **`npm audit` reports advisories** in transitive dependencies of Next.js itself (`sharp`,
   `postcss`). They cannot be fixed without downgrading Next.js to an unsupported version. They
   are tracked in [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md).

---

## Adding the Anthropic API later

The architecture already keeps this door open. In short:

1. The AI layer sits behind an `AIProvider` interface (`analyseMatter`, `reviewAnalysis`).
2. `MockAIProvider` implements it today; `AnthropicAIProvider` implements it later.
3. The active provider is chosen by the `AI_PROVIDER` environment variable, nothing else changes.
4. `ANTHROPIC_API_KEY` is read **server-side only** — it is deliberately not prefixed with
   `NEXT_PUBLIC_`, so it can never be sent to a browser. `src/lib/env.ts` refuses to start with
   `AI_PROVIDER=anthropic` and no key, rather than silently falling back.

Full procedure: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Moving to PostgreSQL later

1. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
2. Swap `@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg` in `src/lib/prisma.ts`.
3. Point `DATABASE_URL` at the PostgreSQL server.
4. Re-create the migrations.

No application query changes. Full procedure: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Security notice

> **This application is a demonstration environment and has not undergone a production security
> audit. It must not be used with real legal matters or confidential client data.**

Do not enter, upload or store real client names, social security numbers, passport numbers,
medical information, privileged material, identity documents or banking details.

[`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) lists the work required before this
could ever be considered for real use.

---

## Documentation

| Document | Contents |
| -------- | -------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How Orchelio is put together, and the procedures for extending it. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | The nine phases, in detail. |
| [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) | What must happen before production. |
| [`docs/PLAN_PHASE_1.md`](docs/PLAN_PHASE_1.md) | The analysis and plan that produced this phase. |
