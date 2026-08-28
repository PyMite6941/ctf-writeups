---
title: How CTFs actually work
summary: What a capture-the-flag challenge is, the mindset that solves them, and the handful of tools you need to start.
order: 0
difficulty: intro
concept: methodology
noindex: true
---

A **CTF** (capture the flag) is a security puzzle. Somewhere in a system there's
a secret string — the **flag** — that you're not *supposed* to be able to reach.
Your job is to find the flaw that lets you reach it anyway. When you do, the flag
is your proof.

A flag is a short marker string — almost always a keyword followed by a value
wrapped in curly braces (think "picoCTF" then your prize in braces). You'll know
one the instant you see it. Finding one means you found the bug.

## The only mindset that matters

Every challenge is built on an **assumption the system makes about you** — and
the solve is finding where that assumption is wrong.

- A site assumes *you'll only ask for your own data.* → What if you ask for
  someone else's?
- A site assumes *nobody can forge its login token.* → What if you can?
- A program assumes *its input is well-formed.* → What if it isn't?

You are not "hacking" in the movie sense. You're reading carefully, noticing an
assumption, and gently pushing on it. Curiosity beats cleverness.

## A loop you can run on anything

1. **Enumerate.** Look at everything the target exposes. For a website: every
   page, every request it makes, every parameter, every header, every cookie.
   You can't attack what you haven't seen.
2. **Map the assumptions.** For each thing you found, ask: *what is the server
   trusting here?* Your ID in the URL? The role in your token? A filename?
3. **Pick the weakest one and push.** Change the value. Send the request the app
   never expected. Watch what comes back.
4. **Read the response like a message.** A 403 means "you're close, but blocked."
   A 200 with new data means you found it. An error often leaks a clue.
5. **Repeat.** Most solves are five boring pushes and one that works.

## The starter toolkit

You don't need much to begin:

- **Browser DevTools** (F12). The *Network* tab shows every request the page
  makes — method, URL, parameters, headers, the response. This is your
  microscope.
- **`curl`** — replay and *modify* any request from the terminal. This is how
  you send the request the app's own UI would never let you send.
- **A decoder** — base64, URL-encoding, hex. Tokens and parameters are often
  encoded, not encrypted. The [Tools page](/ctf-writeups/tools/) has these.
- **Patience and notes.** Write down what you tried. Dead ends are data.

## Practice grounds

This site hosts live challenges built for exactly this — safe, legal targets
that exist to be attacked:

- **[Challenge Lab](/ctf-writeups/lab/)** — puzzles you solve in the browser.
- **Lockbox** and **Vault** — full live web apps with a real (deliberate) flaw
  in each. The guided lessons here walk you up to them without spoiling the
  solve.

Start with the next lesson: it takes the loop above and runs it, step by step,
against Lockbox — and stops right before the answer, so the last push is yours.
