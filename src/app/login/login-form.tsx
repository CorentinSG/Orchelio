"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Callout } from "@/components/ui";
import { type SignInState, signInAction } from "@/app/login/actions";
import type { DemoAccount } from "@/lib/demo-accounts";

/**
 * Sign-in form.
 *
 * The demonstration accounts fill the form rather than signing in directly:
 * one click still shows what is being submitted, which is the point of a
 * demonstration.
 */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand px-4 py-3 text-base font-semibold text-brand-ink hover:bg-brand-strong disabled:opacity-60"
    >
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

const INITIAL: SignInState = { error: null };

export function LoginForm({
  accounts,
  next,
}: {
  accounts: readonly DemoAccount[];
  next: string | null;
}) {
  const [state, formAction] = useActionState(signInAction, INITIAL);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle"
            placeholder="nom@demo.local"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>

        {state.error ? (
          <Callout tone="danger" assertive>
            {state.error}
          </Callout>
        ) : null}

        <SubmitButton />
      </form>

      {accounts.length > 0 ? (
        <section aria-labelledby="demo-accounts" className="rounded-card border border-line bg-surface-muted p-4">
          <h2 id="demo-accounts" className="text-sm font-semibold text-ink">
            Comptes de démonstration
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tous fictifs. Choisissez-en un pour remplir le formulaire, puis connectez-vous.
          </p>

          <ul className="mt-3 space-y-2">
            {accounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-left hover:border-brand"
                >
                  <span className="block text-sm font-medium text-ink">{account.name}</span>
                  <span className="block text-xs text-ink-muted">
                    {account.roleLabel}
                    {account.firmName ? ` · ${account.firmName}` : ""}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-ink-subtle">
                    {account.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-ink-subtle">
            Mot de passe de tous les comptes de démonstration :{" "}
            <code className="font-mono text-ink-muted">{accounts[0]?.password}</code>
          </p>
        </section>
      ) : null}
    </div>
  );
}
