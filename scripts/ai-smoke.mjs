#!/usr/bin/env node
/**
 * Orchelio — proves the Mistral key and connectivity, by hand.
 *
 * Run by a person (`npm run ai:smoke`), never by the build or the tests: the
 * build must not require the network (ADR-0027), and a test that needs a paid
 * API is a test that stops running. This script is the one deliberate
 * exception to "nothing calls out during development", and it lives outside
 * src/ — the confidentiality check governs the application, not the tools a
 * human points at it.
 *
 * What it does, in order, spending well under a cent:
 *
 *   1. Reads MISTRAL_API_KEY from .env (never printed).
 *   2. Lists the models the key can see, and checks every model the router
 *      names actually exists.
 *   3. Prints the price table beside its as-of date, so drift is visible.
 *   4. Makes one tiny chat call on the light model and reports what it cost.
 *
 * Failure modes it names: no key, network blocked (this development
 * environment's policy denies api.mistral.ai — run from the owner's machine,
 * or allow the domain), key refused, model missing.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BASE = "https://api.mistral.ai";

// .env is parsed by hand rather than through a library: this script must work
// on a machine where `npm install` just finished and nothing else is set up.
function readEnvFile() {
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8");
    const entries = {};
    for (const line of raw.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (match) entries[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
    return entries;
  } catch {
    return {};
  }
}

const env = { ...readEnvFile(), ...process.env };
const key = env["MISTRAL_API_KEY"];

console.log("\nOrchelio — Mistral smoke test (one human-triggered run, under a cent)\n");

if (!key) {
  console.log("  ✗ MISTRAL_API_KEY is not set.");
  console.log("    Put the key in .env (see .env.example) and run this again.\n");
  process.exit(1);
}

// Run through tsx (`npm run ai:smoke`), which resolves the TypeScript import.
// The routing table is imported rather than copied so this script can never
// disagree with what the application would actually do.
const { MISTRAL_MODEL_BY_CLASS, MISTRAL_PRICES, estimateMicroEuros } = await import(
  "../src/lib/ai/routing.ts"
);

async function call(path, init) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(30_000),
  });
  return response;
}

// --- 1. Reachability and the key -------------------------------------------

let models;
try {
  const response = await call("/v1/models");
  if (response.status === 401) {
    console.log("  ✗ Mistral refused the key (401). Check it at https://console.mistral.ai\n");
    process.exit(1);
  }
  if (response.status === 403) {
    // A 403 here is almost never Mistral: it is a proxy or network policy
    // refusing the connection — the Claude Code development environment does
    // exactly this for domains its policy does not allow.
    console.log("  ✗ The connection was refused with 403 — by a proxy or network policy,");
    console.log("    not necessarily by Mistral. If this is the Claude Code development");
    console.log("    environment, allow api.mistral.ai in the environment's network");
    console.log("    settings, or run this from your own computer.\n");
    process.exit(1);
  }
  if (!response.ok) {
    console.log(`  ✗ Mistral answered ${response.status}. Try again in a minute.\n`);
    process.exit(1);
  }
  models = (await response.json()).data?.map((model) => model.id) ?? [];
} catch (error) {
  console.log("  ✗ api.mistral.ai could not be reached from this machine.");
  console.log("    If this is the Claude Code development environment, its network policy");
  console.log("    denies the domain — allow api.mistral.ai in the environment settings,");
  console.log("    or run this from your own computer. The application itself is unaffected:");
  console.log(`    the default provider is the simulation. (${error?.constructor?.name})\n`);
  process.exit(1);
}

console.log(`  ✓ Key accepted; ${models.length} model(s) visible`);

// --- 2. The router's models exist -------------------------------------------

let missing = 0;
for (const [taskClass, model] of Object.entries(MISTRAL_MODEL_BY_CLASS)) {
  if (models.includes(model)) {
    console.log(`  ✓ ${taskClass.padEnd(12)} → ${model}`);
  } else {
    console.log(`  ✗ ${taskClass.padEnd(12)} → ${model} — NOT in the live list; update routing.ts`);
    missing += 1;
  }
}

// --- 3. The price table, beside its date ------------------------------------

console.log(`\n  Price table (estimates), as of ${MISTRAL_PRICES.asOf} — cents per million tokens:`);
for (const [model, price] of Object.entries(MISTRAL_PRICES.perMillionTokens)) {
  console.log(`    ${model.padEnd(24)} in ${String(price.inputCents).padStart(4)}¢  out ${String(price.outputCents).padStart(4)}¢`);
}
console.log("    Compare against https://mistral.ai/pricing before relying on an estimate.");

// --- 4. One tiny call, costed ------------------------------------------------

const light = MISTRAL_MODEL_BY_CLASS.light;
try {
  const response = await call("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: light,
      max_tokens: 20,
      temperature: 0,
      messages: [{ role: "user", content: "Reply with the single word: ready" }],
    }),
  });
  if (!response.ok) {
    console.log(`\n  ✗ The test call failed (${response.status}).`);
    process.exit(1);
  }
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "(nothing)";
  const usage = {
    inputTokens: payload.usage?.prompt_tokens ?? 0,
    outputTokens: payload.usage?.completion_tokens ?? 0,
  };
  const { microEuros } = estimateMicroEuros(light, usage);
  console.log(`\n  ✓ ${light} answered: "${text}"`);
  console.log(
    `    ${usage.inputTokens} tokens in, ${usage.outputTokens} out — estimated ` +
      `${microEuros} µ€ (${(microEuros / 10_000).toFixed(4)} cents)`,
  );
} catch {
  console.log("\n  ✗ The test call could not be made.");
  process.exit(1);
}

console.log(
  missing === 0
    ? "\n  Everything the application will do live has just been done once, by you.\n"
    : `\n  ${missing} routed model(s) missing from the live list — fix routing.ts before AI_PROVIDER=mistral.\n`,
);
process.exit(missing === 0 ? 0 : 1);
