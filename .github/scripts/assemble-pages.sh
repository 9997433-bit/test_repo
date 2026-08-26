#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SITE="$ROOT/site"
rm -rf "$SITE"
mkdir -p "$SITE"

titles() {
  case "$1" in
    zaohua-xianfu) echo "造化仙府" ;;
    zhao-yun-adou) echo "赵云与阿斗" ;;
    linghuashi) echo "灵画师" ;;
    bingqi-wangzhe) echo "兵器王者" ;;
    *) echo "$1" ;;
  esac
}

links=""
for pkg in "$ROOT"/games/*/package.json; do
  [ -f "$pkg" ] || continue
  dir="$(dirname "$pkg")"
  name="$(basename "$dir")"
  if ! grep -q '"build"' "$pkg"; then
    echo "skip $name (no build script)"
    continue
  fi
  echo "building $name"
  if [ -f "$dir/package-lock.json" ]; then
    (cd "$dir" && npm ci && npm run build)
  else
    (cd "$dir" && npm install && npm run build)
  fi
  if [ ! -d "$dir/dist" ]; then
    echo "skip $name (no dist/)"
    continue
  fi
  mkdir -p "$SITE/$name"
  cp -a "$dir/dist/." "$SITE/$name/"
  title="$(titles "$name")"
  links+="      <a class=\"card\" href=\"./$name/\"><b>$title</b><span>$name</span></a>"$'\n'
done

cat > "$SITE/index.html" <<HTML
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>游戏目录</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0; min-height: 100vh; display: grid; place-items: center;
        font-family: "Noto Serif SC", "Songti SC", serif;
        background: #1b140f; color: #f3e6c9;
      }
      main { width: min(720px, 92vw); }
      h1 { font-weight: 600; letter-spacing: 0.12em; }
      p { color: #7a8b99; }
      .grid { display: grid; gap: 0.8rem; }
      .card {
        display: flex; justify-content: space-between; align-items: baseline;
        padding: 1rem 1.1rem; border: 1px solid rgba(243,230,201,0.18);
        border-radius: 10px; color: inherit; text-decoration: none;
        background: #2a2118;
      }
      .card span { color: #7a8b99; font-size: 0.85rem; }
      .card:hover { border-color: #d4a017; }
    </style>
  </head>
  <body>
    <main>
      <h1>游戏目录</h1>
      <p>每款游戏独占一级路径，互不覆盖。</p>
      <div class="grid">
$links
      </div>
    </main>
  </body>
</html>
HTML

echo "assembled $SITE"
find "$SITE" -maxdepth 2 -type d
