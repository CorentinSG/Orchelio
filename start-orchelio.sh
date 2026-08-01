#!/usr/bin/env bash
# ============================================================================
#  Orchelio — macOS / Linux launcher
#
#  ./start-orchelio.sh
#
#  Installs what is needed, creates the database, loads the fictional data and
#  opens http://localhost:3000. All the logic lives in scripts/setup-local.mjs;
#  this file only checks Node.js, moves to the right folder and calls it.
# ============================================================================

set -euo pipefail

cd "$(dirname "$0")"

echo
echo "  Orchelio — installation et démarrage"
echo "  ------------------------------------"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js n'est pas installé sur cette machine."
  echo "  Node.js is not installed on this machine."
  echo
  echo "  Téléchargez la version LTS sur https://nodejs.org, installez-la,"
  echo "  ouvrez un nouveau terminal, puis relancez ce script."
  echo
  exit 1
fi

exec node scripts/setup-local.mjs "$@"
