#!/bin/bash
# Genera el archivo de la agenda BCN y lo publica en la rama gh-pages, que
# GitHub Pages sirve en https://meeet-bcn.github.io/meeet/bcn-concerts.json
#
# Se ejecuta desde este Mac (cada mañana con launchd: scripts/com.meeet.bcn-agenda.plist)
# porque Open Data BCN responde 403 a los servidores de GitHub Actions.
#
#   npm run feed:publish

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'git -C "$ROOT" worktree remove --force "$WORK/pages" >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

cd "$ROOT"
echo "[$(date '+%F %T')] Agenda BCN"
node --no-warnings scripts/build-bcn-agenda.mjs "$WORK/bcn-concerts.json"

# La rama gh-pages solo lleva el archivo publicado (sin historia de la app)
git fetch --quiet origin gh-pages 2>/dev/null || true
if git rev-parse --verify --quiet origin/gh-pages >/dev/null; then
  git worktree add --quiet -B gh-pages "$WORK/pages" origin/gh-pages
else
  git worktree add --quiet --detach "$WORK/pages"
  git -C "$WORK/pages" checkout --quiet --orphan gh-pages
  git -C "$WORK/pages" rm -rf --quiet . >/dev/null
fi

cp "$WORK/bcn-concerts.json" "$WORK/pages/bcn-concerts.json"
touch "$WORK/pages/.nojekyll" # que Pages sirva el JSON tal cual
cd "$WORK/pages"
git add bcn-concerts.json .nojekyll
if git diff --cached --quiet; then
  echo "Sin cambios desde la última publicación"
  exit 0
fi
git commit --quiet -m "Agenda BCN $(date '+%F')"
git push --quiet origin gh-pages
echo "✓ Publicado en https://meeet-bcn.github.io/meeet/bcn-concerts.json"
