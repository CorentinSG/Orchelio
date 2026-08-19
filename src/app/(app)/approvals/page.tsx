import Link from "next/link";

import { Badge, Callout, Card } from "@/components/ui";
import { ApprovalCard } from "@/components/approval-ui";
import { Pager, pageFrom } from "@/components/pager";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { can } from "@/lib/auth/permissions";
import { actorFor } from "@/lib/auth/session";
import {
  APPROVALS_PER_PAGE,
  approvalActions,
  approvalCounts,
  listDecidedApprovals,
  listPendingApprovals,
  listSupersededApprovals,
} from "@/lib/data/approvals";
import {
  SUPERSEDED_EXPLANATION,
  isDecisionStatus,
  isPendingStatus,
  isSupersededStatus,
} from "@/lib/approvals/status";
import { firmConfiguration } from "@/lib/data/firms";
import { firmTimezone, timezoneNotice } from "@/lib/format/dates";
import { parseJsonObject } from "@/lib/json-field";
import {
  APPROVABLE_ACTIONS,
  actionLabel,
  approvalReason,
  rulesWithoutActions,
} from "@/lib/approvals/actions";
import { LOCKED_APPROVAL_OPTIONS } from "@/lib/onboarding/catalogue";

export const metadata = { title: "Validations" };
export const dynamic = "force-dynamic";

/**
 * How many cards a page renders, per section.
 *
 * One number now, and a real pager under each section rather than a silent
 * window: the counts beside the headings come from their own queries, so the
 * page can say both what you are looking at and what you are looking through.
 * Fifty fully-rendered cards was the eleven-thousand-word screen ADR-0029
 * measured; twenty folded ones is what replaced it.
 */
const PER_PAGE = APPROVALS_PER_PAGE;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  const found = Array.isArray(value) ? value[0] : value;
  return found && found.length > 0 ? found : undefined;
}

/**
 * Orchelio — the approval centre.
 *
 * Everything waiting for a person, and everything a person has decided. The
 * screen is deliberately arranged so that the pending queue is what you see
 * and the history is below it: a decided request is a record, a pending one is
 * somebody waiting.
 */
