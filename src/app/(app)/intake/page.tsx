import Link from "next/link";

import { Callout, Card } from "@/components/ui";
import { StatusBadge, formatDate } from "@/components/matter-ui";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { listIntakes } from "@/lib/data/activity";
import { firmTimezoneFor } from "@/lib/data/firms";
import { parseJsonObject } from "@/lib/json-field";

export const metadata = { title: "Questionnaire client" };
export const dynamic = "force-dynamic";

/**
 * What clients told the firm, before anyone checked it.
 *
 * Kept as its own screen rather than only a tab because the intake is the one
 * record whose disagreement with a document is the interesting part. Reading
 * them together is how a paralegal spots the question worth asking.
 */
export default async function IntakePage() {
  const { firm, scope } = await requireMatterAccess();
  const [intakes, timezone] = await Promise.all([listIntakes(scope), firmTimezoneFor(scope)]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Questionnaire client</h1>
        <p className="mt-1 text-ink-muted">
          {intakes.length} enregistré(s) pour ce cabinet.
        </p>
      </header>

      <Callout tone="warning" title="Non vérifié, par définition">
        Ce sont les mots du client. Là où ils contredisent un document, le désaccord est
        justement le point — Orchelio enregistre les deux et demande à une personne de trancher.
      </Callout>

      {intakes.length === 0 ? (
        <Card title="Rien d’enregistré">
          <p className="text-sm text-ink-muted">Aucun questionnaire n’a été transmis pour ce cabinet.</p>
        </Card>
      ) : (
        intakes.map((intake) => {
          const answers = parseJsonObject(intake.payload);
          return (
            <Card
              key={intake.id}
              title={intake.matter.clientProfile?.displayName ?? "Client inconnu"}
              description={`${intake.matter.reference} · transmis le ${formatDate(intake.submittedAt, timezone)}`}
              action={<StatusBadge status={intake.matter.status} />}
            >
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {Object.entries(answers).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm text-ink-muted">{key.split("_").join(" ")}</dt>
                    <dd className="text-sm text-ink">{String(value ?? "Inconnu")}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4">
                <Link
                  href={`/matters/${intake.matter.id}?tab=intake`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Ouvrir le dossier →
                </Link>
              </p>
            </Card>
          );
        })
      )}
    </div>
  );
}
