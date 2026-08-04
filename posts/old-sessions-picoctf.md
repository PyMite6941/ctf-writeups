---
title: Old Sessions
platform: picoGym
category: Web Exploitation
difficulty: Easy
date: 2026-08-03
tools: DevTools, document.cookie
url: https://learn.cylabacademy.org/library/739
---

## The challenge

> Proper session timeout controls are critical for securing user accounts. If a
> user logs in on a public or shared computer but doesn't explicitly log out
> (instead simply closing the browser tab), and session expiration dates are
> misconfigured, the session may remain active indefinitely.
>
> This then allows an attacker using the same browser later to access the user's
> account without needing credentials, exploiting the fact that sessions never
> expire and remain authenticated.
>
> Your friend tells you to check out a new social media platform he built a few
> years ago. Although it's still under development, he said the site is almost
> complete. He also mentioned that he hates constantly logging into sites, and
> so has made his page that 'once you login, you never have to log-out again'!

## First look

Opened the DevTools console and looked around for anything related to JS and any
comments. The prompt says "you never have to log out again", which hints at
persistent session cookies rather than an injection — the session is the
attack surface, not the login form.

## What I tried that didn't work

- **SQL injection** — `admin' --` with a dummy password. I suspected SQLi since
  the login code seemed otherwise secure. Not the intended path.
- **Dumping storage** — `document.cookie`, `localStorage` and `sessionStorage`
  were all empty. I had no session cookie yet because I hadn't logged in.
- **Scanned DevTools tabs** — moved to the Network tab looking for cookie
  handling, but that didn't surface the bug directly either.

## The solve

1. Create an account normally — registration just works. Now check the cookies
   again and everything is stored.
2. A comment from `mary_jones_8992` hints at `/sessions`. Navigating there
   lists the stored sessions:

   ```
   1) session:UUWHdDiQyLn1TpsMIbtZ90eM8NM5DTmEbFvdIQow5tI, {'_permanent': True, 'key': 'admin'}
   2) session:JKR5lis5NcSQB7erfTvBEm_VovAWn-oVZLrfNCiQ2GE, {'_permanent': True, 'key': 'your_username_here'}
   ```

3. In DevTools → Application → Cookies, edit the session cookie's value to the
   `admin` session value and reload — the browser now presents the admin's
   never-expiring session.

## Flag

`picoCTF{REDACTED}` — withheld, challenge is still live.

## What I learned

A "never log out" cookie is a session that never expires, so anyone who can read
or replace it can impersonate the user — here an exposed `/sessions` endpoint
let me swap in the admin's cookie. Session cookies need expiry and shouldn't be
enumerable through a public endpoint; check for session management endpoints
whenever a prompt mentions persistent logins.
