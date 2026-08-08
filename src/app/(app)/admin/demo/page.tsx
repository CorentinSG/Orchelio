import Link from "next/link";

import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { listFirmsForAdministration } from "@/lib/data/platform";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { GUIDE_STEP_COUNT } from "@/lib/guide";
import { FICTIONAL_DATA_NOTICE } from "@/lib/app-config";

export const metadata = { title: "Données de démonstration" };
export const dynamic = "force-dynamic";

/**
 * Platform administration — demonstration data.
 *
 * Read-only, and deliberately so. Everything an operator might want to *do*
 * here is either additive and belongs to the firm that owns the data — adding
 * sample matters lives in that firm's own settings — or destructive, and lives
 * in a command a person types on purpose rather than a button they can press by
 * accident. See ADR-0016.
 *
 * The per-firm figures are the firms' own counts. Nothing on this page names a
 * matter, a client or a document.
 */
export default async function AdminDemoPage() {
  await requirePlatformAdmin();

  const firms = await listFirmsForAdministration();
  const totalMatters = firms.reduce((sum, firm) => sum + firm._count.matters, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Administration de la plateforme
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Données de démonstration</h1>
        <p className="mt-1 text-ink-muted">{FICTIONAL_DATA_NOTICE}</p>
      </header>

      <Card title="Ce que contient chaque cabinet" description="Des comptes uniquement.">
        {firms.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun cabinet n’existe encore. Lancez <code className="font-mono">npm run seed</code>.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {firms.map((firm) => (
              <li key={firm.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{firm.name}</p>
                    <p className="text-sm text-ink-muted">
                      {practiceAreaLabel(firm.primaryPracticeArea)}
                    </p>
                  </div>
                  <Badge tone={firm._count.matters > 0 ? "success" : "warning"}>
                    {firm._count.matters > 0 ? "contient des données de démonstration" : "vide"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-ink-subtle">
                  {firm._count.matters} dossier(s) · {firm._count.documents} document(s) ·{" "}
                  {firm._count.analyses} analyse(s) · {firm._count.approvalRequests} validation(s)
                </p>
                {firm._count.matters === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    Son propre administrateur peut ajouter des dossiers d’exemple depuis les
                    réglages de ce cabinet. Vous ne pouvez pas le faire d’ici — un administrateur de
                    la plateforme n’est membre d’aucun cabinet.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Comptes de démonstration" description="Tous fictifs.">
        <p className="mb-3 text-sm text-ink-muted">
          Tous les comptes installés avec la démonstration partagent le mot de passe{" "}
          <span className="font-mono">{DEMO_PASSWORD}</span>. Il figure aussi sur la page de
          connexion : il est écrit dans un dépôt public, le cacher relèverait donc du théâtre plutôt
          que de la sécurité.
        </p>
        <dl>
          {DEMO_ACCOUNTS.map((account) => (
            <DataRow
              key={account.email}
              label={<span className="font-mono text-xs">{account.email}</span>}
              value={account.roleLabel}
              hint={account.firmName ?? "aucun cabinet"}
            />
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-subtle">
          Un compte créé par le formulaire de création de cabinet n’apparaît pas ici — cette liste
          est celle des données d’exemple, et elle ne prétend pas être un annuaire.
        </p>
      </Card>

      <Card title="Effacer les données de démonstration n’a pas de bouton">
        <p className="text-sm text-ink-muted">
          Tout supprimer est irréversible, et l’une des neuf règles de validation verrouillées dit
          que rien n’est jamais supprimé définitivement sans une personne. Un bouton dans une page
          web est une forme de consentement plus faible qu’une commande que quelqu’un tape
          délibérément : la réinitialisation vit donc ici.
        </p>
        <div className="mt-3">
          <CommandLine>npm run reset-demo</CommandLine>
        </div>
        <p className="mt-2 text-sm text-ink-subtle">
          Elle efface tous les cabinets de cette instance — les {totalMatters} dossier(s) ci-dessus
          compris — et réinstalle la démonstration depuis zéro. Elle n’est pas limitée à un seul
          cabinet et elle est irréversible.
        </p>
      </Card>

      <Callout tone="brand" title={`La visite guidée compte ${GUIDE_STEP_COUNT} étapes`}>
        <p>
          Elle parcourt tout le produit dans l’ordre, en nommant le compte à utiliser et ce qu’il
          faut regarder sur chaque écran.
        </p>
        <p className="mt-2">
          <Link href="/guide" className="font-medium text-brand underline underline-offset-4">
            Ouvrir la visite guidée
          </Link>
        </p>
      </Callout>

      <p className="text-sm text-ink-muted">
        <Link href="/admin/firms" className="font-medium text-brand underline underline-offset-4">
          Cabinets
        </Link>{" "}
        ·{" "}
        <Link href="/admin/system" className="font-medium text-brand underline underline-offset-4">
          Vue d’ensemble du système
        </Link>
      </p>
    </div>
  );
}
