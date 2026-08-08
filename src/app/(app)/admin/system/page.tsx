import Link from "next/link";

import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getSystemStatus } from "@/lib/system-status";
import { platformCounts } from "@/lib/data/platform";
import { APP_FULL_NAME } from "@/lib/app-config";

export const metadata = { title: "Vue d’ensemble du système" };
export const dynamic = "force-dynamic";

/**
 * Platform administration — technical status.
 *
 * The same check the public home page runs, with the counts an operator wants
 * next to it. It reports what is true right now rather than what was true when
 * the page was built, which is why it is dynamic: a status panel that can be
 * cached is a status panel that can be wrong.
 *
 * Nothing here reads inside a firm. The counts are the firms' own totals added
 * up, and the database check is a round-trip, not a query for anybody's data.
 */
export default async function AdminSystemPage() {
  await requirePlatformAdmin();

  const [status, counts] = await Promise.all([getSystemStatus(), platformCounts()]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Administration de la plateforme
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Vue d’ensemble du système</h1>
        <p className="mt-1 text-ink-muted">
          Mesuré lors de cette requête. Rien sur cette page n’est mis en cache.
        </p>
      </header>

      {status.database.state === "unavailable" ? (
        <Callout tone="danger" title="La base de données n’a pas pu être jointe" assertive>
          <p>{status.database.reason}</p>
          <div className="mt-2">
            <CommandLine>{status.database.remedy}</CommandLine>
          </div>
        </Callout>
      ) : null}

      <Card title="Exécution">
        <dl>
          <DataRow label="Application" value={APP_FULL_NAME} />
          <DataRow label="Environnement" value={status.appEnv} />
          <DataRow label="Node.js" value={status.nodeVersion} />
          <DataRow
            label="Fournisseur d’IA"
            value={
              <span className="flex items-center justify-end gap-2">
                <span className="font-mono">{status.aiProvider}</span>
                <Badge tone="ai">{status.aiProviderWord}</Badge>
              </span>
            }
            hint={status.aiProviderHint}
          />
        </dl>
      </Card>

      <Card title="Base de données">
        {status.database.state === "connected" ? (
          <dl>
            <DataRow
              label="État"
              value={<Badge tone="success">connectée</Badge>}
              hint={`${status.database.latencyMs} ms aller-retour`}
            />
            <DataRow label="Migrations appliquées" value={status.database.migrationsApplied} />
            <DataRow label="Cabinets" value={status.database.firmCount} />
          </dl>
        ) : (
          <p className="text-sm text-ink-muted">
            Aucun chiffre n’est affiché, parce qu’aucun n’a pu être lu. Un zéro ici serait une
            affirmation sur les données plutôt que sur la connexion.
          </p>
        )}
      </Card>

      <Card title="Enregistrements" description="Les comptes propres de chaque cabinet, additionnés.">
        <dl>
          <DataRow label="Cabinets" value={counts.firms} />
          <DataRow label="Utilisateurs" value={counts.users} />
          <DataRow label="Sessions actives" value={counts.activeSessions} />
          <DataRow label="Dossiers" value={counts.matters} />
          <DataRow label="Documents" value={counts.documents} />
          <DataRow label="Analyses" value={counts.analyses} />
          <DataRow label="Demandes de validation" value={counts.approvals} />
          <DataRow label="Événements d’activité" value={counts.auditEvents} />
        </dl>
      </Card>

      <Callout tone="neutral" title="Ce que cette page n’est pas">
        Ce n’est pas de la supervision. Il n’y a ici ni historique, ni alerte, ni conservation —
        une seule mesure, prise à l’ouverture de la page. Un déploiement qui compte aurait besoin
        des trois ; voir <span className="font-mono">docs/PRODUCTION_READINESS.md</span>.
      </Callout>

      <p className="text-sm text-ink-muted">
        <Link href="/admin/firms" className="font-medium text-brand underline underline-offset-4">
          Cabinets
        </Link>{" "}
        ·{" "}
        <Link href="/admin/demo" className="font-medium text-brand underline underline-offset-4">
          Données de démonstration
        </Link>
      </p>
    </div>
  );
}
