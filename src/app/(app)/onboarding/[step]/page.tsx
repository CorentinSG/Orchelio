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

export const metadata = { title: "Set up your firm" };
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
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Firm setup</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Configure {firm.name}
        </h1>
        <p className="mt-1 text-ink-muted">
          Your answers configure Orchelio for this firm. Nothing here changes the software — it
          selects which parts of it this firm uses.
        </p>
      </header>

      <ProgressBar step={step} />

      {error ? (
        <Callout tone="danger" title="Please check this step" assertive>
          {error}
        </Callout>
      ) : null}
      {saved ? (
        <Callout tone="success" title="Draft saved">
          You can close this page and come back to it later.
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
            Confirm configuration
          </button>
          <p className="mt-2 text-sm text-ink-subtle">
            This applies the configuration to {firm.name}. You can change it again at any time.
          </p>
        </form>
      ) : null}

      <form method="post" action="/api/onboarding" className="border-t border-line pt-5">
        <input type="hidden" name="action" value="restart" />
        <button
          type="submit"
          className="text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Start the questionnaire again
        </button>
        <p className="mt-1 text-sm text-ink-subtle">
          Returns to step 1. Nothing is discarded — your answers are still there.
        </p>
      </form>
    </div>
  );
}

type Answers = Awaited<ReturnType<typeof loadDraft>>["answers"];

