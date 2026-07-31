#!/usr/bin/env node
/**
 * Orchelio — confidentiality check.
 *
 * A firm should not have to take "your data does not go anywhere" on trust.
 * This turns three of the promises in `src/lib/confidentiality/classification.ts`
 * into properties of the source that fail the build when they stop being true.
 *
 *   1. Every model in the schema is classified. A new model that nobody
 *      classified is a new place for client data to live under no rule at all.
 *
 *   2. The one module allowed to read across firms — src/lib/data/platform.ts —
 *      names no client-confidential or privileged model. "A platform
 *      administrator cannot read a firm's matters" stops being a property of
 *      the screens and becomes a property of the queries.
 *
 *   3. Nothing in src/ can make an outbound request. Orchelio sends nothing
 *      today; this is what keeps that true when somebody adds a feature that
 *      would like to.
 *
 *   4. Nothing in src/ writes a file. A document is a name, a type and a size;
 *      the moment bytes are stored, encryption at rest stops being a plan and
 *      becomes a requirement.
 *
 * What it does not prove, stated because the rest of this file is a list of
 * things it does prove: it reads the source, not the running process. A
 * dependency can still open a socket. That needs a network policy at the host,
 * and it is recorded as such in docs/PRODUCTION_READINESS.md.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/**
 * Modules permitted to open a socket, and on what terms.
 *
 * Empty, and that is the point: Orchelio has no transport. An entry here is a
 * decision to send something somewhere, which is exactly the kind of change
 * that should be argued for in a review rather than noticed afterwards.
 *
 * The day a real Anthropic provider lands, `src/lib/ai/anthropic-provider.ts`
 * belongs here with a sentence saying what it sends and under what agreement.
 *
 * An entry may instead be marked `loopbackOnly`, for a module that talks to
 * something on the firm's own machine — a model running locally. That is a
 * different promise from "we send this to a third party under an agreement",
 * and it is only worth making if it is enforced, so an entry marked that way
 * is **checked**: the module must obtain its address through `assertLoopback`
 * (`src/lib/ai/loopback.ts`), which cannot return anything but 127.0.0.0/8 or
 * ::1, and must contain no address literal of its own. Without both, the
 * allowance is void and the build fails — an allow-list widened on trust is a
 * hole with a comment beside it.
 *
 *   "src/lib/ai/local-provider.ts": {
 *     loopbackOnly: true,
 *     reason: "Sends the matter to a model running on this machine.",
 *   },
 */
const EGRESS_ALLOWED = {
  "src/lib/ai/local-provider.ts": {
    loopbackOnly: true,
    reason:
      "Asks a model on the firm's own machine to reword a summary Orchelio has already derived. " +
      "It opens one socket, to an address assertLoopback produced, and sends no document — " +
      "Orchelio holds none to send.",
  },
};

/** The one function that may produce an address for a `loopbackOnly` module. */
const LOOPBACK_GUARD = "assertLoopback";

/** Any absolute http(s) address written into source, so it can be judged. */
const URL_LITERAL = /https?:\/\/[^"'`\s)]+/g;

/** Ways a module can start an outbound request. */
const EGRESS_PATTERNS = [
  "\\bfetch\\s*\\(",
  "\\bXMLHttpRequest\\b",
  "new\\s+WebSocket\\b",
  "\\bhttps?\\.(request|get)\\s*\\(",
  "from\\s+[\"'](node:)?(http|https|net|dgram|tls)[\"']",
  "require\\s*\\(\\s*[\"'](node:)?(http|https|net|dgram|tls)[\"']",
  "from\\s+[\"'](axios|node-fetch|undici|got|superagent)[\"']",
];

const problems = [];
const notes = [];

// --- 1. Every model is classified -----------------------------------------

const schema = readFileSync(join(ROOT, "prisma", "schema.prisma"), "utf8");
const modelsInSchema = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);

// Read from the schema rather than from a hand-kept list: a list that has to be
// updated by hand is a list that will disagree with the schema exactly once,
// silently, on the day it matters.
const classification = readFileSync(
  join(ROOT, "src", "lib", "confidentiality", "classification.ts"),
  "utf8",
);
const classifiedBlock = classification.slice(
  classification.indexOf("export const MODEL_CLASSIFICATION"),
  classification.indexOf("export function classify"),
);
const classified = new Map(
  [...classifiedBlock.matchAll(/^\s{2}(\w+):\s*"(\w+)",$/gm)].map((match) => [match[1], match[2]]),
);

