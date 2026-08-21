# Lockbox — IDOR challenge instance

Rung 1 of the web-exploitation ladder. A notes app that authenticates you
correctly but forgets to check that a note you fetch is *yours*.

- **Category:** Web
- **Difficulty:** easy
- **Vuln class:** IDOR (broken object-level authorization)
- **Intended solve:** log in as `bob / hunter2`, watch the app fetch
  `GET /api/note?id=3` (bob's note), then change `id` to `1` — the admin's note,
  which holds the flag. The `mynotes` endpoint filters by owner; the
  `note?id=` endpoint does not. That asymmetry is the whole lesson.
- **The fix** is one line, shown commented in `api/note.js`.

## Files

```
public/index.html   the app UI (login → your notes → open-note-by-number)
api/login.js        POST /api/login  -> { token }   (token = base64 userId)
api/mynotes.js      GET  /api/mynotes  (filters by owner — the "secure" one)
api/note.js         GET  /api/note?id= (NO ownership check — the bug)
api/_data.js        seed users + notes; flag comes from env, never committed
vercel.json         zero-build static + serverless functions
```

## The flag is never in git

`api/_data.js` reads `process.env.LOCKBOX_FLAG`. Nothing real is committed —
locally it shows a placeholder. Set the real flag as an environment variable in
the Vercel project settings.

## Deploy (its own Vercel project)

This folder deploys independently of the static `ctf-writeups` site. From the
Vercel dashboard: **New Project → import the repo → set Root Directory to
`challenge-instances/idor-lockbox`**, then add an env var `LOCKBOX_FLAG`.

Or from the CLI in this folder:

```bash
cd challenge-instances/idor-lockbox
vercel            # first run links/creates the project
vercel env add LOCKBOX_FLAG production
vercel --prod
```

## Run it locally

```bash
cd challenge-instances/idor-lockbox
LOCKBOX_FLAG='flag{test}' vercel dev      # needs the Vercel CLI
```

## Note: this repo is public

The annotated source here explains the bug on purpose — it's a *learning*
artifact. If you ever want Lockbox to be a genuinely-solvable challenge for
other people, host the deployed URL but keep the annotated source private
(a separate private repo or a gitignored copy), the same way the Challenge Lab
keeps its answers out of git.
