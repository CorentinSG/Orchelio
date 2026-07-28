#!/usr/bin/env bash
#
# Orchelio — session start hook.
#
# Makes a fresh checkout workable without spending conversation turns on it:
# installs dependencies, generates the Prisma client, applies migrations and
# seeds the fictional data, then prints the environment check.
#
# Everything is idempotent and cheap when already done, so this costs a second
# on a warm checkout. It never touches the database destructively — no reset,
# no drop — because the demonstration data is the only data there is.

set -uo pipefail

cd "$(dirname "$0")/../.." || exit 0

log() { printf '[orchelio] %s\n' "$1"; }

if [ ! -d node_modules ]; then
  log "installing dependencies (first run, may take a minute)"
  npm install --silent >/dev/null 2>&1 || log "npm install failed — run it by hand"
fi

if [ ! -f .env ]; then
  log "creating .env from .env.example"
  cp .env.example .env
fi

if [ ! -d src/generated/prisma ]; then
  log "generating the Prisma client"
  npx prisma generate >/dev/null 2>&1 || log "prisma generate failed"
fi

# `migrate deploy` applies pending migrations and never resets or prompts,
# which is what makes it safe to run unattended.
npx prisma migrate deploy >/dev/null 2>&1 || log "could not apply migrations"

if [ ! -s prisma/orchelio-demo.db ]; then
  log "seeding fictional demonstration data"
  npm run seed >/dev/null 2>&1 || log "seed failed — run npm run seed by hand"
fi

# A browser for the end-to-end tests, if one is already on the machine.
if [ -z "${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-}" ] && [ -x /opt/pw-browsers/chromium ]; then
  export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium
fi

node scripts/doctor.mjs 2>/dev/null || true

exit 0
