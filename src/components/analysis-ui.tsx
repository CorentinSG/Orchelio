import { Badge, Callout, Card, type Tone } from "@/components/ui";
import { formatDate } from "@/components/matter-ui";
import {
  type AnalysisReviewResult,
  type FactSource,
  type MatterAnalysisResult,
  type ReviewStatus,
  type SupportLevel,
  reviewIssueLabel,
  reviewStatusLabel,
  supportCaveat,
  supportLabel,
} from "@/lib/ai/types";

/**
 * Orchelio — showing an analysis.
 *
 * Every rule the analyst obeys has to survive being rendered, and most of the
 * ways an honest analysis becomes a dishonest screen happen here:
 *
 *  * A source shown as a filename reads as "the document says so". Each one
 *    carries what it actually means.
 *  * A confidence figure in large type becomes the thing people quote. It is
 *    shown small, beside the band, labelled "simulated".
 *  * A contradiction rendered as a warning triangle looks resolved by being
 *    named. It is rendered as two accounts side by side, neither preferred.
 */

const SUPPORT_TONE: Record<SupportLevel, Tone> = {
  document_agrees: "success",
  document_on_file_checked: "brand",
  document_on_file: "neutral",
  stated_twice: "neutral",
  stated_only: "warning",
  disputed: "danger",
};

const REVIEW_TONE: Record<ReviewStatus, Tone> = {
  approved_for_human_review: "success",
  corrections_required: "warning",
  insufficient_information: "warning",
};

export function SourceList({ sources }: { sources: readonly FactSource[] }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {sources.map((source, index) => (
        <li key={`${source.label}-${index}`} className="text-xs text-ink-subtle">
          <span className="font-medium">{sourceKindLabel(source.kind)}:</span> {source.label}
          {source.kind === "document" ? (
            <span className="ml-1">
              {source.verified ? "(checked by a person)" : "(not checked)"}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function sourceKindLabel(kind: FactSource["kind"]): string {
  switch (kind) {
    case "intake":
      return "Client intake";
    case "document":
      return "Document on file";
    case "matter_field":
      return "Recorded on the matter";
  }
}

export function AnalysisWarnings({ warnings }: { warnings: readonly string[] }) {
  return (
    <Callout tone="ai" title="Read this first">
      <ul className="ml-4 list-disc space-y-1">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </Callout>
  );
}

export function ContradictionCard({
  contradiction,
}: {
  contradiction: MatterAnalysisResult["contradictions"][number];
}) {
  return (
    <div className="rounded-card border border-danger/35 bg-danger-soft px-4 py-3">
      <p className="font-semibold text-ink">{contradiction.subject}</p>

      {/* Side by side, in the order found, with no version marked as the
          likely one. Choosing between them is the lawyer's job. */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {contradiction.statements.map((statement, index) => (
          <div
            key={`${statement.source.label}-${index}`}
            className="rounded-md border border-line bg-surface px-3 py-2"
          >
            <p className="text-sm font-medium text-ink">{statement.value}</p>
            <SourceList sources={[statement.source]} />
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-muted">{contradiction.note}</p>
    </div>
  );
}

export function KeyFactRow({ fact }: { fact: MatterAnalysisResult["keyFacts"][number] }) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{fact.label}</p>
          <p className="font-medium text-ink">{fact.value}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={SUPPORT_TONE[fact.support]}>{supportLabel(fact.support)}</Badge>
          {/* Small, and always labelled. It is a restatement of the band, not
              a measurement, and nothing should be decided on it. */}
          <span className="text-xs text-ink-subtle">
            {Math.round(fact.simulatedConfidence * 100)}% simulated
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-subtle">{supportCaveat(fact.support)}</p>
      <SourceList sources={fact.sources} />
    </li>
  );
}

export function TimelineList({ events }: { events: MatterAnalysisResult["timeline"] }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((event, index) => (
        <li key={`${event.date}-${index}`} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[1.575rem] top-1.5 size-2.5 rounded-full ring-2 ring-surface ${
              event.stated ? "bg-warning" : "bg-brand"
            }`}
          />
          <p className="font-mono text-sm text-ink">{event.date}</p>
          <p className="text-sm font-medium text-ink">{event.label}</p>
          <p className="text-xs text-ink-subtle">
            {event.stated
              ? "Stated by a person — not confirmed against anything"
              : "Read from a document's name or its filing date"}
          </p>
          <SourceList sources={[event.source]} />
        </li>
      ))}
    </ol>
  );
}

export function ReviewPanel({ review }: { review: AnalysisReviewResult }) {
  const failed = review.checks.filter((check) => !check.passed);

  return (
    <Card
      title="Independent review"
      description="A second pass over the same matter, looking for what the first one overstated."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={REVIEW_TONE[review.status]}>{reviewStatusLabel(review.status)}</Badge>
        {/* Stored on the row, not asserted here. It has no other value. */}
        <Badge tone="warning">Human review required</Badge>
      </div>

      <p className="mt-3 text-sm text-ink-muted">{review.summary}</p>

      {review.issues.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {review.issues.map((issue, index) => (
            <li
              key={`${issue.category}-${index}`}
              className="rounded-md border border-warning/35 bg-warning-soft px-3 py-2"
            >
              <p className="text-sm font-medium text-ink">
                {reviewIssueLabel(issue.category)} — {issue.where}
              </p>
              <p className="text-sm text-ink-muted">{issue.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Every check, not only the failures: a clean review is only evidence
          if you can see what was looked at. */}
      <details className="mt-4" open={failed.length > 0}>
        <summary className="cursor-pointer text-sm font-medium text-brand">
          What was checked ({review.checks.filter((check) => check.passed).length} of{" "}
          {review.checks.length} passed)
        </summary>
        <ul className="mt-2 divide-y divide-line">
          {review.checks.map((check) => (
            <li key={check.name} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-ink">{check.name}</p>
                <p className="text-xs text-ink-subtle">{check.note}</p>
              </div>
              <Badge tone={check.passed ? "success" : "warning"}>
                {check.passed ? "Passed" : "Not passed"}
              </Badge>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

export function QuestionList({
  questions,
}: {
  questions: MatterAnalysisResult["attorneyQuestions"];
}) {
  return (
    <ul className="divide-y divide-line">
      {questions.map((question, index) => (
        <li key={`${question.question}-${index}`} className="py-2.5">
          <p className="text-sm font-medium text-ink">{question.question}</p>
          <p className="text-xs text-ink-subtle">{question.why}</p>
        </li>
      ))}
    </ul>
  );
}

/** The state of a run, said plainly. A failed run must not look like an empty one. */
export function AnalysisStatus({
  status,
  startedAt,
  completedAt,
  errorMessage,
}: {
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
}) {
  if (status === "running") {
    return (
      <Callout tone="brand" title="Running">
        Started {formatDate(startedAt)}. Reload this page to see the result.
      </Callout>
    );
  }

  if (status === "failed") {
    return (
      <Callout tone="danger" title="This analysis did not finish" assertive>
        <p>{errorMessage ?? "The run did not complete."}</p>
        <p className="mt-2">
          Nothing partial was kept. A matter that shows no analysis and a matter whose analysis
          failed are different things, and this is the second.
        </p>
      </Callout>
    );
  }

  return (
    <p className="text-sm text-ink-subtle">
      Run {formatDate(startedAt)}
      {completedAt ? `, finished ${formatDate(completedAt)}` : null}.
    </p>
  );
}
