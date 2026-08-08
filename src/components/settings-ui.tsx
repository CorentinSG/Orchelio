import Link from "next/link";

import { Badge, Callout } from "@/components/ui";
import { LockIcon } from "@/components/onboarding-ui";
import { ACCENT_COLOURS, SETTINGS_SECTIONS } from "@/lib/settings/config";
import { ROLE_LABELS, type FirmRole, FIRM_ROLES } from "@/lib/auth/permissions";

/**
 * Orchelio — the firm settings surface.
 *
 * Two rules shape everything here. A control an administrator cannot use is not
 * rendered as a disabled control they have to discover is disabled — with one
 * exception, the locked approval rules, where showing the padlock *is* the
 * point. And a section that changes what the firm is says so before it is
 * changed, not afterwards in a toast.
 */

export function SettingsTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Sections des réglages" className="border-b border-line">
      <ul className="-mb-px flex flex-wrap gap-1">
        {SETTINGS_SECTIONS.map((section) => (
          <li key={section.slug}>
            <Link
              href={`/settings?section=${section.slug}`}
              aria-current={active === section.slug ? "page" : undefined}
              className={`block border-b-2 px-3 py-2 text-sm font-medium ${
                active === section.slug
                  ? "border-brand text-brand"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {section.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The submit row. Absent entirely when the reader may not change anything. */
export function SaveBar({ label = "Enregistrer les modifications" }: { label?: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
      <button
        type="submit"
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
      >
        {label}
      </button>
      <p className="text-sm text-ink-subtle">Enregistré immédiatement. Consigné au journal d’activité.</p>
    </div>
  );
}

export function ReadOnlyNotice({ what }: { what: string }) {
  return (
    <Callout tone="neutral" title="Vous lisez, vous ne modifiez pas">
      {what} Vous pouvez consulter la configuration de ce cabinet ; la modifier relève de
      l’administrateur du cabinet.
    </Callout>
  );
}

export function AccentChoice({ selected }: { selected: string }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {ACCENT_COLOURS.map((colour) => {
        const id = `accent-${colour.key}`;
        return (
          <li key={colour.key}>
            <label
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 text-sm hover:border-brand"
            >
              <input
                id={id}
                type="radio"
                name="accent"
                value={colour.key}
                defaultChecked={selected === colour.key}
                className="size-4 accent-[var(--color-brand)]"
              />
              <span
                aria-hidden
                className="size-4 rounded-full border border-line"
                style={{ backgroundColor: colour.light }}
              />
              <span className="text-ink">{colour.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export type MemberRow = {
  membershipId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  /** True for the person reading the page. */
  isSelf: boolean;
};

export function MemberList({
  members,
  canManage,
}: {
  members: readonly MemberRow[];
  canManage: boolean;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-ink-muted">Ce cabinet n’a encore aucun membre.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {members.map((member) => (
        <li key={member.membershipId} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-ink">
                {member.name}
                {member.isSelf ? <span className="ml-2 text-sm text-ink-subtle">(vous)</span> : null}
              </p>
              <p className="truncate text-sm text-ink-muted">{member.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="brand">{ROLE_LABELS[member.role as FirmRole] ?? member.role}</Badge>
              <Badge tone={member.status === "active" ? "success" : "warning"}>
                {member.status === "active" ? "actif" : "suspendu"}
              </Badge>
            </div>
          </div>

          {canManage ? (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <form method="post" action="/api/settings/members" className="flex items-end gap-2">
                <input type="hidden" name="membershipId" value={member.membershipId} />
                <input type="hidden" name="intent" value="role" />
                <div>
                  <label
                    htmlFor={`role-${member.membershipId}`}
                    className="block text-xs font-medium text-ink-muted"
                  >
                    Rôle
                  </label>
                  <select
                    id={`role-${member.membershipId}`}
                    name="role"
                    defaultValue={member.role}
                    className="mt-1 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                  >
                    {FIRM_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  Changer le rôle
                </button>
              </form>

              <form method="post" action="/api/settings/members">
                <input type="hidden" name="membershipId" value={member.membershipId} />
                <input type="hidden" name="intent" value="status" />
                <input
                  type="hidden"
                  name="status"
                  value={member.status === "active" ? "suspended" : "active"}
                />
                <button
                  type="submit"
                  className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                >
                  {member.status === "active" ? "Suspendre l’accès" : "Rétablir l’accès"}
                </button>
              </form>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * The nine rules, shown but not offered.
 *
 * They render with a padlock, are submitted by nothing, and are written in by
 * the server whatever arrives. A firm sees exactly what it cannot switch off,
 * which is the point: a guarantee nobody can see is a guarantee nobody trusts.
 */
export function LockedRules({ rules }: { rules: readonly { key: string; label: string; description: string }[] }) {
  return (
    <ul className="space-y-2">
      {rules.map((rule) => (
        <li
          key={rule.key}
          className="flex gap-3 rounded-card border border-line bg-surface-muted px-4 py-3"
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">{rule.label}</span>
              <Badge tone="warning">
                <LockIcon /> Toujours obligatoire
              </Badge>
            </span>
            <span className="mt-0.5 block text-sm text-ink-muted">{rule.description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
