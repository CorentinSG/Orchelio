#!/usr/bin/env node
/**
 * Orchelio — one command that turns a fresh checkout into a running demo.
 *
 * The README lists five steps and every one of them is easy. The failure this
 * script exists for is not difficulty, it is silence: a step skipped, or run in
 * the wrong order, produces an application that starts and then behaves as if
 * the data were missing — which it is. Doing them in one place makes the order
 * a property of the code rather than of the reader's attention.
 *
 * Every step is idempotent and additive. Nothing here deletes anything: `.env`
 * is written only when absent, `prisma migrate deploy` applies the migrations
 * that are missing and asks nothing, and the seed upserts. Running it twice is
 * the same as running it once. Erasing remains `npm run reset-demo`, typed by a
 * person — see ADR-0016.
 *
 *   node scripts/setup-local.mjs              install, migrate, seed, then start
 *   node scripts/setup-local.mjs --no-start   the same, without starting the server
 *   node scripts/setup-local.mjs --help
 *
 * `npm run setup` is the short way in. The two launchers at the repository root
 * (`start-orchelio.bat`, `start-orchelio.sh`) are thin wrappers over this file
 * for someone who would rather double-click than open a terminal.
 */

import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(
    [
      "Orchelio — local setup",
      "",
      "  node scripts/setup-local.mjs             install, migrate, seed, start the server",
      "  node scripts/setup-local.mjs --no-start  prepare everything, do not start",
      "",
      "Safe to re-run: nothing is deleted, the seed updates records rather than",
      "replacing them. To erase the database, run `npm run reset-demo` yourself.",
    ].join("\n"),
  );
  process.exit(0);
}

const START_SERVER = !args.has("--no-start");

// npm is `npm.cmd` on Windows, and spawn() there needs a shell to find either.
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";
const SHELL = process.platform === "win32";

let step = 0;
const TOTAL = START_SERVER ? 6 : 5;

function heading(title) {
  step += 1;
  console.log(`\n[${step}/${TOTAL}] ${title}`);
}

function fail(problem, remedy) {
  console.error(`\n  ✗ ${problem}`);
  console.error(`    ${remedy}\n`);
  process.exit(1);
}

/** Runs a command to completion, inheriting the terminal so output streams. */
function run(command, commandArgs, { failure }) {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: "inherit",
    shell: SHELL,
  });

  if (result.error?.code === "ENOENT") {
    fail(`\`${command}\` was not found on this machine.`, failure);
  }
  if (result.status !== 0) {
    fail(`\`${command} ${commandArgs.join(" ")}\` failed.`, failure);
  }
}

// --- 1. Node ---------------------------------------------------------------
//
// Checked rather than assumed: package.json declares `engines`, but npm only
// warns about it by default, so a too-old Node reaches the first real step and
// fails there with a syntax error instead of a sentence.

heading("Checking Node.js");

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  fail(
    `Node.js v${process.versions.node} is too old — Orchelio needs 20.9 or later.`,
    "Install the LTS version from https://nodejs.org, then reopen your terminal.",
  );
}
console.log(`  ✓ Node.js v${process.versions.node}`);

// --- 2. Environment file ---------------------------------------------------
//
// Copied, never overwritten: a `.env` already on disk may hold a local model's
// address or a provider the reader chose deliberately.

heading("Preparing the configuration file");

const envFile = join(ROOT, ".env");
const envExample = join(ROOT, ".env.example");

if (existsSync(envFile)) {
  const env = readFileSync(envFile, "utf8");
  const missing = ["DATABASE_URL", "AI_PROVIDER"].filter((key) => !env.includes(`${key}=`));
  if (missing.length > 0) {
    console.log(`  ! .env exists but does not set ${missing.join(", ")} — compare it with .env.example`);
  } else {
    console.log("  ✓ .env already exists, left untouched");
  }
} else if (existsSync(envExample)) {
  copyFileSync(envExample, envFile);
  console.log("  ✓ .env created from .env.example — the defaults are correct for the demonstration");
} else {
  fail(".env.example is missing.", "This checkout is incomplete — clone the repository again.");
}

// --- 3. Dependencies -------------------------------------------------------
//
// Run every time rather than only when node_modules is absent: the lockfile
// changes, and a checkout whose dependencies are one commit behind fails in
// ways that read as application bugs. It is quick when there is nothing to do.

heading("Installing the dependencies (one to three minutes the first time)");

run(NPM, ["install"], {
  failure:
    "Check that this machine can reach the network, then run `npm install` again. " +
    "Behind a corporate proxy, npm needs `npm config set proxy <address>`.",
});

// --- 4. Database -----------------------------------------------------------
//
// `migrate deploy`, not `migrate dev`: deploy applies the committed migrations
// and asks nothing, which is what an unattended script needs. `migrate dev` may
// prompt, and may offer to reset the database — a question nobody double-
// clicking a launcher should ever be asked.

heading("Creating the database");

run(NPM, ["exec", "--", "prisma", "migrate", "deploy"], {
  failure: "Run `npx prisma migrate deploy` to see the full error.",
});

// --- 5. Demonstration data -------------------------------------------------

heading("Loading the fictional demonstration data");

run(NPM, ["run", "seed"], {
  failure: "Run `npm run seed` to see the full error.",
});

// --- 6. The server ---------------------------------------------------------

if (!START_SERVER) {
  console.log("\nReady. Start the application with `npm run dev`, then open http://localhost:3000\n");
  process.exit(0);
}

heading("Starting the application");
console.log("  Press Ctrl+C to stop it.\n");

const server = spawn(NPM, ["run", "dev"], { cwd: ROOT, shell: SHELL });

let opened = false;

/**
 * Opens the browser once Next.js says it is listening, and not before: opening
 * on a timer shows a connection error about half the time on a cold start,
 * which reads as a broken application rather than as an impatient script.
 */
function openBrowserWhenReady(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);

  if (opened || !/Ready in|localhost:3000/.test(text)) return;
  opened = true;

  const [command, commandArgs] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", "http://localhost:3000"]]
      : process.platform === "darwin"
        ? ["open", ["http://localhost:3000"]]
        : ["xdg-open", ["http://localhost:3000"]];

  // A machine with no desktop session has nothing to open. That is not an
  // error: the address is printed above, and the server is running.
  const opening = spawn(command, commandArgs, { stdio: "ignore", detached: true });
  opening.on("error", () => {
    console.log("\n  Could not open a browser here. Go to http://localhost:3000 yourself.\n");
  });
  opening.unref();
}

server.stdout.on("data", openBrowserWhenReady);
server.stderr.on("data", (chunk) => process.stderr.write(chunk));
server.on("exit", (code) => process.exit(code ?? 0));
