"""Fetch the picoGym practice catalog.

picoCTF's own API is login + Cloudflare-gated, so we pull the public
picoGym challenge list from the `tsids/picoCTF-Writeups` repo, whose README
tables name every practice challenge with its real challenge id and category.

Output: picoctf_catalog.json  (list of {name, category, id, url})
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = Path(__file__).resolve().parent
OUT = HERE / "picoctf_catalog.json"
SRC_README = "https://raw.githubusercontent.com/tsids/picoCTF-Writeups/main/README.md"
SRC_TREE = "https://api.github.com/repos/tsids/picoCTF-Writeups/git/trees/main?recursive=1"

CATEGORIES = {
    "General Skills", "Cryptography", "Web Exploitation",
    "Forensics", "Reverse Engineering", "Binary Exploitation",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "opencode"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")


def name_to_category() -> dict[str, str]:
    """Map challenge-name -> category from the repo's directory structure."""
    tree = json.loads(fetch(SRC_TREE))
    mapping: dict[str, str] = {}
    for entry in tree.get("tree", []):
        if entry["type"] != "blob":
            continue
        parts = entry["path"].split("/")
        if len(parts) >= 2 and parts[0] in CATEGORIES:
            name = parts[1].rsplit(".md", 1)[0].replace("-", " ").strip()
            mapping.setdefault(name, parts[0])
    return mapping


def parse(text: str, name_to_cat: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    for line in text.splitlines():
        m = re.search(
            r"\[([^\]]+)\]\([^)]*\)\s*\|\s*\[[^\]]*\]"
            r"\((https://play\.picoctf\.org/practice/challenge/(\d+))\)[^|]*\|"
            r"\s*([^|]+)\|",  # difficulty column
            line,
        )
        if not m:
            continue
        name = m.group(1).strip()
        url = m.group(2)
        cid = int(m.group(3))
        pts = _points_from(line)
        out.append(
            {
                "name": name,
                "category": name_to_cat.get(name, "General Skills"),
                "id": cid,
                "url": url,
                "points": pts,
            }
        )
    seen: set[int] = set()
    unique = []
    for c in out:
        if c["id"] in seen:
            continue
        seen.add(c["id"])
        unique.append(c)
    return unique


def _points_from(line: str) -> int:
    """Points are the final integer cell of the README table row."""
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    for cell in reversed(cells):
        if cell.isdigit():
            return int(cell)
    return 0


def main() -> None:
    raw = fetch(SRC_README)
    cats = parse(raw, name_to_category())
    OUT.write_text(json.dumps(cats, indent=2), encoding="utf-8")
    from collections import Counter
    print(f"[+] {len(cats)} picoGym challenges -> {OUT}")
    for cat, n in sorted(Counter(c["category"] for c in cats).items()):
        print(f"    {cat}: {n}")


if __name__ == "__main__":
    main()
