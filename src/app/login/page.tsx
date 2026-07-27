import { redirect } from "next/navigation";

import { OrchelioWordmark } from "@/components/brand";
import { DemoBanner } from "@/components/demo-banner";
import { Callout } from "@/components/ui";
import { LoginForm } from "@/app/login/login-form";
import { APP_NAME, APP_TAGLINE, POWERED_BY } from "@/lib/app-config";
import { currentSession } from "@/lib/auth/session";
import { visibleDemoAccounts } from "@/lib/demo-accounts";

export const metadata = { title: "Sign in" };

/** Sign-in is always rendered fresh: it depends on the caller's session cookie. */
export const dynamic = "force-dynamic";

function safeNext(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string") return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await currentSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const next = safeNext(params["next"]);

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <OrchelioWordmark size="lg" />
          <p className="mt-2 text-sm text-ink-muted">{APP_TAGLINE}</p>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink">
            Sign in to {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Use one of the fictional demonstration accounts below.
          </p>

          <div className="mt-6">
            <LoginForm accounts={visibleDemoAccounts()} next={next} />
          </div>

          <div className="mt-6">
            <Callout tone="warning" title="Demonstration sign-in">
              This sign-in exists to demonstrate roles and access control. It is not a production
              authentication system: there is no multi-factor authentication and the passwords are
              published. Never reuse a real password here.
            </Callout>
          </div>

          <p className="mt-8 text-center text-xs text-ink-subtle">{POWERED_BY}</p>
        </div>
      </main>
    </div>
  );
}