function StepFirmDetails({ answers }: { answers: Answers }) {
  return (
    <Card title="Firm details" description="Use fictional details — this is a demonstration.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Firm name" htmlFor="firmName">
          <input id="firmName" name="firmName" defaultValue={answers.firmName} className={inputClass} required />
        </Field>
        <Field label="Firm administrator" htmlFor="contactName">
          <input
            id="contactName" name="contactName"
            defaultValue={answers.contactName}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Email address" htmlFor="contactEmail" hint="Fictional. Nothing is ever sent to it.">
          <input
            id="contactEmail" name="contactEmail"
            type="email"
            defaultValue={answers.contactEmail}
            placeholder="name@demo.local"
            className={inputClass}
            required
          />
        </Field>
        <Field label="Number of users" htmlFor="userCount">
          <input
            id="userCount" name="userCount"
            type="number"
            min={1}
            max={500}
            defaultValue={answers.userCount}
            className={inputClass}
          />
        </Field>
        <Field label="Main jurisdiction" htmlFor="jurisdiction">
          <select id="jurisdiction" name="jurisdiction" defaultValue={answers.jurisdiction} className={inputClass}>
            {JURISDICTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Language" htmlFor="language">
          <select id="language" name="language" defaultValue={answers.language} className={inputClass}>
            {LANGUAGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Currency" htmlFor="currency">
          <select id="currency" name="currency" defaultValue={answers.currency} className={inputClass}>
            {CURRENCIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time zone" htmlFor="timezone">
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
      title="What areas of law does your firm practise?"
      description="Select every area you work in, then choose the main one."
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {PRACTICE_AREAS.map((area) => (
          <CheckboxOption
            key={area.key}
            name="practiceAreas"
            value={area.key}
            label={area.label}
            description={area.status === "available" ? undefined : "Template coming soon."}
            defaultChecked={answers.practiceAreas.includes(area.key)}
          />
        ))}
      </ul>

      <div className="mt-6">
        <Field
          label="Main practice area"
          htmlFor="primaryPracticeArea"
          hint="This decides the dashboard, the vocabulary and the workflows this firm sees."
        >
          <select
            id="primaryPracticeArea"
            name="primaryPracticeArea"
            defaultValue={answers.primaryPracticeArea}
            className={inputClass}
          >
            <option value="">Choose an area…</option>
            {PRACTICE_AREAS.filter((area) => area.status === "available").map((area) => (
              <option key={area.key} value={area.key}>
                {area.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="mt-2 text-sm text-ink-subtle">
          Only Immigration Law and Employment &amp; Labor Law ship a full template in this
          demonstration, so only those can be the main area.
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
      title="Which types of matter does your firm handle?"
      description="These decide the fields, documents, workflows and dashboard each matter uses."
    >
      {matterTypes.length === 0 ? (
        <Callout tone="warning" title="No practice area selected yet">
          Go back to step 2 and choose at least one area of law.
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
      title="Which steps are part of your normal workflow?"
      description="Select the steps a matter goes through at your firm."
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
        <h3 className="text-sm font-semibold text-ink">Your workflow</h3>
        <p className="mb-3 text-sm text-ink-muted">
          Saved when you continue. Steps appear in the order a matter travels through them.
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
      title="How would you like Claude to assist your team?"
      description="Every one of these produces a draft for a person to review. None of them decides anything."
    >
      <div className="mb-4">
        <Callout tone="ai" title="AI-generated — Human review required">
          Claude never states a legal conclusion, never sends anything and never acts on its own.
          In this demonstration its answers are simulated: no request leaves your machine.
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
        title="Which actions must require human approval?"
        description="Choose the actions that nobody at your firm may complete without a second pair of eyes."
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
        title="Always required"
        description="These cannot be switched off, by anyone, on any screen."
      >
        <div className="mb-4">
          <Callout tone="warning" title="Not a preference">
            <p>
              These are safety properties of Orchelio rather than settings. They are enforced on
              the server whatever a firm configuration says, and they are stored with your
              configuration so the guarantee is auditable rather than merely asserted.
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
      <Card title="Summary" description="Check this over before you confirm.">
        <dl className="grid gap-4 sm:grid-cols-2">
          <SummaryItem label="Firm name" value={answers.firmName} />
          <SummaryItem label="Administrator" value={answers.contactName} />
          <SummaryItem
            label="Main practice area"
            value={practiceAreaLabel(answers.primaryPracticeArea)}
          />
          <SummaryItem
            label="Other practice areas"
            value={
              answers.practiceAreas.filter((area) => area !== answers.primaryPracticeArea).length > 0
                ? answers.practiceAreas
                    .filter((area) => area !== answers.primaryPracticeArea)
                    .map(practiceAreaLabel)
                    .join(", ")
                : "None"
            }
          />
          <SummaryItem label="Jurisdiction" value={answers.jurisdiction} />
          <SummaryItem
            label="Locale"
            value={`${answers.language} · ${answers.currency} · ${answers.timezone}`}
          />
        </dl>
      </Card>

      <Card title="Matter types" description={`${answers.matterTypes.length} selected.`}>
        <ul className="flex flex-wrap gap-1.5">
          {configuration.matterTypes.map((type) => (
            <li key={type} className="rounded-full border border-line px-3 py-1 text-sm text-ink">
              {type}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Workflow" description="The path a matter follows at this firm.">
        <WorkflowPreview steps={selectedLabels} />
      </Card>

      <Card title="AI features" description={`${aiLabels.length} enabled.`}>
        {aiLabels.length === 0 ? (
          <p className="text-sm text-ink-muted">
            None. Orchelio still manages matters, documents and approvals.
          </p>
        ) : (
          <ul className="list-inside list-disc text-sm text-ink">
            {aiLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Approvals" description="What needs a human decision at this firm.">
        <h3 className="text-sm font-semibold text-ink">Chosen by your firm</h3>
        {approvalLabels.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">None beyond the rules below.</p>
        ) : (
          <ul className="mt-1 list-inside list-disc text-sm text-ink">
            {approvalLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        )}

        <h3 className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-ink">
          <LockIcon /> Always required
        </h3>
        <ul className="mt-1 list-inside list-disc text-sm text-ink-muted">
          {LOCKED_APPROVAL_OPTIONS.map((option) => (
            <li key={option.key}>{option.label}</li>
          ))}
        </ul>
      </Card>

      <Card title="Roles" description="Who can do what at this firm.">
        <ul className="list-inside list-disc text-sm text-ink">
          <li>Firm Administrator — configuration, users, workflows, costs, activity log.</li>
          <li>Attorney — matters, analyses, approvals, deadlines, communications.</li>
          <li>Paralegal — intake, documents, analyses. No approvals, no deadlines, no closing.</li>
          <li>Read-only Reviewer — may look and nothing else.</li>
        </ul>
      </Card>

      <Card title="Integrations" description="Prepared, not connected in this demonstration.">
        <p className="text-sm text-ink-muted">
          Microsoft 365, Google Workspace, Clio, MyCase, PracticePanther, SharePoint, OneDrive,
          Dropbox, DocuSign, LawPay. Integration not connected in this demonstration.
        </p>
      </Card>

      <div className="border-t border-line pt-5">
        <StepActions step={7} submitLabel="Save and stay here" />
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
