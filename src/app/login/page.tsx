import { redirect } from "next/navigation";

import { OrchelioWordmark } from "@/components/brand";
import { DemoBanner } from "@/components/demo-banner";
import { Callout } from "@/components/ui";
import { LoginForm } from "@/app/login/login-form";
import { APP_NAME, APP_TAGLINE, POWERED_BY } from "@/lib/app-config";
import { currentSession } from "@/lib/auth/session";
import { visibleDemoAccounts } from "@/lib/demo-accounts";

export const metadata = { title: "Se connecter" };

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

      <main id="main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <OrchelioWordmark size="lg" />
          <p className="mt-2 text-sm text-ink-muted">{APP_TAGLINE}</p>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink">
            Se connecter à {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Utilisez l’un des comptes de démonstration fictifs ci-dessous.
          </p>

          <div className="mt-6">
            <LoginForm accounts={visibleDemoAccounts()} next={next} />
          </div>

          <div className="mt-6">
            <Callout tone="warning" title="Connexion de démonstration">
              Cette connexion existe pour montrer les rôles et le contrôle d’accès. Ce n’est pas
              un système d’authentification de production : pas de double facteur, et les mots de
              passe sont publiés. N’y réutilisez jamais un vrai mot de passe.
            </Callout>
          </div>

          <p className="mt-8 text-center text-xs text-ink-subtle">{POWERED_BY}</p>
        </div>
      </main>
    </div>
  );
}
