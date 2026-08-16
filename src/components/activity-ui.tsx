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
      return "Connexion réussie";
    case "auth.login.failed":
      return "Connexion échouée";
    case "auth.login.throttled":
      return "Connexions ralenties";
    case "auth.logout":
      return "Déconnexion";
    case "access.denied":
      return "Accès refusé";
    case "firm.created":
      return "Cabinet créé";
    case "firm.viewed":
      return "Tableau de bord ouvert";
    case "firm.switched":
      return "Changement de cabinet";
    case "firm.configuration.updated":
      return "Configuration du cabinet modifiée";
    case "matter.created":
      return "Dossier créé";
    case "matter.viewed":
      return "Dossier ouvert";
    case "matter.closed":
      return "Dossier clos";
    case "matter.deadline.changed":
      return "Date modifiée sur un dossier";
    case "document.added":
      return "Document ajouté";
    case "ai.analysis.started":
      return "Analyse lancée";
    case "ai.analysis.completed":
      return "Analyse terminée";
    case "ai.review.completed":
      return "Analyse relue";
    case "approval.requested":
      return "Demande de validation créée";
    case "approval.decided":
      return "Décision enregistrée";
    case "communication.draft.prepared":
      return "Brouillon préparé";
    case "communication.prepared":
      return "Courrier préparé";
    case "membership.role.changed":
      return "Rôle modifié";
    case "demo.seeded":
      return "Données de démonstration installées";
    default:
      return action.split(".").join(" · ");
  }
}

export function ActivityStatusBadge({ status }: { status: string }) {
  if (status === "success") return null;
  const label = status === "denied" ? "refusé" : status === "failure" ? "échec" : status;
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
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

  if (typeof value["reference"] === "string") lines.push(`Dossier ${value["reference"]}`);
  if (typeof value["filename"] === "string") lines.push(String(value["filename"]));
  if (typeof value["subject"] === "string") lines.push(`"${value["subject"]}"`);
  if (typeof value["approvalAction"] === "string") {
    lines.push(`Action : ${String(value["approvalAction"]).split("_").join(" ")}`);
  }
  if (typeof value["status"] === "string" && previous && typeof previous["status"] === "string") {
    lines.push(`${previous["status"]} → ${value["status"]}`);
  }
  if (typeof value["required"] === "string") {
    lines.push(
      value["required"] === "locked"
        ? "Requis par une règle impossible à désactiver"
        : value["required"] === "configured"
          ? "Requis parce que ce cabinet l’a demandé"
          : "Aucune validation requise par ce cabinet",
    );
  }
  if (typeof value["note"] === "string" && value["note"]) lines.push(`Note : ${value["note"]}`);
  if (typeof value["effectApplied"] === "boolean") {
    lines.push(value["effectApplied"] ? "L’action a pris effet" : "Rien n’a pris effet");
  }
  if (typeof value["reason"] === "string") lines.push(`Motif : ${value["reason"]}`);
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
