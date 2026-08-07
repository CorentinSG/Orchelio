import Link from "next/link";

import { Badge, Callout, Card } from "@/components/ui";
import { formatDate } from "@/components/matter-ui";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { listTasks } from "@/lib/data/activity";
import { firmTimezoneFor } from "@/lib/data/firms";
import { requestNow } from "@/lib/clock";

export const metadata = { title: "Tâches" };
export const dynamic = "force-dynamic";

/**
 * Open work across the firm.
 *
 * Ordered by due date, and a due date here is what somebody wrote down — never
 * a deadline Orchelio calculated or confirmed. That distinction is a locked
 * rule, not a presentational choice.
 */
export default async function TasksPage() {
  const { firm, scope } = await requireMatterAccess();
  const [tasks, timezone] = await Promise.all([listTasks(scope), firmTimezoneFor(scope)]);
  const now = requestNow();

  const overdue = tasks.filter((task) => task.dueAt && task.dueAt.getTime() < now.getTime());

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Tâches</h1>
        <p className="mt-1 text-ink-muted">
          {tasks.length} ouverte(s) sur les dossiers de ce cabinet
          {overdue.length > 0 ? `, dont ${overdue.length} au-delà de leur date enregistrée` : ""}.
        </p>
      </header>

      <Card title="Tâches ouvertes">
        {tasks.length === 0 ? (
          <Callout tone="neutral" title="Rien d’ouvert">
            Aucune tâche n’est en attente pour ce cabinet.
          </Callout>
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{task.title}</p>
                  {task.description ? (
                    <p className="text-sm text-ink-muted">{task.description}</p>
                  ) : null}
                  {task.matter ? (
                    <Link
                      href={`/matters/${task.matter.id}?tab=tasks`}
                      className="text-sm text-brand hover:underline"
                    >
                      {task.matter.reference} — {task.matter.title}
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={task.priority === "high" ? "warning" : "neutral"}>
                    {task.priority}
                  </Badge>
                  <span className="text-sm text-ink-muted">{formatDate(task.dueAt, timezone)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-ink-subtle">
          Les dates affichées sont celles qu’une personne a enregistrées. Orchelio ne calcule ni ne confirme jamais une échéance.
        </p>
      </Card>
    </div>
  );
}