for (const model of modelsInSchema) {
  if (!classified.has(model)) {
    problems.push(
      `${model} is in prisma/schema.prisma but has no confidentiality class. ` +
        "Add it to MODEL_CLASSIFICATION — deciding is the point.",
    );
  }
}
for (const model of classified.keys()) {
  if (!modelsInSchema.includes(model)) {
    problems.push(`${model} is classified but no longer exists in the schema — remove it.`);
  }
}

// --- 2. The cross-tenant module touches no client material -----------------

const CLIENT_MATERIAL = new Set(
  [...classified.entries()]
    .filter(([, key]) => key === "client_confidential" || key === "privileged")
    .map(([model]) => model),
);

const PLATFORM_MODULE = "src/lib/data/platform.ts";

// Comments are stripped first. The module explains *why* it does not call
// `prisma.matter.count()`, and a check that tripped on the explanation would
// teach people to delete the explanation — the opposite of what is wanted.
const platformSource = stripComments(readFileSync(join(ROOT, PLATFORM_MODULE), "utf8"));

// Prisma's client lowercases the first letter, and uppercases an acronym
// prefix: AIAnalysis becomes aIAnalysis. Both spellings are checked so a
// rename cannot slip past on capitalisation.
for (const model of CLIENT_MATERIAL) {
  const camel = model.charAt(0).toLowerCase() + model.slice(1);
  const pattern = new RegExp(`prisma\\.(${model}|${camel})\\b`);
  if (pattern.test(platformSource)) {
    problems.push(
      `${PLATFORM_MODULE} queries ${model}, which is ${classified.get(model)}. ` +
        "The one module allowed to read across firms may not read client material.",
    );
  }
}

// A relation include reaches the same rows by another route. Counting them is
// allowed — a total is not content — so the `_count` aggregates are removed
// and the relation names are looked for in what is left.
const withoutCounts = platformSource.replace(/_count\s*:\s*\{[\s\S]*?\n\s*\},/g, "");
for (const relation of [
  "matters",
  "documents",
  "analyses",
  "approvalRequests",
  "auditEvents",
  "clientProfiles",
  "tasks",
  "draftCommunications",
]) {
  if (new RegExp(`\\b${relation}\\s*:\\s*(true|\\{)`).test(withoutCounts)) {
    problems.push(
      `${PLATFORM_MODULE} includes the ${relation} relation outside a _count aggregate — ` +
        "that returns rows, not a total.",
    );
  }
}

// --- 3. Nothing reaches the network ----------------------------------------

// `git grep` narrows the candidates cheaply; each one is then re-tested with
// its comments removed, for the same reason as above — a comment saying "we
// deliberately never call fetch()" must not be what fails the build.
const egressPattern = new RegExp(EGRESS_PATTERNS.join("|"));
const egressUsers = grep(EGRESS_PATTERNS.join("|"), ["src"])
  .filter((path) => !path.startsWith("src/generated/"))
  .filter((path) => egressPattern.test(stripComments(readFileSync(join(ROOT, path), "utf8"))));

for (const path of egressUsers) {
  if (!(path in EGRESS_ALLOWED)) {
    problems.push(
      `${path} can make an outbound request. Orchelio sends nothing: if this is ` +
        "deliberate, add it to EGRESS_ALLOWED in this script with what it sends and to whom.",
    );
  }
}
for (const [path, terms] of Object.entries(EGRESS_ALLOWED)) {
  if (!egressUsers.includes(path)) {
    notes.push(`${path} no longer reaches the network — remove its exception`);
    continue;
  }
  if (!terms?.loopbackOnly) continue;

  // The allowance says the module only ever talks to this machine. Two things
  // have to be true for that to be a fact rather than an intention.
  const source = stripComments(readFileSync(join(ROOT, path), "utf8"));

  if (!source.includes(`${LOOPBACK_GUARD}(`)) {
    problems.push(
      `${path} is allowed to reach the network only on the promise that it talks to this ` +
        `machine, but it never calls ${LOOPBACK_GUARD}(). Without it there is nothing ` +
        "stopping the address being anywhere at all.",
    );
  }

  // A literal address is one the guard never sees. Even a loopback one is a
  // second way to reach the network, and the next edit to it would not be
  // checked by anything.
  for (const literal of source.match(URL_LITERAL) ?? []) {
    problems.push(
      `${path} writes the address ${literal} into its source. A module that may only ` +
        `talk to this machine takes its address from ${LOOPBACK_GUARD}() and nowhere else.`,
    );
  }
}

// --- 4. Nothing writes a file ----------------------------------------------
//
// "No document is ever opened, and no file is stored" was an unfalsifiable
// claim until this existed: it asserted an absence and pointed at nothing a
// reader could open. Now the absence is checked.

