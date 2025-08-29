#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Read version from manifest.json (prefer jq/python/node; fallback to grep)
if command -v jq >/dev/null 2>&1; then
  VERSION=$(jq -r .version manifest.json)
else
  VERSION=$(python3 -c 'import json;print(json.load(open("manifest.json"))[["version"]) )' 2>/dev/null || true)
  if [[ -z "${VERSION:-}" ]]; then
    VERSION=$(node -e 'console.log(require("./manifest.json").version)' 2>/dev/null || true)
  fi
  if [[ -z "${VERSION:-}" ]]; then
    VERSION=$(grep -o '"version"\s*:\s*"[^"]\+"' manifest.json | sed -E 's/.*"version"\s*:\s*"([^"]+)"/\1/')
  fi
fi
if [[ -z "$VERSION" ]]; then
  echo "Could not parse version from manifest.json" >&2
  exit 1
fi

DIST_DIR="$ROOT_DIR/dist"
ARTIFACT="persistent-pinned-tabs-v${VERSION}.zip"

mkdir -p "$DIST_DIR"

# Files/directories to include
INCLUDE=(
  manifest.json
  background.js
  content.js
  spa_overrides.js
  spa_main_world.js
  utils
  icons
  README.md
)

# Ensure optional dirs exist conditionally
PKG_TMP="$(mktemp -d)"
trap 'rm -rf "$PKG_TMP"' EXIT

for item in "${INCLUDE[@]}"; do
  if [[ -e "$item" ]]; then
    rsync -a --exclude ".DS_Store" "$item" "$PKG_TMP/"
  fi
done

# Create the zip from the temp staging dir
cd "$PKG_TMP"
zip -r -9 "$DIST_DIR/$ARTIFACT" . -x "*.DS_Store" >/dev/null

cd "$ROOT_DIR"
echo "Built: $DIST_DIR/$ARTIFACT"
