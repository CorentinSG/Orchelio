#!/usr/bin/env node
/**
 * Orchelio — skill check.
 *
 * The skills in `.claude/skills/` are instructions an assistant loads when it
 * recognises the situation they describe. That makes them the same kind of
 * artefact as `docs/` — prose that goes stale, silently, while continuing to
 * look authoritative. This gives them the same treatment as the documentation
 * check: frontmatter present and well formed, no duplicate names, every file
 * and command they point at actually there.
 *
 * A skill naming a script that has been renamed is worse than no skill: it
 * sends a reader somewhere that does not exist and costs them the trust they
 * would otherwise have extended to the rest of it.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SKILLS = join(ROOT, ".claude", "skills");

const problems = [];
const names = new Map();
let checked = 0;
let referencesChecked = 0;

if (!existsSync(SKILLS)) {
  console.log("\nNo .claude/skills directory — nothing to check.\n");
  process.exit(0);
}

const packageScripts = new Set(
  Object.keys(JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts ?? {}),
);

for (const folder of readdirSync(SKILLS)) {
  const directory = join(SKILLS, folder);
  if (!statSync(directory).isDirectory()) continue;

  const skillFile = join(directory, "SKILL.md");
  if (!existsSync(skillFile)) {
    problems.push(`${folder}/ has no SKILL.md`);
    continue;
  }
  checked += 1;

  const source = readFileSync(skillFile, "utf8");
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!frontmatter) {
    problems.push(`${folder}/SKILL.md has no YAML frontmatter`);
    continue;
  }

  const name = field(frontmatter[1], "name");
  const description = field(frontmatter[1], "description");

  if (!name) problems.push(`${folder}/SKILL.md has no name`);
  if (!description) problems.push(`${folder}/SKILL.md has no description`);

  // The folder is how a skill is invoked, so a mismatch means the name in the
  // file describes something the user cannot ask for.
  if (name && name !== folder) {
    problems.push(`${folder}/SKILL.md is named "${name}" — it must match its folder`);
  }
  if (name && names.has(name)) {
    problems.push(`"${name}" is defined twice: ${names.get(name)} and ${folder}`);
  }
  if (name) names.set(name, folder);

  // The description is the only thing an assistant reads when deciding whether
  // a skill applies. A vague one means the skill is never loaded, which is
  // indistinguishable from not having written it.
  if (description && description.length < 80) {
    problems.push(
      `${folder}/SKILL.md description is ${description.length} characters — say what it does *and* when to use it`,
    );
  }
  if (description && !/should be used when|use when/i.test(description)) {
    problems.push(`${folder}/SKILL.md description does not say when to use the skill`);
  }

  // --- Everything the skill points at must exist -------------------------

  const body = source.slice(frontmatter[0].length);

  for (const match of body.matchAll(/`([^`\n]*\/[^`\n]*\.(?:ts|tsx|mjs|md|json|prisma))`/g)) {
    // A backticked reference is sometimes a bare path and sometimes a command
    // ("node scripts/doctor.mjs"). Take the last token, which is the path in
    // both cases.
    const target = match[1].trim().split(/\s+/).pop() ?? "";
    if (target.includes("<") || target.includes("*")) continue;
    referencesChecked += 1;

    const candidates = [join(ROOT, target), join(directory, target)];
    if (!candidates.some((candidate) => existsSync(candidate))) {
      problems.push(`${folder}/SKILL.md points at ${target}, which does not exist`);
    }
  }

  // Script names carry colons and hyphens (`skills:firm-scope`), so the class
  // has to allow both — a narrower one silently truncated and reported a
  // script that does not exist.
  for (const match of body.matchAll(/`npm run ([a-z0-9:_-]+)`|npm run ([a-z0-9:_-]+)/g)) {
    const script = match[1] ?? match[2];
    referencesChecked += 1;
    if (!packageScripts.has(script)) {
      problems.push(`${folder}/SKILL.md runs "npm run ${script}", which package.json does not define`);
    }
  }

  for (const reference of readdirSync(directory)) {
    if (reference !== "references" && reference !== "scripts") continue;
    for (const file of readdirSync(join(directory, reference))) {
      const relative = `${reference}/${file}`;
      // A bundled file nothing points at is either dead or a broken link
      // somewhere — both worth knowing about.
      if (!body.includes(relative) && !body.includes(file)) {
        problems.push(`${folder}/${relative} is not referenced from SKILL.md`);
      }
    }
  }
}

// --- Scripts must run ------------------------------------------------------

for (const [name, folder] of names) {
  const scripts = join(SKILLS, folder, "scripts");
  if (!existsSync(scripts)) continue;
  for (const file of readdirSync(scripts)) {
    if (!file.endsWith(".mjs")) continue;
    try {
      execFileSync("node", ["--check", join(scripts, file)], { stdio: "pipe" });
    } catch {
      problems.push(`${name}: scripts/${file} is not valid JavaScript`);
    }
  }
}

console.log("");
if (problems.length === 0) {
  console.log(
    `Skills OK — ${checked} skill(s), ${referencesChecked} reference(s) resolved, no duplicates.\n`,
  );
  process.exit(0);
}

for (const problem of problems) console.log(`  ✗ ${problem}`);
console.log(`\n${problems.length} problem(s) in .claude/skills.\n`);
process.exit(1);

/** Reads one scalar from YAML frontmatter. Handles a folded multi-line value. */
function field(frontmatter, key) {
  const match = new RegExp(`^${key}:\\s*(.*(?:\\n\\s+.*)*)$`, "m").exec(frontmatter);
  return match ? match[1].split("\n").map((line) => line.trim()).join(" ").trim() : null;
}
