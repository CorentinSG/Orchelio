import type { ReactNode } from "react";

import { Badge } from "@/components/ui";
import { ONBOARDING_STEPS, ONBOARDING_STEP_COUNT } from "@/lib/onboarding/config";

/**
 * Orchelio — questionnaire building blocks.
 *
 * The audience is a lawyer, not an administrator: every control is a labelled
 * checkbox or a plain field, every option says what it means, and nothing is
 * hidden behind an icon.
 */

export function ProgressBar({ step }: { step: number }) {
  const percent = Math.round((step / ONBOARDING_STEP_COUNT) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">
          Étape {step} sur {ONBOARDING_STEP_COUNT} — {ONBOARDING_STEPS[step - 1]?.title}
        </p>
        <p className="text-sm text-ink-muted">{percent}%</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEP_COUNT}
        aria-label="Progression de l’installation"
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
      <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {ONBOARDING_STEPS.map((entry) => (
          <li
            key={entry.number}
            aria-current={entry.number === step ? "step" : undefined}
            className={
              entry.number === step
                ? "font-semibold text-brand"
                : entry.number < step
                  ? "text-ink-muted"
                  : "text-ink-subtle"
            }
          >
            {entry.number}. {entry.title}
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * A labelled field.
 *
 * `htmlFor` is required, and the caller must put the same value on the input's
 * `id`. A label floating next to an input rather than bound to it is invisible
 * to a screen reader and does nothing when clicked — so the binding is not
 * optional here.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={`${htmlFor}-hint`} className="mt-0.5 text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle";

/**
 * A checkbox with its explanation.
 *
 * `locked` renders the padlock the specification requires: the rule is shown,
 * is visibly not a choice, and is submitted by nothing — the server writes it
 * in regardless.
 */
export function CheckboxOption({
  name,
  value,
  label,
  description,
  defaultChecked,
  locked = false,
}: {
  name: string;
  value: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  locked?: boolean;
}) {
  const id = `${name}-${value}`;

  return (
    <li>
      <label
        htmlFor={id}
        className={`flex gap-3 rounded-card border px-4 py-3 ${
          locked
            ? "cursor-not-allowed border-line bg-surface-muted"
            : "cursor-pointer border-line bg-surface hover:border-brand"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          name={locked ? undefined : name}
          value={value}
          defaultChecked={locked ? true : defaultChecked}
          disabled={locked}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand)]"
        />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">{label}</span>
            {locked ? (
              <Badge tone="warning">
                <LockIcon /> Toujours obligatoire
              </Badge>
            ) : null}
          </span>
          {description ? (
            <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
          ) : null}
        </span>
      </label>
    </li>
  );
}

export function LockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3 fill-current">
      <path d="M8 1a3.2 3.2 0 0 0-3.2 3.2V6H4.4A1.4 1.4 0 0 0 3 7.4v5.2A1.4 1.4 0 0 0 4.4 14h7.2a1.4 1.4 0 0 0 1.4-1.4V7.4A1.4 1.4 0 0 0 11.6 6h-.4V4.2A3.2 3.2 0 0 0 8 1Zm0 1.6a1.6 1.6 0 0 1 1.6 1.6V6H6.4V4.2A1.6 1.6 0 0 1 8 2.6Z" />
    </svg>
  );
}

/** Back / Save as draft / Continue. Present on every step. */
export function StepActions({
  step,
  submitLabel = "Continuer",
}: {
  step: number;
  submitLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
      {step > 1 ? (
        <button
          type="submit"
          name="intent"
          value="back"
          formNoValidate
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Retour
        </button>
      ) : null}

      <button
        type="submit"
        name="intent"
        value="continue"
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
      >
        {submitLabel}
      </button>

      <button
        type="submit"
        name="intent"
        value="draft"
        formNoValidate
        className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
      >
        Enregistrer le brouillon
      </button>

      <p className="text-sm text-ink-subtle">Chaque réponse est enregistrée au fur et à mesure.</p>
    </div>
  );
}

/** A left-to-right preview of the workflow the firm has just described. */
export function WorkflowPreview({ steps }: { steps: readonly string[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Sélectionnez les étapes ci-dessus et un aperçu de votre déroulé apparaîtra ici.
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {steps.map((label, index) => (
        <li key={label} className="flex items-center gap-1.5">
          <span className="rounded-full border border-brand/25 bg-brand-soft px-3 py-1 text-sm text-ink">
            {label}
          </span>
          {index < steps.length - 1 ? (
            <span aria-hidden className="text-ink-subtle">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
