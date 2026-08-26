#!/usr/bin/env python3
"""Insert a catalog card for every published game directory missing from index.html.

The Pages workflow copies pages/index.html onto gh-pages. Sibling games that
were published by other branches would otherwise disappear from the catalog
even though their directories are still live. This script only adds cards; it
never deletes existing ones or game files.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

SKIP = {".git", ".nojekyll", "404.html", "index.html"}


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def title_of(game_dir: Path) -> str:
    html = text(game_dir / "index.html")
    match = re.search(r"<title>([^<]+)</title>", html, re.I)
    if not match:
        return game_dir.name
    title = re.sub(r"\s+", " ", match.group(1)).strip()
    title = re.split(r"\s*[·—|]\s*", title, maxsplit=1)[0].strip()
    return title or game_dir.name


def desc_of(game_dir: Path) -> str:
    html = text(game_dir / "index.html")
    match = re.search(
        r'(?:name="description"|property="og:description")\s+content="([^"]+)"',
        html,
        re.I,
    )
    if match:
        return match.group(1).strip()
    return f"与其他游戏并列一级目录，独占 /{game_dir.name}/。"


def card(slug: str, title: str, desc: str) -> str:
    return (
        f'        <a class="card" href="./{slug}/">\n'
        f"          <h2>{title}</h2>\n"
        f"          <p>{desc}</p>\n"
        f'          <div class="path">/test_repo/{slug}/</div>\n'
        f"        </a>\n"
    )


def game_dirs(site: Path) -> list[Path]:
    found: list[Path] = []
    for path in sorted(site.iterdir(), key=lambda p: p.name):
        if path.name in SKIP or path.name.startswith("."):
            continue
        if path.is_dir() and (path / "index.html").exists():
            found.append(path)
    return found


def sync(site: Path) -> list[str]:
    index = site / "index.html"
    html = text(index)
    existing = set(re.findall(r'href="\./([^"/]+)/"', html))
    added: list[str] = []
    extras = ""
    for game in game_dirs(site):
        if game.name in existing:
            continue
        extras += card(game.name, title_of(game), desc_of(game))
        added.append(game.name)
    if not added:
        return added
    updated, count = re.subn(r"(</div>\s*<footer>)", extras + r"      \1", html, count=1)
    if count != 1:
        raise SystemExit("sync-catalog: could not find catalog grid close before <footer>")
    index.write_text(updated, encoding="utf-8")
    return added


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: sync-catalog.py <site-dir>")
    site = Path(sys.argv[1]).resolve()
    added = sync(site)
    if added:
        print("catalog added:", ", ".join(added))
    else:
        print("catalog already lists every published game")


if __name__ == "__main__":
    main()
