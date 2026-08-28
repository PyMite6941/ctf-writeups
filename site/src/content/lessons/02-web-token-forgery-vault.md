---
title: "Web: forging a session token (Vault)"
summary: When the permission check is correct, attack the identity it trusts. Learn to read a JWT and forge one on a live target.
order: 2
difficulty: medium
concept: JWT alg:none / algorithm confusion
lab: Vault
labUrl: https://jwt-vault.vercel.app
noindex: true
---

In the last lesson the server forgot to check permissions. This time it checks
them **correctly** — you really are blocked from the admin's data. So you attack
the other half of the equation: instead of sneaking past the check, you become
someone the check lets through. You **forge your identity**.

## Meet the JWT

Modern sites carry your session in a **JWT** (JSON Web Token). It looks like
three chunks of gibberish separated by dots:

```
eyJhbGc...  .  eyJ1c2Vy...  .  Sfl3xq...
   header          payload        signature
```

- **header** — metadata, including which *algorithm* signs the token.
- **payload** — your claims: who you are, your role. This is where `role:user`
  lives.
- **signature** — a cryptographic seal so the server can tell a real token from
  a forged one.

Each chunk is just **base64url-encoded JSON** — encoded, *not* encrypted. You can
read it. That's the first thing to try.

## Your target

**Vault** — a document store. **[Open it →](https://jwt-vault.vercel.app)**
Sign in with the pre-filled `alice` / `password123`. The app even shows you your
token. There's an admin-only document you can't open. Yet.

### 1. Read your own token

Copy your JWT. Decode the middle chunk (the payload).

<details>
<summary>Hint: how do I decode it?</summary>

Take the middle section (between the two dots) and base64url-decode it — the
[Tools page](/ctf-writeups/tools/) has a decoder, or in a terminal:
`echo '<middle-part>' | base64 -d`. You'll see JSON like
`{"user":"alice","role":"user"}`. Now you know exactly what claim controls
access.
</details>

### 2. Map the assumption

You can *read* the payload — but if you change `role` to `admin` and re-encode
it, the **signature** won't match and a correct server rejects it. So the real
question is: **does this server actually verify the signature properly?**

<details>
<summary>Hint: where do verifiers go wrong?</summary>

The header names the algorithm — and a classic flaw is that the server *trusts
the header* to tell it how to verify. The JWT spec allows an algorithm literally
called `none`, meaning "unsigned." A verifier that honors `none` will accept a
token with **no signature at all**, as long as the header says so. If this
server has that flaw, you don't need the secret — you just declare there's no
signature to check.
</details>

### 3. Forge it

Build your own token: a header that says `alg: none`, a payload that claims
`role: admin`, and an empty signature.

<details>
<summary>Hint: the exact shape</summary>

A `none` token is `base64url(header) + "." + base64url(payload) + "."` — note
the trailing dot and empty third part. Header: `{"alg":"none","typ":"JWT"}`.
Payload: `{"user":"alice","role":"admin"}`. A tiny script:

```python
import base64, json
b = lambda o: base64.urlsafe_b64encode(
        json.dumps(o, separators=(',', ':')).encode()).rstrip(b'=').decode()
print(b({'alg':'none','typ':'JWT'}) + '.' + b({'user':'alice','role':'admin'}) + '.')
```
</details>

### 4. Use it

Send your forged token as the `Authorization: Bearer <token>` header when you
request the admin document.

<details>
<summary>Hint: putting it together</summary>

Copy the admin-document request from DevTools as `curl`, swap the `Authorization`
header for `Bearer <your-forged-token>`, and send it. The server reads
`role:admin`, sees `alg:none`, skips the signature check, and serves you the
document.
</details>

## You did it — now the lesson

The permission check was never the problem — you *were* correctly blocked as a
user. You won by handing the server an identity it wrongly trusted.

**How it's fixed:** the server must decide the algorithm itself and refuse
anything else — *especially* `none` — **before** looking at the signature. Never
let the token tell you how to check the token. (Real libraries were bitten by
exactly this; it's a genuine historical CVE class, not a toy.)

**What to carry forward:** when a value is signed/encoded rather than encrypted,
read it first. Then ask *who decides whether this is trustworthy — me or the
server?* If the attacker-controlled data gets a vote, that's the bug.
