import { Badge, type Tone } from "@/components/ui";

/**
 * Orchelio — reading the activity log.
 *
 * A log is only useful if a person can tell what happened without knowing the
 * schema. Two jobs here: turn a dotted action name into a sentence, and render
 * the stored JSON payload as something a lawyer can read rather than a blob.
 */

const STATUS_TONE: Record<string, Tone> = {
  success: "neutral",
  failure: "danger",
  denied: "warning",
};

/** A dotted action name, in words. Unknown names degrade to their own text. */
export function activityLabel(action: string): string {
  switch (action) {
    case "auth.login.succeeded":
      return "Signed in";
    case "auth.login.failed":
      return "Sign-in failed";
    case "auth.login.throttled":
      return "Sign-in throttled";
    case "auth.logout":
      return "Signed out";
    case "access.denied":
      return "Access refused";
    case "firm.created":
      return "Firm created";
    case "firm.viewed":
      return "Dashboard opened";
    case "firm.switched":
      return "Switched firm";
    case "firm.configuration.updated":
      return "Firm configuration changed";
    case "matter.created":
      return "Matter created";
    case "matter.viewed":
      return "Matter opened";
    case "matter.closed":
      return "Matter closed";
    case "matter.deadline.changed":
      return "Date on a matter changed";
    case "document.added":
      return "Document added";
    case "ai.analysis.started":
      return "Analysis started";
    case "ai.analysis.completed":
      return "Analysis finished";
    case "ai.review.completed":
      return "Analysis reviewed";
    case "approval.requested":
      return "Approval raised";
    case "approval.decided":
      return "Decision recorded";
    case "communication.draft.prepared":
      return "Draft prepared";
    case "communication.prepared":
      return "Communication prepared";
    case "membership.role.changed":
      return "Role changed";
    case "demo.seeded":
      return "Demonstration data seeded";
    default:
      return action.split(".").join(" · ");
  }
}

export function ActivityStatusBadge({ status }: { status: string }) {
  if (status === "success") return null;
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}

/**
 * The stored payload, in words.
 *
 * Only the keys worth showing, and each one named. The raw JSON is available
 * underneath for anyone who wants it — hiding it entirely would make the log
 * less trustworthy, not more.
 */
export function ActivityDetail({ oldValue, newValue }: { oldValue: string | null; newValue: string | null }) {
  const parsed = safeParse(newValue);
  const previous = safeParse(oldValue);
  if (!parsed && !previous) return null;

  const lines: string[] = [];
  const value = parsed ?? {};

  if (typeof value["reference"] === "string") lines.push(`Matter ${value["reference"]}`);
  if (typeof value["filename"] === "string") lines.push(String(value["filename"]));
  if (typeof value["subject"] === "string") lines.push(`"${value["subject"]}"`);
  if (typeof value["approvalAction"] === "string") {
    lines.push(`Action: ${String(value["approvalAction"]).split("_").join(" ")}`);
  }
  if (typeof value["status"] === "string" && previous && typeof previous["status"] === "string") {
    lines.push(`${previous["status"]} → ${value["status"]}`);
  }
  if (typeof value["required"] === "string") {
    lines.push(
      value["required"] === "locked"
        ? "Required by a rule that cannot be switched off"
        : value["required"] === "configured"
          ? "Required because this firm asked for it"
          : "No approval required by this firm",
    );
  }
  if (typeof value["note"] === "string" && value["note"]) lines.push(`Note: ${value["note"]}`);
  if (typeof value["effectApplied"] === "boolean") {
    lines.push(value["effectApplied"] ? "The action took effect" : "Nothing took effect");
  }
  if (typeof value["reason"] === "string") lines.push(`Reason: ${value["reason"]}`);
  if (typeof value["because"] === "string") lines.push(String(value["because"]));

  if (lines.length === 0) return null;

  return (
    <ul className="mt-1 space-y-0.5">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="text-xs text-ink-subtle">
          {line}
        </li>
      ))}
    </ul>
  );
}

function safeParse(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
