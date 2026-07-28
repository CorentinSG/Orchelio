import Link from "next/link";

import { Callout, Card } from "@/components/ui";
import { Field, inputClass } from "@/components/onboarding-ui";
import { statusLabel } from "@/components/matter-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { GENERIC_MATTER_STATUSES } from "@/lib/constants";
import { firmConfiguration } from "@/lib/data/firms";
import { matterTypesForPracticeAreas } from "@/lib/data/catalogues";
import { editableSectionsFor } from "@/lib/matters/fields";
import { parseStringArray } from "@/lib/json-field";

export const metadata = { title: "New matter" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Creating a matter.
 *
 * The fields below the basics come from the firm's practice area — an
 * immigration firm is asked about status and entry, an employment firm about
 * pay and termination. Neither ever sees the other's form.
 *
 * Everything is optional except the title, the client and the type: a matter
 * usually opens before its facts are known, and a form that refuses to save an
 * incomplete file would simply be worked around on paper.
 */
export default async function NewMatterPage({ searchParams }: PageProps) {
  const { firm, scope } = await requireWorkspacePermission("/matters/new", "matter.create");
  const query = await searchParams;
  const error = typeof query["error"] === "string" ? query["error"] : null;

  const configuration = await firmConfiguration(scope);
  const enabled = parseStringArray(configuration?.matterTypes);
  const allTypes = await matterTypesForPracticeAreas(
    parseStringArray(configuration?.practiceAreas),
  );
  const types = allTypes.filter((type) => enabled.includes(type.key));

  const isEmployment = firm.primaryPracticeArea === "employment_law";
  // Type-specific fields are shown once a type is chosen; before that, the
  // fields common to the area. Column-backed fields — the side represented —
  // are asked once in the basics above and left out here.
  const sections = editableSectionsFor(firm.primaryPracticeArea);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/matters" className="text-sm text-brand hover:underline">
          ← All matters
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">New matter</h1>
        <p className="mt-1 text-ink-muted">
          For {firm.name}. Use a fictional client — this is a demonstration environment.
        </p>
      </header>

      {error ? (
        <Callout tone="danger" title="Please check this form" assertive>
          {error}
        </Callout>
      ) : null}

      {types.length === 0 ? (
        <Callout tone="warning" title="No matter types are enabled">
          <p>
            This firm has not selected the kinds of matter it handles.{" "}
            <Link href="/onboarding/3" className="font-medium text-brand underline underline-offset-4">
              Choose them in the firm setup
            </Link>
            .
          </p>
        </Callout>
      ) : (
        <form method="post" action="/api/matters" className="space-y-6">
          <Card title="The basics">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Matter title" htmlFor="title">
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="Family-based petition — Alvarez"
                  className={inputClass}
                />
              </Field>

              <Field label="Client name" htmlFor="clientName" hint="Fictional.">
                <input id="clientName" name="clientName" required className={inputClass} />
              </Field>

              <Field label="Matter type" htmlFor="matterTypeKey">
                <select id="matterTypeKey" name="matterTypeKey" required className={inputClass}>
                  {types.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status" htmlFor="status">
                <select id="status" name="status" defaultValue="lead" className={inputClass}>
                  {GENERIC_MATTER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </Field>

              {isEmployment ? (
                <Field
                  label="Representing"
                  htmlFor="representationSide"
                  hint="Which side of the matter this firm acts for."
                >
                  <select
                    id="representationSide"
                    name="representationSide"
                    defaultValue="employee"
                    className={inputClass}
                  >
                    <option value="employee">The employee</option>
                    <option value="employer">The employer</option>
                  </select>
                </Field>
              ) : null}
            </div>
          </Card>

          {sections.map(({ section, fields }) => (
            <Card
              key={section}
              title={section}
              description="Everything here is optional and nothing is verified."
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {fields.map((field) => {
                  const id = `field_${field.key}`;
                  return (
                    <Field key={field.key} label={field.label} htmlFor={id} hint={field.help}>
                      {field.type === "textarea" ? (
                        <textarea id={id} name={id} rows={3} className={inputClass} />
                      ) : field.type === "select" ? (
                        <select id={id} name={id} className={inputClass} defaultValue="">
                          <option value="">Unknown</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "boolean" ? (
                        <select id={id} name={id} className={inputClass} defaultValue="">
                          <option value="">Unknown</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : (
                        <input
                          id={id}
                          name={id}
                          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                          className={inputClass}
                        />
                      )}
                    </Field>
                  );
                })}
              </div>
            </Card>
          ))}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Create matter
            </button>
            <Link
              href="/matters"
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Cancel
            </Link>
            <p className="text-sm text-ink-subtle">
              A reference is assigned automatically, sequential within this firm.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
