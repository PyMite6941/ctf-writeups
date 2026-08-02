# CTF Writeups

Capture-the-flag and security-lab writeups — approach, dead ends, and solutions
across web exploitation, cryptography, forensics, reverse engineering and binary
exploitation.

**Live:** https://pymite6941.github.io/ctf-writeups/

---

## Adding a writeup — the whole workflow

1. Copy `TEMPLATE.md` to `posts/<slug>.md`
   *(slug = lowercase letters, numbers and hyphens only — it becomes the URL)*
2. Fill it in, keeping the frontmatter block at the top.
3. Add the **slug** to `posts/manifest.json`:

```json
["bandit-00-05"]
```

4. Commit and push. GitHub Pages redeploys in ~30 seconds.

That's it — no build step, no dependencies to install.

### The markdown file is the single source of truth

`manifest.json` holds **only slugs**. Every displayed value — title, platform,
category, difficulty, date — is read from that file's own frontmatter at page
load, and the counts on the index page are derived from what actually loaded.

So there is nothing to keep in sync: edit the frontmatter and the listing,
filters and counts all follow. A static host can't enumerate a directory, which
is the only reason the slug list exists.

A slug listed with no matching `.md` is skipped with a console warning rather
than breaking the page.

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

- [ ] Confirm no flags for still-live challenges are included
- [ ] Confirm no real hostnames, IPs, or credentials appear anywhere
- [ ] Check it renders at `http://localhost:8000` first

## Local-only files

`TEMPLATE.md` and `posts/format-demo.md` are gitignored. They stay on your disk
as scaffolding but are never published.

To preview the format demo locally, temporarily put its slug in
`posts/manifest.json` — just don't commit that line:

```json
["format-demo"]
```

---

## Structure

```
ctf-writeups/
├── index.html              # listing page (reads manifest.json)
├── writeup.html            # renders one post via ?post=<slug>
├── TEMPLATE.md             # copy this per writeup — gitignored, local only
├── .nojekyll               # tells GitHub Pages to skip Jekyll
├── assets/
│   ├── css/style.css       # matched to pymite6941.is-a.dev
│   ├── img/                # screenshots
│   └── js/
│       ├── md.js           # frontmatter parsing + safe rendering
│       ├── index.js        # builds the listing
│       └── writeup.js      # renders a single post
└── posts/
    ├── manifest.json       # list of slugs only — metadata lives in the .md
    └── *.md                # the writeups (frontmatter = source of truth)
```

Markdown rendering uses `marked`, sanitising uses `DOMPurify`, and syntax
highlighting uses `highlight.js` — all from CDN, so there is nothing to install.

---

## Conduct

Flags for challenges that are still live are withheld. No real systems are
targeted — lab and CTF environments only. Hints and outside help are credited
where used.
