import Link from "next/link";

import { DemoBanner } from "@/components/demo-banner";
import { OrchelioWordmark } from "@/components/brand";
import { Badge, Callout, Card } from "@/components/ui";
import { GUIDE_STEPS, GUIDE_STEP_COUNT } from "@/lib/guide";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { APP_NAME, FICTIONAL_DATA_NOTICE, POWERED_BY } from "@/lib/app-config";

export const metadata = {
  title: "Visite guidée",
  description: `Une visite d’${APP_NAME} en ${GUIDE_STEP_COUNT} étapes.`,
};

/**
 * Orchelio — the guided demonstration.
 *
 * Public, and deliberately so: somebody deciding whether to sign in should be
 * able to read what they would be shown first. Nothing on this page reads a
 * firm's data — it is the walkthrough, not the product.
 *
 * Several steps ask the reader to notice a refusal or an absence. That is not
 * modesty about an unfinished product; what Orchelio declines to do is the
 * substance of it, and a walkthrough that only showed the features would be
 * describing a different product.
 */
export default function GuidePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <main id="main" tabIndex={-1} className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <header>
            <OrchelioWordmark subtitle="Visite guidée" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
              {APP_NAME} en {GUIDE_STEP_COUNT} étapes
            </h1>
            <p className="mt-2 text-ink-muted">
              Dans l’ordre, une vingtaine de minutes. Chaque étape nomme le compte avec lequel se
              connecter, l’écran à ouvrir, et — c’est là l’essentiel — ce qu’il faut y regarder.
            </p>
          </header>

          <Callout tone="warning" title="Tout ce que vous allez voir est inventé">
            <p>{FICTIONAL_DATA_NOTICE}</p>
            <p className="mt-2">
              Tous les comptes utilisent le mot de passe{" "}
              <span className="font-mono">{DEMO_PASSWORD}</span>, qui figure aussi sur la page de
              connexion. Aucune requête d’IA ne quitte cette machine au cours de cette visite, et
              rien n’y engage de frais.
            </p>
          </Callout>

          <ol className="space-y-4">
            {GUIDE_STEPS.map((step) => (
              <li key={step.number}>
                <Card
                  title={
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-mono text-ink-subtle">
                        {String(step.number).padStart(2, "0")}
                      </span>
                      <span>{step.title}</span>
                    </span>
                  }
                >
                  <p className="text-sm text-ink">{step.action}</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    <span className="font-medium text-ink">À regarder :</span> {step.notice}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={step.href}
                      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
                    >
                      Ouvrir {step.href}
                    </Link>
                    {step.account ? (
                      <Badge tone="neutral">
                        <span className="font-mono">{step.account}</span>
                      </Badge>
                    ) : (
                      <Badge tone="neutral">le compte que vous venez de créer</Badge>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ol>

          <Card title="Quand vous arriverez au bout">
            <p className="text-sm text-ink-muted">
              Trois cabinets existeront, configurés différemment, partageant un seul code et pas
              une seule ligne de données. C’est là toute la promesse d’{APP_NAME}, et les étapes 18
              à 21 sont celles qui la mettent à l’épreuve plutôt que de l’affirmer.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/login" className="font-medium text-brand underline underline-offset-4">
                Commencer à l’étape 1
              </Link>{" "}
              ·{" "}
              <Link href="/" className="font-medium text-brand underline underline-offset-4">
                Retour à l’accueil
              </Link>
            </p>
          </Card>

          <p className="text-xs text-ink-subtle">{POWERED_BY}</p>
        </div>
      </main>
    </div>
  );
}
