import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import {
  CLASS_DEFINITIONS,
  ENFORCEMENT,
  modelsInClass,
  type ConfidentialityClass,
} from "@/lib/confidentiality/classification";
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";
import { APP_NAME } from "@/lib/app-config";

/**
 * Orchelio — the confidentiality report.
 *
 * A firm that has to take "your data does not go anywhere" on trust is a firm
 * that worries about it. This screen exists so it does not have to: every claim
 * on it names the thing a sceptic can go and read, and every claim that nothing
 * yet enforces says so, in the same list, in the same words.
 *
 * It is the one settings section with no form. Confidentiality is not a
 * preference a firm sets — it is a property of the system, and what this page
 * owes the firm is an accurate description of it rather than a switch.
 */

const CLASSES_INTRODUCTION =
  "They do not carry the same sensitivity, so they do not get the same rules. Every record " +
  `${APP_NAME} stores belongs to exactly one of these, and a new kind of record that belongs ` +
  "to none of them fails the build.";

const CLASS_TONE: Record<ConfidentialityClass, "neutral" | "brand" | "warning" | "danger"> = {
  platform: "neutral",
  identity: "neutral",
  firm_internal: "brand",
  client_confidential: "warning",
  privileged: "danger",
};

/** Plain-language names for the models, so the page reads to a lawyer. */
const MODEL_LABELS: Record<string, string> = {
  PracticeArea: "practice areas",
  MatterType: "matter types",
  WorkflowTemplate: "workflow templates",
  User: "people who sign in",
  Session: "sign-in sessions",
  Firm: "the firm record",
  FirmMembership: "who works here",
  FirmConfiguration: "this firm's configuration",
  FirmWorkflow: "enabled workflows",
  UsageRecord: "assistant usage",
  ClientProfile: "client records",
  Matter: "matters",
  WorkflowRun: "workflow runs",
  WorkflowStep: "workflow steps",
  Task: "tasks",
  ApprovalRequest: "approval requests",
  AuditEvent: "the activity log",
  Document: "documents",
  IntakeResponse: "intake answers",
  AIAnalysis: "analyses",
  AIReview: "reviews",
  DraftCommunication: "draft communications",
};

function describe(models: readonly string[]): string {
  return models.map((model) => MODEL_LABELS[model] ?? model).join(", ");
}

export function ConfidentialityReport({ firmName }: { firmName: string }) {
  const enforced = ENFORCEMENT.filter((entry) => entry.enforcedBy !== null);
  const notYet = ENFORCEMENT.filter((entry) => entry.enforcedBy === null);
  // Read from the configuration rather than asserted here: "nothing is sent"
  // was true of the only provider that existed, and would have gone on being
  // displayed, unchanged and wrong, under a hosted one.
  const notice = providerNotice(serverEnv());

  return (
    <div className="space-y-6">
      <Callout tone="warning" title="This instance holds no real client data">
        Everything in {firmName} is fictional, and this page describes the demonstration as it
        actually is — not as a deployment would be. Where the two differ, it says which.
      </Callout>

      {/* --- Where it lives ------------------------------------------------ */}

      <div>
        <h3 className="text-sm font-semibold text-ink">Where your data is, right now</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          One file, on the machine running {APP_NAME}. No cloud service, no external database, no
          content-delivery network, and no backup — because there is nowhere for one to go.
        </p>
        <div className="mt-3">
          <CommandLine>prisma/orchelio-demo.db</CommandLine>
        </div>
        <dl className="mt-3">
          <DataRow label="Documents you upload" value="Never stored" hint="only a name, a type and a size" />
          <DataRow label="Encrypted at rest" value="No" hint="anybody with the file has everything" />
          <DataRow label="Sent to an AI provider" value={notice.sentToProvider} hint={notice.sentToProviderHint} />
          <DataRow label="Copies elsewhere" value="None" hint="no backup, no search index" />
        </dl>
      </div>

      {/* --- What kind of data ---------------------------------------------- */}

      <div>
        <h3 className="text-sm font-semibold text-ink">
          &ldquo;Client data&rdquo; is five different things
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">{CLASSES_INTRODUCTION}</p>
        <ul className="mt-3 space-y-2">
          {CLASS_DEFINITIONS.map((definition) => {
            const models = modelsInClass(definition.key);
            return (
              <li
                key={definition.key}
                className="rounded-card border border-line bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">{definition.label}</span>
                  <Badge tone={CLASS_TONE[definition.key]}>
                    {definition.operatorMayRead
                      ? "operator may read"
                      : "operator may not read"}
                  </Badge>
                  {definition.keyHolder === "firm" ? (
                    <Badge tone="neutral">key held by the firm — planned</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{definition.what}</p>
                <p className="mt-1 text-sm text-ink-subtle">
                  {models.length} kind(s): {describe(models)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* --- What holds it up ------------------------------------------------ */}

      <Card
        title={`${enforced.length} promise(s) something actually enforces`}
        description="Each names what a sceptic can go and read."
      >
        <ul className="space-y-3">
          {enforced.map((entry) => (
            <li key={entry.rule}>
              <p className="text-sm font-medium text-ink">{entry.rule}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{entry.enforcedBy}</p>
              <p className="mt-0.5 text-sm text-ink-subtle">
                <span className="font-medium">What it does not cover:</span> {entry.limitation}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* --- And what does not ------------------------------------------------ */}

      <Card
        title={`${notYet.length} promise(s) nothing enforces yet`}
        description="Listed here rather than left out, because a list of only the good news is not a list."
      >
        <ul className="space-y-3">
          {notYet.map((entry) => (
            <li key={entry.rule}>
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                {entry.rule}
                <Badge tone="danger">not implemented</Badge>
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">{entry.limitation}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Callout tone="neutral" title="Verify this yourself">
        <p>
          None of the above has to be believed. The first three run as a check that fails the
          build, and the isolation between firms is proved by tests against a real database holding
          two firms with deliberately similar records.
        </p>
        <div className="mt-2 space-y-2">
          <CommandLine>npm run confidentiality:check</CommandLine>
          <CommandLine>npm run test:integration</CommandLine>
        </div>
      </Callout>
    </div>
  );
}
