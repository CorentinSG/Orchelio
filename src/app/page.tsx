import Link from "next/link";

import { DemoBanner } from "@/components/demo-banner";
import { OrchelioWordmark } from "@/components/brand";
import { Badge, Callout, Card, CommandLine, DataRow, StatusDot } from "@/components/ui";
import {
  APP_FULL_NAME,
  APP_NAME,
  APP_TAGLINE,
  FICTIONAL_DATA_NOTICE,
  POWERED_BY,
} from "@/lib/app-config";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { PHASES, currentPhase } from "@/lib/roadmap";
import { getSystemStatus, listFirms } from "@/lib/system-status";

/**
 * Orchelio home page.
 *
 * This is a live server-rendered status page, not a mock-up: on every request
 * it queries the local SQLite database through Prisma and reports what it
 * actually found. If the database is missing or un-migrated, it says so and
 * gives the exact command to run.
 */
export const dynamic = "force-dynamic";

const PHASE_TONE = {
  done: "success",
  in_progress: "brand",
  planned: "neutral",
} as const;

const PHASE_LABEL = {
  done: "Livrée",
  in_progress: "En cours",
  planned: "Prévue",
} as const;

/**
 * Written as one string rather than as JSX text interleaved with `{APP_NAME}`:
 * the compiler collapses whitespace around expression containers that span
 * lines, which silently glues words together.
 */
const INTRODUCTION =
  `${APP_NAME} est une plateforme configurable pour cabinets d’avocats. Un seul code sert ` +
  "tous les cabinets ; un court questionnaire d’installation configure les types de dossiers, " +
  "les circuits de travail, les fonctions d’IA et les règles de validation humaine de chaque " +
  "cabinet — et les données de chaque cabinet restent isolées de tous les autres.";


export default async function HomePage() {
  const [status, firms] = await Promise.all([getSystemStatus(), listFirms()]);
  const phase = currentPhase();
  const databaseOk = status.database.state === "connected";

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <OrchelioWordmark size="md" />
          <div className="flex items-center gap-3">
            <Badge tone={databaseOk ? "success" : "danger"}>
              <StatusDot tone={databaseOk ? "success" : "danger"} />
              {databaseOk ? "Système opérationnel" : "Installation requise"}
            </Badge>
            <Link
              href="/login"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">{APP_FULL_NAME}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-4 text-base text-ink-muted">{INTRODUCTION}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card
            title="État de la plateforme"
            description="Vérifié en direct contre la base locale à chaque affichage de la page."
          >
            <dl>
              <DataRow
                label="Base de données (SQLite)"
                value={
                  status.database.state === "connected" ? (
                    <span className="inline-flex items-center gap-2">
                      <StatusDot tone="success" /> Connectée
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <StatusDot tone="danger" /> Indisponible
                    </span>
                  )
                }
                hint={
                  status.database.state === "connected"
                    ? `${status.database.latencyMs} ms`
                    : undefined
                }
              />
              <DataRow
                label="Migrations appliquées"
                value={
                  status.database.state === "connected" ? status.database.migrationsApplied : "—"
                }
              />
              <DataRow
                label="Cabinets enregistrés"
                value={status.database.state === "connected" ? status.database.firmCount : "—"}
              />
              <DataRow label="Moteur d’IA" value={status.aiProvider} hint={status.aiProviderWord} />
              <DataRow label="Environnement" value={status.appEnv} />
              <DataRow label="Node.js" value={status.nodeVersion} />
            </dl>

            {status.database.state === "unavailable" ? (
              <div className="mt-4">
                <Callout tone="danger" title="La base de données n’est pas prête" assertive>
                  <p>{status.database.reason}</p>
                  <p className="mt-2">
                    Ouvrez un terminal dans le dossier du projet, lancez{" "}
                    <CommandLine>{status.database.remedy}</CommandLine>, puis rechargez cette page.
                  </p>
                </Callout>
              </div>
            ) : (
              <div className="mt-4">
                <Callout tone="brand" title={status.aiProviderBannerTitle}>
                  <p>{status.aiProviderBanner}</p>
                </Callout>
              </div>
            )}
          </Card>

          <Card
            title="Cabinets sur cette instance"
            description={FICTIONAL_DATA_NOTICE}
          >
            {firms.length === 0 ? (
              <div className="py-2">
                <p className="text-sm text-ink-muted">Aucun cabinet n’a encore été créé.</p>
                <p className="mt-2 text-sm text-ink-muted">
                  Lancez <CommandLine>npm run seed</CommandLine> pour charger les deux cabinets de démonstration.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {firms.map((firm) => (
                  <li key={firm.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{firm.name}</p>
                      <p className="text-sm text-ink-muted">
                        {practiceAreaLabel(firm.primaryPracticeArea)}
                      </p>
                    </div>
                    <Badge tone={firm.status === "active" ? "success" : "neutral"}>
                      {firm.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-ink-subtle">
              <Link href="/login" className="font-medium text-brand underline underline-offset-4">
                Connectez-vous
              </Link>{" "}
              avec un compte de démonstration pour ouvrir l’espace d’un cabinet, ou lisez d’abord la{" "}
              <Link href="/guide" className="font-medium text-brand underline underline-offset-4">
                démonstration guidée
              </Link>{" "}
              — vingt et une étapes, lisibles sans aucun compte.
            </p>
          </Card>
        </div>

        <div className="mt-6">
          <Card
            title="Avancement de la construction"
            description={`Phase en cours : ${phase.number} — ${phase.title}.`}
          >
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PHASES.map((item) => (
                <li
                  key={item.number}
                  className="rounded-card border border-line bg-surface-muted px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      {item.number}. {item.title}
                    </p>
                    <Badge tone={PHASE_TONE[item.status]}>{PHASE_LABEL[item.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{item.summary}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-ink-subtle sm:px-6">
          <p>{POWERED_BY}</p>
          <p>Environnement de démonstration — données fictives uniquement.</p>
        </div>
      </footer>
    </div>
  );
}
