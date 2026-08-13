# ctf-writeups

My CTF workbench, published at **https://pymite6941.github.io/ctf-writeups/**

Two halves:

- **Practice** — challenges I'm working through on other people's platforms,
  written up with the dead ends left in, plus a filterable tracker.
- **Challenge Lab** — challenges I wrote myself. Each has a brief, downloadable
  files, and a flag box that checks the answer in the visitor's browser.

Everything is generated from Markdown into a static Astro site with full-text
search. No backend, no accounts.

## Layout

```
challenges/               challenges I wrote — the Challenge Lab
  <slug>.md                brief + hint + author notes (notes are stripped)
  files/                   attachments players download
  flags.json               GITIGNORED — the answers
  TEMPLATE.md              copy this to start a new one
writeups/                 practice writeups — one .md per challenge
  picoctf/                 picoGym / other platforms
  cryptohack/<category>/   GITIGNORED — private notebook, see policy below
cryptohack_catalog.json   GITIGNORED — embeds CryptoHack's challenge text
picoctf_catalog.json      scraped picoGym challenge metadata
cryptohack_stubber.py     generates + updates the CryptoHack stubs
picoctf_catalog.py        refreshes the picoGym catalog
site/                     the Astro app
  scripts/sync.mjs         sources -> site content (local only)
  scripts/check-policy.mjs the publishing gate CI enforces
  scripts/clean.mjs        empties dist/ before each build
  src/content/writeups/    GENERATED but committed — only publishable pages
  src/content/labs/        GENERATED but committed — flag replaced by its hash
  src/data/*.json          GENERATED but committed — tracker indexes
  src/pages/               index, challenges, lab/, search, writeup/[slug]
.github/workflows/deploy.yml   builds and publishes to GitHub Pages
```

## Writing a challenge

```bash
cp challenges/TEMPLATE.md challenges/my-challenge.md
# write the brief; put any files in challenges/files/ and list them in Files:
# put the answer in challenges/flags.json under the slug "my-challenge"
cd site && npm run refresh
```

The flag never goes in the `.md`. It lives in `challenges/flags.json`, which is
gitignored; `sync.mjs` publishes only a SHA-256 of it, and the page checks
answers with the Web Crypto API in the visitor's browser. Nothing is submitted
anywhere and there is no scoreboard — this is a puzzle to try, not a platform.

A hash is a deterrent, not a security boundary: a guessable flag is still
guessable. It keeps the answer out of "view source", which is the job.

`## Author notes`, `## Solution` and `## Flag` sections are stripped from the
published page, so the intended solution can live next to the challenge.

## What actually gets published

Three gates, all enforced in code:

**1. Only solved challenges get a page.** An unsolved stub is a placeholder
wrapped around the platform's own challenge description. Unsolved challenges
appear only in the tracker at `/challenges`, linking out to the platform.

**2. CryptoHack is not on this site at all.** Their FAQ:

> Please do not publish solutions or writeups outside of the platform. However,
> for "Starter" challenges, and challenges worth 25 points or less, we make an
> exception – feel free to discuss those publicly.

Rather than publish inside a narrow exception, CryptoHack is kept off the site
entirely — no writeups, and not in the tracker. `writeups/cryptohack/` and
`cryptohack_catalog.json` are **gitignored** and stay on your machine as a
private study notebook. `cryptohack_stubber.py` still maintains them locally.

The point-ceiling rule remains implemented in `sync.mjs` and `check-policy.mjs`
as a backstop, in case CryptoHack material is ever re-enabled.

picoGym / picoCTF has no equivalent restriction — writeups there are normal and
widely published.

**3. Challenge Lab answers never ship.** Flags are gitignored, published only as
a hash, and `check-policy.mjs` greps the entire built site for every flag in
`flags.json` and fails the deploy if one appears.

## Adding a writeup

Every writeup is one Markdown file with a header block and prose sections:

```markdown
# Challenge Name

- **Category:** rsa
- **Points:** 40
- **Link:** https://cryptohack.org/challenges/rsa/...
- **Platform:** CryptoHack        <- optional, defaults to the folder
- **Status:** solved
- **Solved date:** 2026-08-03

## Approach
...what you tried, including what failed...

## Solution
```python
# solve script
```

## Key takeaway
One sentence on the technique and where else it applies.
```

Rules that matter:

- `**Status:** solved` is what publishes the page. Until then it stays a stub.
- **Redact flags for challenges that are still live** — write
  `picoCTF{REDACTED}` and say why.
- `**Platform:**` overrides the folder default, so a Cylab Academy challenge
  filed under `picoctf/` is still labelled correctly.
- The slug comes from the `# Title`, so renaming a title changes its URL.

For CryptoHack, the stubs already exist — `cryptohack_stubber.py` pulled every
challenge with its description and link. See `README-cryptohack-stubs.md`.

```bash
python cryptohack_stubber.py solve rsa "Monoprime"   # flip a stub to solved
python cryptohack_stubber.py check                   # progress at a glance
```

## The build is split, on purpose

`sync` reads the private CryptoHack sources, so **it only runs on your machine**.
CI never runs it — it would find nothing and wipe the site.

```bash
cd site
npm install
npm run sync       # regenerate content from writeups/ + catalogs  (local only)
npm run build      # astro build + pagefind index                  (what CI runs)
npm run refresh    # both, in order
npm run dev        # dev server (run sync first if writeups changed)
npm run preview    # serve the built site
```

`site/src/content/writeups/` and `site/src/data/challenges.json` are **generated
but committed** — they hold only policy-cleared material, and they are what CI
builds from. So the loop after solving something is:

```bash
python cryptohack_stubber.py solve general "ASCII"   # or edit the .md directly
cd site && npm run refresh
node scripts/check-policy.mjs                        # same gate CI runs
git add -A && git commit -m "Add ASCII writeup" && git push
```

`npm run build` is the real check: `dev` will not catch a broken production
build. Requires Node >= 22.12.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds, indexes,
runs `scripts/check-policy.mjs`, and publishes to Pages.

`check-policy.mjs` re-checks the built output independently of `sync`: point
ceiling, no reproduced challenge descriptions, no unsolved or placeholder pages,
no author notes or intended solutions on Lab pages, and no unredacted flag —
from any platform or your own — anywhere in `dist/`. It fails the deploy rather
than publish a violation, and it also runs as `postbuild` locally.

**One-time setup:** in the repo's *Settings -> Pages*, set **Source** to
**GitHub Actions**. Until that is switched over, Pages keeps serving from the
branch and the workflow's deploy step will fail.

## Gotchas worth knowing

- **`fs.rmSync` silently no-ops** on the OneDrive path this repo lives in.
  `sync.mjs` uses `unlinkSync` and verifies the purge actually happened.
- **Astro caches the content layer** in `site/node_modules/.astro/data-store.json`
  and does not drop entries when source files disappear — a stale build will
  re-emit pages whose Markdown is gone. `sync.mjs` invalidates it each run.
- **Keep `.astro` frontmatter ASCII.** The compiler slices frontmatter by byte
  offset; a multibyte character in there corrupts the emitted module and fails
  the build with a misleading "Unterminated string literal".
- **`is:inline` scripts are passed through verbatim** — Astro does not parse
  them, so a syntax error in one is invisible at build time and fatal in the
  browser. The `/challenges` renderer is inline; test it in a browser.

## Scope

Writeups describe challenges on platforms that exist to be attacked
(CryptoHack, picoGym, Cylab Academy). No real systems are targeted, and flags
for still-live challenges are withheld.
