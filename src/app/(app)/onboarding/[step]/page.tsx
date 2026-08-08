import { notFound, redirect } from "next/navigation";

import { Callout, Card } from "@/components/ui";
import {
  CheckboxOption,
  Field,
  LockIcon,
  ProgressBar,
  StepActions,
  WorkflowPreview,
  inputClass,
} from "@/components/onboarding-ui";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { requirePermission } from "@/lib/auth/guards";
import { currentSession } from "@/lib/auth/session";
import { loadDraft, matterTypeOptions } from "@/lib/data/onboarding";
import {
  AI_FEATURE_OPTIONS,
  CONFIGURABLE_APPROVAL_OPTIONS,
  CURRENCIES,
  JURISDICTIONS,
  LANGUAGES,
  LOCKED_APPROVAL_OPTIONS,
  TIMEZONES,
  WORKFLOW_STEP_OPTIONS,
} from "@/lib/onboarding/catalogue";
import { ONBOARDING_STEP_COUNT, buildConfiguration } from "@/lib/onboarding/config";
import { PRACTICE_AREAS, practiceAreaLabel } from "@/lib/practice-areas";
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Installer votre cabinet" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingStepPage({ params, searchParams }: PageProps) {
  const session = await currentSession();
  if (!session) {
    redirect("/login?next=%2Fonboarding");
  }

  const activeFirm = await activeFirmFor(session);
  if (!activeFirm) {
    redirect("/403");
  }

  const { firm } = await requirePermission(activeFirm.id, "firm.settings.edit");
  const scope = scopeFor(firm);

  const { step: rawStep } = await params;
  const step = Number(rawStep);
  if (!Number.isInteger(step) || step < 1 || step > ONBOARDING_STEP_COUNT) {
    notFound();
  }

  const query = await searchParams;
  const error = typeof query["error"] === "string" ? query["error"] : null;
  const saved = query["saved"] === "1";

  const draft = await loadDraft(scope);
  const { answers } = draft;
  const matterTypes = await matterTypeOptions(answers.practiceAreas);

  const selectedWorkflowLabels = WORKFLOW_STEP_OPTIONS.filter((option) =>
    answers.workflowStepIds.includes(option.id),
  ).map((option) => option.label);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Installation du cabinet</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Configurer {firm.name}
        </h1>
        <p className="mt-1 text-ink-muted">
          Vos réponses configurent Orchelio pour ce cabinet. Rien ici ne change le logiciel — elles
          choisissent quelles parties ce cabinet utilise.
        </p>
      </header>

      <ProgressBar step={step} />

      {error ? (
        <Callout tone="danger" title="Vérifiez cette étape" assertive>
          {error}
        </Callout>
      ) : null}
      {saved ? (
        <Callout tone="success" title="Brouillon enregistré">
          Vous pouvez fermer cette page et y revenir plus tard.
        </Callout>
      ) : null}

      <form method="post" action="/api/onboarding">
        <input type="hidden" name="action" value="step" />
        <input type="hidden" name="step" value={step} />

        {step === 1 ? <StepFirmDetails answers={answers} /> : null}
        {step === 2 ? <StepPracticeAreas answers={answers} /> : null}
        {step === 3 ? <StepMatterTypes answers={answers} matterTypes={matterTypes} /> : null}
        {step === 4 ? (
          <StepWorkflow answers={answers} selectedLabels={selectedWorkflowLabels} />
        ) : null}
        {step === 5 ? <StepAiFeatures answers={answers} /> : null}
        {step === 6 ? <StepApprovals answers={answers} /> : null}
        {step === 7 ? (
          <StepSummary answers={answers} selectedLabels={selectedWorkflowLabels} />
        ) : null}
      </form>

      {step === 7 ? (
        <form method="post" action="/api/onboarding" className="border-t border-line pt-5">
          <input type="hidden" name="action" value="confirm" />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
          >
            Confirmer la configuration
          </button>
          <p className="mt-2 text-sm text-ink-subtle">
            Ceci applique la configuration à {firm.name}. Vous pourrez la modifier à tout moment.
          </p>
        </form>
      ) : null}

      <form method="post" action="/api/onboarding" className="border-t border-line pt-5">
        <input type="hidden" name="action" value="restart" />
        <button
          type="submit"
          className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Recommencer le questionnaire
        </button>
        <p className="mt-1 text-sm text-ink-subtle">
          Revient à l’étape 1. Rien n’est effacé — vos réponses sont toujours là.
        </p>
      </form>
    </div>
  );
}

