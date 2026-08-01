# CTF Writeups

Capture-the-flag and security-lab writeups — approach, dead ends, and solutions
across web exploitation, cryptography, forensics, reverse engineering and binary
exploitation.

**Live:** https://pymite6941.github.io/ctf-writeups/

---

## Adding a writeup — the whole workflow

1. Copy `TEMPLATE.md` to `posts/<slug>.md`
   *(slug = lowercase letters, numbers and hyphens only — it becomes the URL)*
2. Fill it in. Keep the frontmatter block at the top.
3. Add one entry to `posts/manifest.json`:

```json
{
  "slug": "bandit-00-09",
  "title": "OverTheWire Bandit — Levels 0–9",
  "platform": "OverTheWire",
  "category": "General Skills",
  "difficulty": "Intro",
  "date": "2026-08-05"
}
```

4. Commit and push. GitHub Pages redeploys in ~30 seconds.

That's it — no build step, no dependencies to install.

### Recognised `difficulty` values

`Intro`, `Easy`, `Medium`, `Hard` — these get colour-coded pills. Anything else
still renders, just without a colour.

### Categories

Use these consistently so the filter buttons stay tidy:
`General Skills`, `Web Exploitation`, `Cryptography`, `Forensics`,
`Reverse Engineering`, `Binary Exploitation`, `Lab`

---

## ⚠️ Previewing locally — you need a server

Opening `index.html` straight from disk **will not work**. The pages load
markdown with `fetch()`, which browsers block on `file://`.

```bash
cd ctf-writeups
python -m http.server
```

Then open <http://localhost:8000>. (Both pages detect this and tell you, so if
you forget you'll get a helpful error rather than a blank screen.)

---

## Publishing to GitHub Pages

1. Create a **public** repo named `ctf-writeups` under `PyMite6941`.
2. Push this folder to it:

```bash
cd ctf-writeups
git init
git add .
git commit -m "Set up CTF writeups site"
git branch -M main
git remote add origin https://github.com/PyMite6941/ctf-writeups.git
git push -u origin main
```

3. On GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**
4. It goes live at `https://pymite6941.github.io/ctf-writeups/`

`.nojekyll` is already included so GitHub Pages serves the files as-is.

### Linking it from your portfolio

The site is entirely self-contained, so linking to it is just an anchor —
wherever you decide it belongs:

```html
<a href="https://pymite6941.github.io/ctf-writeups/">CTF Writeups</a>
```

---

## Before you publish

- [ ] Delete `posts/format-demo.md` **and** its entry in `posts/manifest.json`
- [ ] Confirm no flags for still-live challenges are included
- [ ] Confirm no real hostnames, IPs, or credentials appear anywhere
- [ ] Check it renders at `http://localhost:8000` first

---

## Structure

```
ctf-writeups/
├── index.html              # listing page (reads manifest.json)
├── writeup.html            # renders one post via ?post=<slug>
├── TEMPLATE.md             # copy this for each new writeup
├── .nojekyll               # tells GitHub Pages to skip Jekyll
├── assets/
│   ├── css/style.css       # matched to pymite6941.is-a.dev
│   ├── img/                # screenshots
│   └── js/
│       ├── md.js           # frontmatter parsing + safe rendering
│       ├── index.js        # builds the listing
│       └── writeup.js      # renders a single post
└── posts/
    ├── manifest.json       # the index — one entry per writeup
    └── *.md                # the writeups
```

Markdown rendering uses `marked`, sanitising uses `DOMPurify`, and syntax
highlighting uses `highlight.js` — all from CDN, so there is nothing to install.

---

## Conduct

Flags for challenges that are still live are withheld. No real systems are
targeted — lab and CTF environments only. Hints and outside help are credited
where used.
