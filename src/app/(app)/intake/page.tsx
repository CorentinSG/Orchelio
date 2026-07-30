import Link from "next/link";

import { Callout, Card } from "@/components/ui";
import { StatusBadge, formatDate } from "@/components/matter-ui";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { listIntakes } from "@/lib/data/activity";
import { firmTimezoneFor } from "@/lib/data/firms";
import { parseJsonObject } from "@/lib/json-field";

export const metadata = { title: "Intake" };
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Intake</h1>
        <p className="mt-1 text-ink-muted">
          {intakes.length} recorded for this firm.
        </p>
      </header>

      <Callout tone="warning" title="Unverified by definition">
        These are the client&apos;s own words. Where they disagree with a document, the
        disagreement is the point — Orchelio records both and asks a person to resolve it.
      </Callout>

      {intakes.length === 0 ? (
        <Card title="Nothing recorded">
          <p className="text-sm text-ink-muted">No intake has been submitted for this firm.</p>
        </Card>
      ) : (
        intakes.map((intake) => {
          const answers = parseJsonObject(intake.payload);
          return (
            <Card
              key={intake.id}
              title={intake.matter.clientProfile?.displayName ?? "Unknown client"}
              description={`${intake.matter.reference} · submitted ${formatDate(intake.submittedAt, timezone)}`}
              action={<StatusBadge status={intake.matter.status} />}
            >
              <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {Object.entries(answers).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm text-ink-muted">{key.split("_").join(" ")}</dt>
                    <dd className="text-sm text-ink">{String(value ?? "Unknown")}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4">
                <Link
                  href={`/matters/${intake.matter.id}?tab=intake`}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  Open the matter →
                </Link>
              </p>
            </Card>
          );
        })
      )}
    </div>
  );
}
