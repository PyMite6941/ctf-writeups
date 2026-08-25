# How to use these CTFs

This project has **two surfaces** that work together. This guide explains what
each one is, how to play the challenges, and how to download the files to run
and experiment on locally.

---

## The two surfaces

| Surface | Where | What it is | Runs code? |
|---|---|---|---|
| **The CTF website** | `pymite6941.github.io/ctf-writeups/` | Static site: practice **writeups**, a **Challenge Lab** of puzzles I built (with an in-browser flag checker), and a **tracker** | No — static, no backend |
| **Challenge instances** | Vercel, one URL each | Live, deliberately-vulnerable web apps you actually attack | Yes — real server |

The website is the *index and the puzzles you solve in the browser*. The
instances are the *live targets you attack over HTTP*. A web-exploitation
challenge needs a running server, which a static site can't be — so those live
on Vercel and the website links out to them.

### Live instances

| Challenge | Category | Live URL | Source |
|---|---|---|---|
| **Lockbox** | Web / IDOR (easy) | https://idor-lockbox.vercel.app | `challenge-instances/idor-lockbox/` |

> Instances are only reachable once **Vercel Deployment Protection** is turned
> off for that project (Vercel dashboard → project → Settings → Deployment
> Protection). If a challenge URL redirects you to a Vercel login, protection is
> still on.

---

## Playing a challenge

### On the website (Challenge Lab)
1. Open the website, go to **Challenge Lab**, pick a challenge.
2. Read the brief, download any attached files, solve it.
3. Paste the flag into the box. It's checked **in your browser** against a
   SHA-256 hash — nothing is submitted anywhere, there's no scoreboard. Right
   answer turns the box green. That's the whole loop: a puzzle to try, not a
   platform.

### On a live instance (Vercel)
1. Open the challenge URL (e.g. https://idor-lockbox.vercel.app).
2. You're given a starting foothold (Lockbox pre-fills a test login:
   `bob` / `hunter2`).
3. Find the flaw and use it to reach data you shouldn't. For Lockbox: the app
   fetches *your* note by id; change the id to read someone else's. The flag is
   the payload.

---

## Download the files to run and experiment locally

Every challenge ships its full source so you can **download it, run it, break
it, and fix it** on your own machine. This is the fastest way to actually
understand the bug — change one line and watch the exploit stop working.

Get the files (either):

```bash
# whole repo
git clone https://github.com/PyMite6941/ctf-writeups.git

# or just browse to challenge-instances/<name>/ on GitHub and download it
```

Run a web instance locally with **zero dependencies** (just Node):

```bash
cd ctf-writeups/challenge-instances/idor-lockbox
LOCKBOX_FLAG='flag{anything_you_want}' node serve.js
# open http://localhost:3000
```

`serve.js` runs the exact same handler files Vercel runs, and re-loads them on
every request — so edit `api/note.js`, refresh, and see the change immediately.
Try uncommenting the ownership check in `api/note.js`: the IDOR attack stops
working, which is how you *feel* what the fix does.

---

## Flags

- **Format:** `flag{...}`.
- **Never committed.** Live instances read their flag from a Vercel environment
  variable; the source only ever contains a placeholder. Challenge Lab flags are
  gitignored and published only as a SHA-256 hash. So cloning the repo never
  hands you an answer.
- Run something locally and you set your *own* flag via the env var — it's your
  sandbox, so it can be anything.

---

## Two rules for the live instances

1. **These are targets on purpose.** Attack the challenge instances and platforms
   made to be attacked. Nothing here points at a real system.
2. **OSINT/recon is not authorization.** If you're using the recon tooling
   (see the separate `reconkit` project) against a web target, only point it at
   hosts you own or these challenge instances — never at someone else's site.
