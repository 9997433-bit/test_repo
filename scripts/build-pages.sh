#!/usr/bin/env bash
# 把各游戏打进独立一级目录，供 GitHub Pages 发布。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
rm -rf "$SITE"
mkdir -p "$SITE"
cp "$ROOT/pages/index.html" "$SITE/index.html"
cp "$ROOT/pages/.nojekyll" "$SITE/.nojekyll" 2>/dev/null || printf '' > "$SITE/.nojekyll"

build_game() {
  local name="$1"
  local dir="$ROOT/games/$name"
  echo "building $name"
  (cd "$dir" && npm ci --prefer-offline --no-audit --no-fund && npm run build)
  mkdir -p "$SITE/$name"
  cp -R "$dir/dist/." "$SITE/$name/"
}

build_game linghuashi
if [ -f "$ROOT/games/zhao-yun-adou/package.json" ]; then
  build_game zhao-yun-adou
fi

echo "site tree:"
find "$SITE" -maxdepth 2 -type d | sort