export default async function ApprovalsPage({ searchParams }: PageProps) {
  const { session, firm, scope } = await requireWorkspacePermission("/approvals", "approval.view");
  const query = await searchParams;

  const filters = {
    status: one(query["status"]),
    action: one(query["action"]),
    riskLevel: one(query["risk"]),
  };
  const problem = one(query["problem"]) ?? null;
  const focus = one(query["focus"]) ?? one(query["decided"]) ?? null;
  // One cursor for the three sections. Each states its own bounds, so a page
  // that runs past the end of a short section simply renders none of it rather
  // than claiming something untrue about it.
  const page = pageFrom(query["page"]);
  const skip = (page - 1) * PER_PAGE;

  // Three groups, and each asks for itself. This used to be a pair, with
  // "everything that is not pending" standing in for "decided" — which became
  // false the moment a request could leave the queue without anybody deciding
  // it.
  const showPending = !filters.status || isPendingStatus(filters.status);
  const showDecided = !filters.status || isDecisionStatus(filters.status);
  const showSuperseded = !filters.status || isSupersededStatus(filters.status);

  const [pending, decided, superseded, counts, actionsPresent, configuration] = await Promise.all([
    showPending ? listPendingApprovals(scope, filters, PER_PAGE, skip) : [],
    showDecided ? listDecidedApprovals(scope, filters, PER_PAGE, skip) : [],
    showSuperseded ? listSupersededApprovals(scope, filters, PER_PAGE, skip) : [],
    approvalCounts(scope, filters),
    approvalActions(scope),
    firmConfiguration(scope),
  ]);

  const timezone = firmTimezone(configuration?.timezone);
  const firmApprovals = parseJsonObject(configuration?.approvals);
  const canDecide = can(actorFor(session.user, firm.id), "approval.decide");
  // Deciding returns to the page the reader was on. Sending them back to the
  // first page of an unfiltered queue would lose their place after every
  // single decision — the opposite of what a queue is for.
  const returnTo = page > 1 ? `/approvals?page=${page}` : "/approvals";
  const uncovered = rulesWithoutActions();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Validations</h1>
        <p className="mt-1 text-ink-muted">
          {counts.pending} en attente d’une décision. Rien ici n’a pris effet.
        </p>
        {/* Which zone the dates below are in, said rather than assumed. */}
        <p className="mt-1 text-sm text-ink-subtle">{timezoneNotice(timezone)}</p>
      </header>

      {one(query["decided"]) ? (
        <Callout tone="success" title="Décision enregistrée">
          Elle figure au journal d’activité du cabinet, avec votre nom, l’heure et votre note.{" "}
          <Link href="/activity" className="font-medium text-brand underline underline-offset-4">
            Voir le journal
          </Link>
        </Callout>
      ) : null}

      <Card title="Filtres" description="Appliqués sur le serveur, dans le périmètre de ce cabinet.">
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink">
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente d’une décision</option>
              <option value="approved">Validée</option>
              <option value="approved_with_edits">Validée avec modifications</option>
              <option value="new_analysis_requested">Nouvelle analyse demandée</option>
              <option value="rejected">Refusée</option>
              <option value="superseded">Remplacée — personne n’a décidé</option>
            </select>
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-ink">
              Action
            </label>
            <select
              id="action"
              name="action"
              defaultValue={filters.action ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Toutes les actions</option>
              {actionsPresent.map((action) => (
                <option key={action} value={action}>
                  {actionLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="risk" className="block text-sm font-medium text-ink">
              Risque
            </label>
            <select
              id="risk"
              name="risk"
              defaultValue={filters.riskLevel ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Tous les risques</option>
              <option value="high">Élevé</option>
              <option value="medium">Moyen</option>
              <option value="low">Faible</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Appliquer
            </button>
            <Link
              href="/approvals"
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Effacer
            </Link>
          </div>
        </form>
      </Card>

      <Card
        title={`En attente d’une décision (${counts.pending})`}
        description="Chaque ligne s’ouvre sur la question posée, l’effet de la décision, et les quatre choix."
      >
        {pending.length === 0 ? (
          <Callout tone="neutral" title="Rien n’attend">
            {counts.pending > 0
              ? "Cette page ne contient rien. Revenez à la première page de la file."
              : "Rien dans ce cabinet ne requiert actuellement la décision d’une personne."}
          </Callout>
        ) : (
          <ul className="space-y-3">
            {pending.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                viewerId={session.user.id}
                requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                timezone={timezone}
                canDecide={canDecide}
                returnTo={returnTo}
                problem={focus === approval.id ? problem : null}
                focused={focus === approval.id}
                group="validation-en-attente"
              />
            ))}
          </ul>
        )}
        <Pager
          page={page}
          perPage={PER_PAGE}
          total={counts.pending}
          params={query}
          basePath="/approvals"
          noun="demandes en attente"
        />
        {problem && !focus ? (
          <Callout tone="danger" title="Cette décision n’a pas été enregistrée" assertive>
            {problem}
          </Callout>
        ) : null}
      </Card>

      {decided.length > 0 ? (
        <Card
          title={`Décidées (${counts.decided})`}
          description="Conservées, jamais purgées. Une décision est la trace de qui a pris la responsabilité."
        >
          <ul className="space-y-3">
            {decided.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                viewerId={session.user.id}
                requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                timezone={timezone}
                canDecide={false}
                returnTo={returnTo}
                group="validation-decidee"
              />
            ))}
          </ul>
          <Pager
            page={page}
            perPage={PER_PAGE}
            total={counts.decided}
            params={query}
            basePath="/approvals"
            noun="demandes décidées"
          />
        </Card>
      ) : null}

      {superseded.length > 0 ? (
        <Card
          title={`Remplacées (${counts.superseded})`}
          description="Personne ne les a décidées."
        >
          <p className="mb-4 text-sm text-ink-muted">{SUPERSEDED_EXPLANATION}</p>
          <ul className="space-y-3">
            {superseded.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                viewerId={session.user.id}
                requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                timezone={timezone}
                canDecide={false}
                returnTo={returnTo}
                group="validation-remplacee"
              />
            ))}
          </ul>
          <Pager
            page={page}
            perPage={PER_PAGE}
            total={counts.superseded}
            params={query}
            basePath="/approvals"
            noun="demandes remplacées"
          />
        </Card>
      ) : null}

      <Card
        title="Ce qui crée une demande de validation ici"
        description="Et ce que ce cabinet a choisi pour chacune."
      >
        <ul className="divide-y divide-line">
          {APPROVABLE_ACTIONS.map((action) => {
            const reason = approvalReason(action, firmApprovals);
            return (
              <li key={action.key} className="flex flex-wrap items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{action.label}</p>
                  <p className="text-xs text-ink-subtle">{action.effect}</p>
                </div>
                <Badge
                  tone={
                    reason === "locked" ? "warning" : reason === "configured" ? "brand" : "neutral"
                  }
                >
                  {reason === "locked"
                    ? "Toujours — impossible à désactiver"
                    : reason === "configured"
                      ? "Ce cabinet l’exige"
                      : "Ce cabinet ne l’exige pas"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card
        title="Les règles que cette version ne déclenche pas encore"
        description="Dit clairement, parce qu’une règle que rien ne déclenche ne protège personne."
      >
        <p className="text-sm text-ink-muted">
          Le questionnaire d’installation propose plus de règles que cette version n’a d’actions.
          Un cabinet qui a activé l’une de celles-ci doit savoir qu’aucun écran ne la déclenche
          aujourd’hui — pas croire qu’elle est appliquée.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-ink">Verrouillées, et pas encore déclenchées</p>
            <ul className="mt-1 space-y-0.5">
              {uncovered.locked.map((rule) => (
                <li key={rule} className="text-sm text-ink-muted">
                  {lockedLabel(rule)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Configurables, et pas encore déclenchées</p>
            <ul className="mt-1 space-y-0.5">
              {uncovered.configurable.map((rule) => (
                <li key={rule} className="text-sm text-ink-muted">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-subtle">
          Plusieurs sont hors d’atteinte plutôt que non implémentées : Orchelio n’a aucun
          transport, donc rien ne peut être soumis, partagé ni envoyé, et rien n’est jamais
          supprimé définitivement.
        </p>
      </Card>
    </div>
  );
}

function lockedLabel(key: string): string {
  return LOCKED_APPROVAL_OPTIONS.find((option) => option.key === key)?.label ?? key;
}
