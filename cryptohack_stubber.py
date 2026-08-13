"""Auto-generate CryptoHack writeup stubs.

Pulls the full challenge catalog straight from cryptohack.org (the category
pages are server-rendered, so no login or JS needed) and emits one ready-to-fill
markdown file per challenge. No hand-typing of titles, categories, links, or
descriptions.

Usage:
    python cryptohack_stubber.py fetch          # refresh catalog cache
    python cryptohack_stubber.py stubs [CATEGORY]   # generate stub files
    python cryptohack_stubber.py check          # show which stubs are filled in

The tool marks each challenge as UNSOLVED by default. Once you solve one, drop
its stub file in the folder with your script (or flip status: solved in the
front matter) and the description/hints stay attached.

Output: writeups/cryptohack/<category>/<slug>.md
"""

from __future__ import annotations

import argparse
import html as html_mod
import json
import os
import re
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

BASE = "https://cryptohack.org/challenges/{slug}/"
HERE = Path(__file__).resolve().parent
CACHE = HERE / "cryptohack_catalog.json"
OUT = HERE / "writeups" / "cryptohack"

# Make the console ASCII-safe even when the path contains non-Latin chars.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# slug -> display category (must match the site's real URLs)
CATEGORIES = [
    ("general", "general"),
    ("aes", "symmetric-ciphers"),
    ("maths", "mathematics"),
    ("rsa", "rsa"),
    ("diffie-hellman", "diffie-hellman"),
    ("ecc", "elliptic-curves"),
    ("hashes", "hash-functions"),
    ("web", "crypto-on-the-web"),
    ("post-quantum", "lattices"),
    ("isogenies", "isogenies"),
    ("zkp", "zero-knowledge-proofs"),
    ("misc", "miscellaneous"),
    ("ctf-archive", "ctf-archive"),
]


@dataclass
class Challenge:
    cat: str
    slug: str
    url_slug: str
    name: str
    points: int
    description: str
    files: list[str]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")


def unescape(s: str) -> str:
    return html_mod.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def parse_category(slug: str, display: str) -> list[Challenge]:
    raw = fetch(BASE.format(slug=slug))
    out: list[Challenge] = []
    for m in re.finditer(r'<li class="challenge"[^>]*data-stage="[^"]*">', raw):
        block = raw[m.start():]
        # each challenge block ends at the next challenge li or the stage's </ul>
        end = block.find("<li class=\"challenge\"", 1)
        if end == -1:
            end = block.find("</ul>")
        chunk = block[:end]

        slug_m = re.search(r'data-challenge="([^"]+)"', chunk)
        if not slug_m:
            continue
        chal_slug = slug_m.group(1)

        pt_m = re.search(r"(\d+)\s*pts", chunk)
        points = int(pt_m.group(1)) if pt_m else 0

        text_m = re.search(r'<div class="challenge-text truncate">(.*?)</div>', chunk, re.S)
        if text_m:
            name = unescape(text_m.group(1))

        desc_m = re.search(
            r'<div class="challengeDescription">(.*?)</div>\s*<!--', chunk, re.S
        )
        if not desc_m:
            desc_m = re.search(r'<div class="challengeDescription">(.*?)</div>', chunk, re.S)
        raw_desc = desc_m.group(1) if desc_m else ""
        raw_desc = re.sub(r"<!--.*?-->", "", raw_desc, flags=re.S)
        description = unescape(raw_desc)

        files = re.findall(
            r'/static/challenges/[^"]+"[^>]*>([^<]+)</a>', chunk
        )

        out.append(
            Challenge(cat=display, slug=chal_slug, url_slug=slug, name=name, points=points,
                      description=description, files=files)
        )
    return out


def load_catalog() -> dict[str, list[Challenge]]:
    if not CACHE.exists():
        print("[!] no catalog cache. Run `python cryptohack_stubber.py fetch` first.")
        sys.exit(1)
    data = json.loads(CACHE.read_text(encoding="utf-8"))
    return {cat: [Challenge(**c) for c in chals] for cat, chals in data.items()}


def save_catalog(catalog: dict[str, list[Challenge]]) -> None:
    data = {cat: [c.__dict__ for c in chals] for cat, chals in catalog.items()}
    CACHE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "challenge"


def write_stub(c: Challenge) -> Path:
    d = OUT / c.cat
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"{slugify(c.name)}.md"
    if p.exists():
        return p
    files = "".join(f"- `{f}`\n" for f in c.files) or "- (none)"
    p.write_text(
        f"""# {c.name}

- **Category:** {c.cat}
- **Points:** {c.points}
- **Link:** https://cryptohack.org/challenges/{c.url_slug}/#{c.slug}
- **Status:** unsolved
- **Solved date:** _YYYY-MM-DD_

## Description

{c.description}

## Approach

_How did I attack this? What did I try first, what worked, what failed before it clicked?_
_Tips: encode/decode first, look for the weakest link, re-read the theory before brute force._

## Solution

```python
# my solve script goes here
```

## Key takeaway

_One sentence: what technique/skill does this challenge teach, and where else does it apply?_
""",
        encoding="utf-8",
    )
    return p


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("cmd", choices=["fetch", "stubs", "check", "solve"])
    ap.add_argument("category", nargs="?", help="limit to one category")
    ap.add_argument("name", nargs="?", help="challenge name (for `solve`)")
    args = ap.parse_args()

    if args.cmd == "fetch":
        items = [("general", args.category)] if args.category else CATEGORIES
        catalog = {}
        for slug, cat in items:
            try:
                catalog[cat] = parse_category(slug, cat)
                print(f"[+] {slug}: {len(catalog[cat])} challenges")
            except Exception as e:
                print(f"[!] {slug}: {e}")
        save_catalog(catalog)
        print("[+] catalog saved with", sum(len(v) for v in catalog.values()), "challenges")
        return

    catalog = load_catalog()
    if args.cmd == "stubs":
        cats = [args.category] if args.category else [c[1] for c in CATEGORIES]
        total = 0
        for cat in cats:
            for c in catalog.get(cat, []):
                write_stub(c)
                total += 1
        print(f"[+] {total} stubs ready: {OUT}")

    elif args.cmd == "solve":
        if not args.category or not args.name:
            print("usage: python cryptohack_stubber.py solve <category> <name>")
            sys.exit(1)
        d = OUT / args.category
        if not d.exists():
            print(f"[!] no stubs for category: {args.category}")
            sys.exit(1)
        for f in d.glob("*.md"):
            if slugify(args.name) == f.stem or args.name.lower() in f.stem:
                txt = f.read_text(encoding="utf-8")
                if f"**Status:** solved" not in txt:
                    import datetime
                    txt = txt.replace("**Status:** unsolved",
                                      f"**Status:** solved\n- **Solved date:** {datetime.date.today().isoformat()}")
                    f.write_text(txt, encoding="utf-8")
                    print(f"[+] marked solved: {f.name}")
                else:
                    print(f"[=] already solved: {f.name}")
                return
        print(f"[!] no stub found for '{args.name}' in {args.category}")

    elif args.cmd == "check":
        cats = [args.category] if args.category else [c[1] for c in CATEGORIES]
        todo, done = 0, 0
        for cat in cats:
            d = OUT / cat
            if not d.exists():
                continue
            for f in sorted(d.glob("*.md")):
                txt = f.read_text(encoding="utf-8")
                if "**Status:** solved" in txt:
                    done += 1
                else:
                    todo += 1
        print(f"[=] solved: {done}  unsolved: {todo}")


if __name__ == "__main__":
    main()
