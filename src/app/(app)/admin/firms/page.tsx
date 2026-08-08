import Link from "next/link";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { Field, inputClass } from "@/components/onboarding-ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { listFirmsForAdministration, platformCounts } from "@/lib/data/platform";
import { creatablePracticeAreas } from "@/lib/platform/new-firm";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { IS_DEMO } from "@/lib/app-config";

export const metadata = { title: "Cabinets" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(query: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = query[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

/**
 * Platform administration — firms.
 *
 * Shows the tenants and their headline counts, and nothing from inside them. A
 * platform administrator operates the platform; that does not include reading a
 * firm's client matters, so no matter title, client name or document appears on
 * this page — and the query behind it does not ask for one.
 *
 * The creation form is the phase's acceptance criterion: a third firm, created
 * entirely through the interface, with no code change.
 */
export default async function AdminFirmsPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();

  const query = await searchParams;
  const error = one(query, "error");
  const created = one(query, "created");
  const createdEmail = one(query, "email");
  const newAccount = one(query, "newAccount") === "1";

  const [firms, counts] = await Promise.all([listFirmsForAdministration(), platformCounts()]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Administration de la plateforme
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Cabinets</h1>
        <p className="mt-1 text-ink-muted">
          Tous les cabinets de cette instance. Le contenu des dossiers n’y est délibérément pas montré.
        </p>
      </header>

      {error ? (
        <Callout tone="danger" title="Le cabinet n’a pas été créé" assertive>
          {error}
        </Callout>
      ) : null}

      {created ? (
        <Callout tone="success" title="Cabinet créé">
          <p>
            <span className="font-mono">{created}</span> existe et attend d’être configuré. Son
            premier administrateur est <span className="font-mono">{createdEmail}</span>.
          </p>
          {newAccount && IS_DEMO ? (
            <p className="mt-2">
              Ce compte vient d’être créé. Connectez-vous avec le mot de passe partagé de la
              démonstration, <span className="font-mono">{DEMO_PASSWORD}</span> — celui-là même
              qu’affiche la page de connexion — puis répondez aux sept questions d’installation.
            </p>
          ) : null}
          {!newAccount ? (
            <p className="mt-2">
              Ce compte existait déjà : il garde son propre mot de passe. Il est désormais
              administrateur de ce cabinet également.
            </p>
          ) : null}
          <p className="mt-2 text-ink-subtle">
            Le cabinet n’est pas un espace de travail utilisable tant que le questionnaire n’a pas
            été rempli. Vous ne pouvez pas le faire d’ici : un administrateur de la plateforme n’est
            membre d’aucun cabinet.
          </p>
        </Callout>
      ) : null}

      <Callout tone="neutral" title="Portée de ce rôle">
        Un administrateur de la plateforme peut voir qu’un cabinet existe et à quel point il utilise
        la plateforme, mais il n’est membre d’aucun cabinet et ne peut donc ouvrir ni ses dossiers
        ni ses documents.
      </Callout>

      <Card title="Instance" description="Somme des comptes propres de chaque cabinet.">
        <dl>
          <DataRow label="Cabinets" value={counts.firms} />
          <DataRow label="Utilisateurs" value={counts.users} />
          <DataRow label="Sessions actives" value={counts.activeSessions} />
          <DataRow label="Dossiers" value={counts.matters} />
          <DataRow label="Documents" value={counts.documents} />
          <DataRow label="Analyses" value={counts.analyses} />
        </dl>
      </Card>

      <Card
        title="Créer un cabinet"
        description="Tout ce qu’il faut à un cabinet pour exister. Ce qu’il lui faut pour être utile, son propre administrateur y répondra ensuite."
      >
        <form method="post" action="/api/admin/firms" className="space-y-4">
          <Field
            label="Nom du cabinet"
            htmlFor="name"
            hint="Fictif. L’identifiant en est dérivé, et rendu unique s’il est déjà pris."
          >
            <input id="name" name="name" required minLength={2} className={inputClass} />
          </Field>

          <Field
            label="Domaine principal"
            htmlFor="primaryPracticeArea"
            hint="Seuls les domaines disposant d’un modèle complet peuvent être choisis — un cabinet créé dans un domaine vide ne pourrait pas terminer son questionnaire."
          >
            <select id="primaryPracticeArea" name="primaryPracticeArea" required className={inputClass}>
              <option value="">Choisissez…</option>
              {creatablePracticeAreas().map((area) => (
                <option key={area.key} value={area.key}>
                  {area.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Premier administrateur" htmlFor="administratorName">
              <input
                id="administratorName"
                name="administratorName"
                required
                className={inputClass}
              />
            </Field>
            <Field
              label="Son adresse e-mail"
              htmlFor="administratorEmail"
              hint="Utilisez une adresse fictive se terminant par .local. Orchelio n’y envoie rien — il n’en a aucun moyen."
            >
              <input
                id="administratorEmail"
                name="administratorEmail"
                type="email"
                required
                placeholder="admin@newfirm.local"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 border-t border-line pt-4">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
            >
              Créer le cabinet
            </button>
            <p className="text-sm text-ink-subtle">
              Crée le cabinet, sa configuration — portant les neuf règles de validation verrouillées
              — et son premier administrateur.
            </p>
          </div>
        </form>
      </Card>

      <Card title="Liste des cabinets" description="Des comptes uniquement. Aucun dossier, client ni document n’y est nommé.">
        {firms.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucun cabinet n’a encore été créé. Lancez <code className="font-mono">npm run seed</code>,
            ou créez-en un ci-dessus.
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
                    <p className="mt-0.5 font-mono text-xs text-ink-subtle">{firm.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={firm.status === "active" ? "success" : "neutral"}>
                      {firm.status === "active" ? "actif" : firm.status}
                    </Badge>
                    <Badge
                      tone={
                        firm.configuration?.onboardingStatus === "complete" ? "success" : "warning"
                      }
                    >
                      {firm.configuration
                        ? `installation : ${onboardingLabel(firm.configuration.onboardingStatus)}`
                        : "non configuré"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink-subtle">
                  {firm._count.memberships} membre(s) · {firm._count.matters} dossier(s) ·{" "}
                  {firm._count.documents} document(s) · {firm._count.analyses} analyse(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm text-ink-muted">
        <Link href="/admin/system" className="font-medium text-brand underline underline-offset-4">
          Vue d’ensemble du système
        </Link>{" "}
        ·{" "}
        <Link href="/admin/demo" className="font-medium text-brand underline underline-offset-4">
          Données de démonstration
        </Link>
      </p>
    </div>
  );
}

/** The stored onboarding states, in the reader's language. */
function onboardingLabel(status: string): string {
  switch (status) {
    case "complete":
      return "terminée";
    case "in_progress":
      return "en cours";
    case "not_started":
      return "non commencée";
    default:
      return status;
  }
}