type Answers = Awaited<ReturnType<typeof loadDraft>>["answers"];

function StepFirmDetails({ answers }: { answers: Answers }) {
  return (
    <Card title="Le cabinet" description="Utilisez des informations fictives — ceci est une démonstration.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom du cabinet" htmlFor="firmName">
          <input id="firmName" name="firmName" defaultValue={answers.firmName} className={inputClass} required />
        </Field>
        <Field label="Administrateur du cabinet" htmlFor="contactName">
          <input
            id="contactName" name="contactName"
            defaultValue={answers.contactName}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Adresse e-mail" htmlFor="contactEmail" hint="Fictive. Rien n’y est jamais envoyé.">
          <input
            id="contactEmail" name="contactEmail"
            type="email"
            defaultValue={answers.contactEmail}
            placeholder="name@demo.local"
            className={inputClass}
            required
          />
        </Field>
        <Field label="Nombre d’utilisateurs" htmlFor="userCount">
          <input
            id="userCount" name="userCount"
            type="number"
            min={1}
            max={500}
            defaultValue={answers.userCount}
            className={inputClass}
          />
        </Field>
        <Field label="Ressort principal" htmlFor="jurisdiction">
          <select id="jurisdiction" name="jurisdiction" defaultValue={answers.jurisdiction} className={inputClass}>
            {JURISDICTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Langue" htmlFor="language" hint="L’interface est en français. Ce choix est enregistré, et rien ne le lit encore — l’anglais n’est pas disponible.">
          <select id="language" name="language" defaultValue={answers.language} className={inputClass}>
            {LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Devise" htmlFor="currency" hint="Utilisée sur l’écran Consommation et coûts. Orchelio ne facture rien.">
          <select id="currency" name="currency" defaultValue={answers.currency} className={inputClass}>
            {CURRENCIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fuseau horaire" htmlFor="timezone" hint="Chaque date et heure affichée par Orchelio est donnée dans ce fuseau.">
          <select id="timezone" name="timezone" defaultValue={answers.timezone} className={inputClass}>
            {TIMEZONES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6">
        <StepActions step={1} />
      </div>
    </Card>
  );
}

function StepPracticeAreas({ answers }: { answers: Answers }) {
  return (
    <Card
      title="Quels domaines de droit votre cabinet pratique-t-il ?"
      description="Sélectionnez tous les domaines dans lesquels vous travaillez, puis choisissez le principal."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {PRACTICE_AREAS.map((area) => (
          <CheckboxOption
            key={area.key}
            name="practiceAreas"
            value={area.key}
            label={area.label}
            description={area.status === "available" ? undefined : "Modèle bientôt disponible."}
            defaultChecked={answers.practiceAreas.includes(area.key)}
          />
        ))}
      </ul>

      <div className="mt-6">
        <Field
          label="Domaine principal"
          htmlFor="primaryPracticeArea"
          hint="Il détermine le tableau de bord, le vocabulaire et les déroulés que ce cabinet verra."
        >
          <select
            id="primaryPracticeArea"
            name="primaryPracticeArea"
            defaultValue={answers.primaryPracticeArea}
            className={inputClass}
          >
            <option value="">Choisissez un domaine…</option>
            {PRACTICE_AREAS.filter((area) => area.status === "available").map((area) => (
              <option key={area.key} value={area.key}>
                {area.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-2 text-sm text-ink-subtle">
          Seuls le droit de l’immigration et le droit du travail disposent d’un modèle complet dans
          cette démonstration : eux seuls peuvent être le domaine principal.
        </p>
      </div>

      <div className="mt-6">
        <StepActions step={2} />
      </div>
    </Card>
  );
}

function StepMatterTypes({
  answers,
  matterTypes,
}: {
  answers: Answers;
  matterTypes: { key: string; label: string; practiceAreaKey: string }[];
}) {
  const grouped = new Map<string, typeof matterTypes>();
  for (const type of matterTypes) {
    const list = grouped.get(type.practiceAreaKey) ?? [];
    list.push(type);
    grouped.set(type.practiceAreaKey, list);
  }

  return (
    <Card
      title="Quels types de dossier votre cabinet traite-t-il ?"
      description="Ils déterminent les champs, les documents, les déroulés et le tableau de bord de chaque dossier."
    >
      {matterTypes.length === 0 ? (
        <Callout tone="warning" title="Aucun domaine de droit sélectionné">
          Revenez à l’étape 2 et choisissez au moins un domaine de droit.
        </Callout>
      ) : (
        [...grouped.entries()].map(([areaKey, types]) => (
          <section key={areaKey} className="mb-6 last:mb-0">
            <h3 className="mb-2 text-sm font-semibold text-ink">{practiceAreaLabel(areaKey)}</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {types.map((type) => (
                <CheckboxOption
                  key={type.key}
                  name="matterTypes"
                  value={type.key}
                  label={type.label}
                  defaultChecked={answers.matterTypes.includes(type.key)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="mt-6">
        <StepActions step={3} />
      </div>
    </Card>
  );
}

function StepWorkflow({
  answers,
  selectedLabels,
}: {
  answers: Answers;
  selectedLabels: string[];
}) {
  return (
    <Card
      title="Quelles étapes font partie de votre déroulé habituel ?"
      description="Sélectionnez les étapes par lesquelles passe un dossier dans votre cabinet."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {WORKFLOW_STEP_OPTIONS.map((option) => (
          <CheckboxOption
            key={option.id}
            name="workflowStepIds"
            value={option.id}
            label={option.label}
            description={option.description}
            defaultChecked={answers.workflowStepIds.includes(option.id)}
          />
        ))}
      </ul>

      <div className="mt-6 rounded-card border border-line bg-surface-muted px-4 py-4">
        <h3 className="text-sm font-semibold text-ink">Votre déroulé</h3>
        <p className="mb-3 text-sm text-ink-muted">
          Enregistré quand vous continuez. Les étapes apparaissent dans l’ordre où un dossier les traverse.
        </p>
        <WorkflowPreview steps={selectedLabels} />
      </div>

      <div className="mt-6">
        <StepActions step={4} />
      </div>
    </Card>
  );
}

function StepAiFeatures({ answers }: { answers: Answers }) {
  return (
    <Card
      title="Comment l’assistant doit-il aider votre équipe ?"
      description="Chacune produit un brouillon qu’une personne relit. Aucune ne décide de quoi que ce soit."
    >
      <div className="mb-4">
        <Callout tone="ai" title="Produit par une IA — à lire par une personne, obligatoire">
          <p>
            L’assistant n’énonce jamais de conclusion juridique, n’envoie jamais rien et n’agit
            jamais de lui-même.
          </p>
          <p className="mt-2">{providerNotice(serverEnv()).banner}</p>
        </Callout>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {AI_FEATURE_OPTIONS.map((option) => (
          <CheckboxOption
            key={option.id}
            name="aiFeatureIds"
            value={option.id}
            label={option.label}
            description={option.description}
            defaultChecked={answers.aiFeatureIds.includes(option.id)}
          />
        ))}
      </ul>

      <div className="mt-6">
        <StepActions step={5} />
      </div>
    </Card>
  );
}

function StepApprovals({ answers }: { answers: Answers }) {
  return (
    <div className="space-y-6">
      <Card
        title="Quelles actions doivent requérir une validation humaine ?"
        description="Choisissez les actions que personne dans votre cabinet ne peut accomplir sans un second regard."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {CONFIGURABLE_APPROVAL_OPTIONS.map((option) => (
            <CheckboxOption
              key={option.key}
              name="approvalKeys"
              value={option.key}
              label={option.label}
              description={option.description}
              defaultChecked={answers.approvalKeys.includes(option.key)}
            />
          ))}
        </ul>

        <div className="mt-6">
          <StepActions step={6} />
        </div>
      </Card>

      <Card
        title="Toujours obligatoire"
        description="Impossible à désactiver, par qui que ce soit, sur quelque écran que ce soit."
      >
        <div className="mb-4">
          <Callout tone="warning" title="Ce n’est pas une préférence">
            <p>
              Ce sont des propriétés de sûreté d’Orchelio, pas des réglages. Elles sont appliquées
              par le serveur quoi que dise la configuration d’un cabinet, et elles sont enregistrées
              avec votre configuration : la garantie est vérifiable, pas seulement affirmée.
            </p>
          </Callout>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {LOCKED_APPROVAL_OPTIONS.map((option) => (
            <CheckboxOption
              key={option.key}
              name="lockedApprovals"
              value={option.key}
              label={option.label}
              description={option.description}
              locked
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function StepSummary({ answers, selectedLabels }: { answers: Answers; selectedLabels: string[] }) {
  const configuration = buildConfiguration(answers);
  const aiLabels = AI_FEATURE_OPTIONS.filter((option) =>
    answers.aiFeatureIds.includes(option.id),
  ).map((option) => option.label);
  const approvalLabels = CONFIGURABLE_APPROVAL_OPTIONS.filter((option) =>
    answers.approvalKeys.includes(option.key),
  ).map((option) => option.label);

  return (
    <div className="space-y-6">
      <Card title="Récapitulatif" description="Relisez ceci avant de confirmer.">
        <dl className="grid gap-4 sm:grid-cols-2">
          <SummaryItem label="Nom du cabinet" value={answers.firmName} />
          <SummaryItem label="Administrateur" value={answers.contactName} />
          <SummaryItem
            label="Domaine principal"
            value={practiceAreaLabel(answers.primaryPracticeArea)}
          />
          <SummaryItem
            label="Autres domaines"
            value={
              answers.practiceAreas.filter((area) => area !== answers.primaryPracticeArea).length > 0
                ? answers.practiceAreas
                    .filter((area) => area !== answers.primaryPracticeArea)
                    .map(practiceAreaLabel)
                    .join(", ")
                : "Aucun"
            }
          />
          <SummaryItem label="Ressort" value={answers.jurisdiction} />
          <SummaryItem
            label="Langue, devise et fuseau"
            value={`${answers.language} · ${answers.currency} · ${answers.timezone}`}
          />
        </dl>
      </Card>

      <Card title="Types de dossier" description={`${answers.matterTypes.length} sélectionné(s).`}>
        <ul className="flex flex-wrap gap-1.5">
          {configuration.matterTypes.map((type) => (
            <li key={type} className="rounded-full border border-line px-3 py-1 text-sm text-ink">
              {type}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Déroulé d’un dossier" description="Le chemin qu’un dossier suit dans ce cabinet.">
        <WorkflowPreview steps={selectedLabels} />
      </Card>

      <Card title="Fonctions d’IA" description={`${aiLabels.length} activée(s).`}>
        {aiLabels.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Aucune. Orchelio gère toujours les dossiers, les documents et les validations.
          </p>
        ) : (
          <ul className="list-inside list-disc text-sm text-ink">
            {aiLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Validations" description="Ce qui requiert une décision humaine dans ce cabinet.">
        <h3 className="text-sm font-semibold text-ink">Choisies par votre cabinet</h3>
        {approvalLabels.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">Aucune au-delà des règles ci-dessous.</p>
        ) : (
          <ul className="mt-1 list-inside list-disc text-sm text-ink">
            {approvalLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        )}

        <h3 className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <LockIcon /> Toujours obligatoire
        </h3>
        <ul className="mt-1 list-inside list-disc text-sm text-ink-muted">
          {LOCKED_APPROVAL_OPTIONS.map((option) => (
            <li key={option.key}>{option.label}</li>
          ))}
        </ul>
      </Card>

      <Card title="Rôles" description="Qui peut faire quoi dans ce cabinet.">
        <ul className="list-inside list-disc text-sm text-ink">
          <li>Administrateur du cabinet — configuration, utilisateurs, déroulés, coûts, journal d’activité.</li>
          <li>Avocat — dossiers, analyses, validations, échéances, courriers.</li>
          <li>Assistant juridique — questionnaire client, documents, analyses. Ni validation, ni échéance, ni clôture.</li>
          <li>Lecteur — peut consulter, et rien d’autre.</li>
        </ul>
      </Card>

      <Card title="Intégrations" description="Prévues, non connectées dans cette démonstration.">
        <p className="text-sm text-ink-muted">
          Microsoft 365, Google Workspace, Clio, MyCase, PracticePanther, SharePoint, OneDrive,
          Dropbox, DocuSign, LawPay. Aucune intégration n’est connectée dans cette démonstration.
        </p>
      </Card>

      <div className="border-t border-line pt-5">
        <StepActions step={7} submitLabel="Enregistrer et rester ici" />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value || "—"}</dd>
    </div>
  );
}
