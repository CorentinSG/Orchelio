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
          ← Tous les dossiers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Nouveau dossier</h1>
        <p className="mt-1 text-ink-muted">
          Pour {firm.name}. Utilisez un client fictif — ceci est un environnement de démonstration.
        </p>
      </header>

      {error ? (
        <Callout tone="danger" title="Veuillez vérifier ce formulaire" assertive>
          {error}
        </Callout>
      ) : null}

      {types.length === 0 ? (
        <Callout tone="warning" title="Aucun type de dossier n’est activé">
          <p>
            Ce cabinet n’a pas choisi les types de dossiers qu’il traite.{" "}
            <Link href="/onboarding/3" className="font-medium text-brand underline underline-offset-4">
              Choisissez-les dans l’installation du cabinet
            </Link>
            .
          </p>
        </Callout>
      ) : (
        <form method="post" action="/api/matters" className="space-y-6">
          <Card title="L’essentiel">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Intitulé du dossier" htmlFor="title">
                <input
                  id="title"
                  name="title"
                  required
                  placeholder="Regroupement familial — Alvarez"
                  className={inputClass}
                />
              </Field>

              <Field label="Nom du client" htmlFor="clientName" hint="Fictif.">
                <input id="clientName" name="clientName" required className={inputClass} />
              </Field>

              <Field label="Type de dossier" htmlFor="matterTypeKey">
                <select id="matterTypeKey" name="matterTypeKey" required className={inputClass}>
                  {types.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut" htmlFor="status">
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
                  label="Partie représentée"
                  htmlFor="representationSide"
                  hint="Pour quelle partie ce cabinet agit dans ce dossier."
                >
                  <select
                    id="representationSide"
                    name="representationSide"
                    defaultValue="employee"
                    className={inputClass}
                  >
                    <option value="employee">Le salarié</option>
                    <option value="employer">L’employeur</option>
                  </select>
                </Field>
              ) : null}
            </div>
          </Card>

          {sections.map(({ section, fields }) => (
            <Card
              key={section}
              title={section}
              description="Tout est facultatif ici, et rien n’est vérifié."
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
                          <option value="">Inconnu</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "boolean" ? (
                        <select id={id} name={id} className={inputClass} defaultValue="">
                          <option value="">Inconnu</option>
                          <option value="true">Oui</option>
                          <option value="false">Non</option>
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
              Créer le dossier
            </button>
            <Link
              href="/matters"
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Annuler
            </Link>
            <p className="text-sm text-ink-subtle">
              Une référence est attribuée automatiquement, séquentielle dans ce cabinet.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
