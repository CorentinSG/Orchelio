import { IS_DEMO } from "@/lib/app-config";

/**
 * Orchelio — demonstration accounts.
 *
 * Every account is fictional and uses the reserved `.local` domain, which
 * cannot exist on the real internet. The specification allows the passwords to
 * be shown on the sign-in page, and they are: hiding a password that is written
 * in a public repository would be theatre, not security.
 *
 * These accounts exist only when NEXT_PUBLIC_APP_ENV is "demo". The seed script
 * and the sign-in page read the same list, so they cannot drift apart.
 */

export type DemoAccount = {
  email: string;
  password: string;
  name: string;
  /** Shown on the sign-in page so a visitor knows what they are about to see. */
  roleLabel: string;
  firmName: string | null;
};

export const DEMO_PASSWORD = "orchelio-demo";

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: "platform.admin@demo.local",
    password: DEMO_PASSWORD,
    name: "Robin Marchand",
    roleLabel: "Platform Administrator",
    firmName: null,
  },
  {
    email: "immigration.attorney@demo.local",
    password: DEMO_PASSWORD,
    name: "Claire Dupont",
    roleLabel: "Firm Administrator & Attorney",
    firmName: "Dupont Immigration Law",
  },
  {
    email: "immigration.paralegal@demo.local",
    password: DEMO_PASSWORD,
    name: "Noah Petit",
    roleLabel: "Paralegal",
    firmName: "Dupont Immigration Law",
  },
  {
    email: "employment.attorney@demo.local",
    password: DEMO_PASSWORD,
    name: "Alex Carter",
    roleLabel: "Firm Administrator & Attorney",
    firmName: "Carter Employment & Labor Law",
  },
  {
    email: "employment.paralegal@demo.local",
    password: DEMO_PASSWORD,
    name: "Jordan Ellis",
    roleLabel: "Paralegal",
    firmName: "Carter Employment & Labor Law",
  },
  {
    // Sixth account, beyond the five named in the specification. It exists to
    // demonstrate two things the other five cannot: the Read-only Reviewer
    // role, and the firm switcher — which needs somebody who belongs to more
    // than one firm. Belonging to both firms makes isolation vivid: the same
    // person, two workspaces, and not one row in common.
    email: "reviewer@demo.local",
    password: DEMO_PASSWORD,
    name: "Sam Whitfield",
    roleLabel: "Read-only Reviewer",
    firmName: "Both demonstration firms",
  },
] as const;

/** The accounts to advertise on the sign-in page. Empty outside the demo build. */
export function visibleDemoAccounts(): readonly DemoAccount[] {
  return IS_DEMO ? DEMO_ACCOUNTS : [];
}