const STORAGE_PATTERNS = [
  "from\\s+[\"'](node:)?fs(/promises)?[\"']",
  "require\\s*\\(\\s*[\"'](node:)?fs(/promises)?[\"']",
  "\\bwriteFileSync?\\s*\\(",
  "\\bcreateWriteStream\\s*\\(",
  "\\bappendFileSync?\\s*\\(",
];

const storagePattern = new RegExp(STORAGE_PATTERNS.join("|"));
const storageUsers = grep(STORAGE_PATTERNS.join("|"), ["src"])
  .filter((path) => !path.startsWith("src/generated/"))
  .filter((path) => storagePattern.test(stripComments(readFileSync(join(ROOT, path), "utf8"))));

for (const path of storageUsers) {
  problems.push(
    `${path} writes to the filesystem. Orchelio stores no file content: a ` +
      "document is a name, a type and a size. Storing bytes is the change that " +
      "makes encryption at rest a requirement rather than a plan — see ADR-0018.",
  );
}

// ---------------------------------------------------------------------------

const counts = [...classified.values()].reduce((tally, key) => {
  tally[key] = (tally[key] ?? 0) + 1;
  return tally;
}, /** @type {Record<string, number>} */ ({}));

console.log("\nOrchelio — confidentiality check\n");

// The egress line has to name what is allowed. "Nothing can make an outbound
// request" printed beside a module that can is the exact reassurance this whole
// script exists to refuse.
const loopbackOnly = Object.entries(EGRESS_ALLOWED).filter(([, terms]) => terms?.loopbackOnly);
const elsewhere = Object.keys(EGRESS_ALLOWED).length - loopbackOnly.length;

if (problems.length === 0) {
  console.log(`  ✓ All ${modelsInSchema.length} models classified`);
  console.log(`  ✓ ${PLATFORM_MODULE} reads no client-confidential or privileged model`);
  if (elsewhere > 0) {
    console.log(`  ✓ ${elsewhere} module(s) may reach a third party; each is listed with what it sends`);
  } else if (loopbackOnly.length > 0) {
    console.log(
      `  ✓ Nothing in src/ can reach anywhere but this machine — ` +
        `${loopbackOnly.length} module(s) may talk to 127.0.0.1, each checked against ${LOOPBACK_GUARD}()`,
    );
  } else {
    console.log(`  ✓ Nothing in src/ can make an outbound request`);
  }
  console.log(`  ✓ Nothing in src/ writes a file`);
} else {
  for (const problem of problems) console.log(`  ✗ ${problem}\n`);
}

for (const note of notes) console.log(`  ! ${note}`);

console.log(
  "\n  " +
    Object.entries(counts)
      .sort()
      .map(([key, count]) => `${count} ${key}`)
      .join(", "),
);
console.log(
  "\n  Source-level checks. They do not prove what a running process does, and\n" +
    "  nothing here is encrypted at rest — see docs/decisions/ADR-0018.\n",
);

process.exit(problems.length === 0 ? 0 : 1);

// ---------------------------------------------------------------------------

/**
 * Removes comments, leaving string and template literals intact.
 *
 * A regex cannot do this: `"https://example"` contains `//`, and a comment can
 * contain a quote. So it walks the source once, tracking whether it is inside a
 * string, a template, or a comment. Replaced with spaces rather than deleted,
 * so a reported position still lines up with the file.
 */
function stripComments(source) {
  let out = "";
  let state = "code";
  let quote = "";

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "code") {
      if (char === "/" && next === "/") {
        state = "line";
        out += "  ";
        index += 1;
      } else if (char === "/" && next === "*") {
        state = "block";
        out += "  ";
        index += 1;
      } else if (char === '"' || char === "'" || char === "`") {
        state = "string";
        quote = char;
        out += char;
      } else {
        out += char;
      }
    } else if (state === "line") {
      if (char === "\n") {
        state = "code";
        out += "\n";
      } else {
        out += " ";
      }
    } else if (state === "block") {
      if (char === "*" && next === "/") {
        state = "code";
        out += "  ";
        index += 1;
      } else {
        out += char === "\n" ? "\n" : " ";
      }
    } else {
      // Inside a string. A backslash escapes whatever follows it.
      out += char;
      if (char === "\\") {
        out += source[index + 1] ?? "";
        index += 1;
      } else if (char === quote) {
        state = "code";
      }
    }
  }

  return out;
}

function grep(pattern, paths) {
  try {
    // --untracked deliberately: a file written but not yet staged is exactly
    // when this check is worth running.
    return execFileSync("git", ["grep", "-l", "--untracked", "-E", pattern, "--", ...paths], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}
