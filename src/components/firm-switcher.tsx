import { practiceAreaLabel } from "@/lib/practice-areas";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { SessionFirm } from "@/lib/auth/session";

/**
 * Firm switcher.
 *
 * Shown only to a user who actually belongs to more than one firm — a control
 * that offers a single option is noise, and a control that offers firms the
 * user cannot enter would be a lie.
 *
 * Each option is a separate form posting to a route handler that answers with
 * an HTTP 303. That is not the idiomatic Server Action, and the reason is
 * recorded in src/app/api/firms/switch/route.ts: the action's own re-render did
 * not reliably reflect the firm it had just switched to, and showing a user the
 * wrong firm's dashboard is the one failure this product cannot have.
 *
 * A side benefit: it works with JavaScript disabled.
 */
export function FirmSwitcher({
  firms,
  activeFirmId,
}: {
  firms: readonly SessionFirm[];
  activeFirmId: string;
}) {
  if (firms.length < 2) {
    return null;
  }

  return (
    <section aria-labelledby="firm-switcher" className="border-b border-line px-2 py-3">
      <h2 id="firm-switcher" className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Vos cabinets
      </h2>
      <ul className="mt-2 space-y-1">
        {firms.map((firm) => {
          const isActive = firm.id === activeFirmId;
          return (
            <li key={firm.id}>
              <form method="post" action="/api/firms/switch">
                <input type="hidden" name="firmId" value={firm.id} />
                <button
                  type="submit"
                  aria-current={isActive ? "true" : undefined}
                  className={`w-full rounded-md border px-3 py-2 text-left ${
                    isActive
                      ? "border-brand bg-brand-soft"
                      : "border-transparent hover:border-line hover:bg-surface-muted"
                  }`}
                >
                  <span className="block text-sm font-medium text-ink">{firm.name}</span>
                  <span className="block text-xs text-ink-muted">
                    {practiceAreaLabel(firm.primaryPracticeArea)} · {ROLE_LABELS[firm.role]}
                  </span>
                  {isActive ? (
                    <span className="mt-0.5 block text-xs font-medium text-brand">
                      Actuellement ouvert
                    </span>
                  ) : null}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
