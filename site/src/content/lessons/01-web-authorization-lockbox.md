---
title: "Web: broken authorization (Lockbox)"
summary: Learn to spot when a site checks WHO you are but not WHAT you're allowed to touch — then prove it on a live target.
order: 1
difficulty: easy
concept: IDOR / broken object-level authorization
lab: Lockbox
labUrl: https://idor-lockbox.vercel.app
noindex: true
---

Two words that unlock most web challenges: **authentication** vs
**authorization**.

- **Authentication** = *who are you?* (logging in)
- **Authorization** = *what are you allowed to touch?* (permissions)

A huge share of real-world web bugs is a site that gets the first one right and
the second one wrong: you're properly logged in, and the server just... never
checks that the thing you asked for is actually yours. That bug has a name —
**IDOR** (Insecure Direct Object Reference). Let's find one.

## Your target

**Lockbox** — a notes app. **[Open it in a new tab →](https://idor-lockbox.vercel.app)**
A test account is pre-filled (`bob` / `hunter2`). Sign in.

Now run the loop from lesson 0. Don't scroll for hints until you've tried.

### 1. Enumerate

Open DevTools (F12) → **Network** tab *before* you click around. Then use the
app: it lists your notes, and it opens a note when you ask for one. Watch the
requests it makes.

<details>
<summary>Hint: what am I looking for in the Network tab?</summary>

When the app opens one of your notes, it makes a request to an endpoint with a
parameter in it. Find that request. What does the URL look like? What single
value in it decides *which* note you get back?
</details>

### 2. Map the assumption

You've found a request that fetches a note by some identifier. Ask the key
question: **what is the server trusting when it handles that request?**

<details>
<summary>Hint: name the assumption</summary>

The app only ever *shows* you links to your own notes, so it assumes you'll only
ever request an ID that belongs to you. But the ID is just a value in a request
you fully control. The server is trusting the client to only ask for what it
should. That's the crack.
</details>

### 3. Push on it

You control that request. The app's buttons won't let you ask for a note that
isn't yours — but `curl` (or editing the request in DevTools) will.

<details>
<summary>Hint: how do I send a request the UI won't let me?</summary>

Copy the note-fetch request as `curl` (DevTools → right-click the request → Copy
as cURL), paste it in your terminal, and change the ID to a different number.
You'll need the `Authorization` header from that copied request — that's what
keeps you logged in. Then just... try other IDs. Small numbers first.
</details>

### 4. Read the response

Most IDs will return your own notes or nothing. One belongs to someone more
interesting than bob.

<details>
<summary>Hint: whose note holds the prize?</summary>

Think about who has the most sensitive note in any system: the administrator.
Their note is one of the low-numbered IDs. When you request it and the server
hands it back — even though it isn't bob's — you've just demonstrated IDOR, and
the note's contents are your reward.
</details>

## You did it — now the lesson

If you got the flag: notice **you never broke the login.** You were bob the
whole time. You simply asked for an object that wasn't yours, and the server
never checked. That's the entire bug class, and it's everywhere — order numbers,
invoice PDFs, user profiles, API records.

**How it's fixed:** one line on the server — *before returning the object,
verify it belongs to the caller.* `if (note.owner !== you) deny()`. The reason
IDOR is so common is that this check is easy to forget and nothing visibly
breaks when you do.

**What to carry forward:** whenever you see an ID, a filename, or any reference
in a request you control, ask *does the server confirm I'm allowed this specific
one?* Often, it doesn't.

Next up: the site that *does* check your permissions correctly — so you forge a
better identity instead. That's **Vault**.
