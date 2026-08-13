#!/usr/bin/env node
/**
 * Enforce platform publishing rules against what is actually about to ship.
 *
 * sync.mjs applies these rules when it generates content, but sync runs
 * locally and its output is committed by hand — so this re-checks the built
 * site independently. It reads dist/ and the committed content, not sync's
 * intentions.
 *
 * CryptoHack's FAQ: solutions and writeups must not be published outside the
 * platform, except for Starter challenges and those worth <= 25 points.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const CONTENT = join(ROOT, 'src', 'content', 'writeups')
const DIST = join(ROOT, 'dist')
const CHALLENGES = join(ROOT, 'src', 'data', 'challenges.json')

const MAX_CRYPTOHACK_POINTS = 25
const failures = []

/** Pull a scalar out of a generated writeup's YAML frontmatter. */
function frontmatterOf(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  return Object.fromEntries(
    m[1].split('\n').map((line) => {
      const i = line.indexOf(':')
      if (i === -1) return [line, '']
      const key = line.slice(0, i).trim()
      let value = line.slice(i + 1).trim()
      if (value.startsWith('"')) {
        try { value = JSON.parse(value) } catch {}
      }
      return [key, value]
    }),
  )
}

/* 1. No published page may exceed CryptoHack's point ceiling. */
const pages = existsSync(CONTENT)
  ? readdirSync(CONTENT).filter((f) => f.endsWith('.md'))
  : []

for (const file of pages) {
  const text = readFileSync(join(CONTENT, file), 'utf-8')
  const fm = frontmatterOf(text)
  const points = Number(fm.points || 0)

  if (fm.site === 'cryptohack' && points > MAX_CRYPTOHACK_POINTS) {
    failures.push(
      `${file}: CryptoHack challenge worth ${points} points has a public page ` +
      `(limit is ${MAX_CRYPTOHACK_POINTS}). CryptoHack does not permit writeups above that.`,
    )
  }

  /* 2. No published page may reproduce the platform's challenge description. */
  if (fm.site === 'cryptohack' && /^##\s*Description\b/mi.test(text)) {
    failures.push(`${file}: reproduces the CryptoHack challenge description; link to the challenge instead.`)
  }

  /* 3. No unsolved stub should ever reach the site. */
  if (fm.status !== 'solved') {
    failures.push(`${file}: status is "${fm.status}" but it has a public page.`)
  }

  /* 4. Placeholder text means an unfinished stub slipped through. */
  if (/_How did I attack this\?|# my solve script goes here|_One sentence: what technique/.test(text)) {
    failures.push(`${file}: still contains stub placeholder text.`)
  }
}

/* 5. The tracker must not link to a page that policy forbids. */
if (existsSync(CHALLENGES)) {
  for (const row of JSON.parse(readFileSync(CHALLENGES, 'utf-8'))) {
    if (row.writeup && row.site === 'cryptohack' && (row.points || 0) > MAX_CRYPTOHACK_POINTS) {
      failures.push(`challenges.json: "${row.name}" (${row.points} pts) links to a writeup page it may not have.`)
    }
  }
}

/* 6. Authored challenges must never ship the answer or the author's notes. */
const LABS = join(ROOT, 'src', 'content', 'labs')
const labPages = existsSync(LABS) ? readdirSync(LABS).filter((f) => f.endsWith('.md')) : []

for (const file of labPages) {
  const text = readFileSync(join(LABS, file), 'utf-8')
  const fm = frontmatterOf(text)

  if (/^##\s*(Author notes?|Solution)\b/mi.test(text)) {
    failures.push(`labs/${file}: still contains author notes or the intended solution.`)
  }
  if (fm.flagHash && !/^[a-f0-9]{64}$/.test(fm.flagHash)) {
    failures.push(`labs/${file}: flagHash is not a SHA-256 digest — is the flag itself in there?`)
  }

  /* Scaffolded prose that was never written. Publishing a challenge whose brief
     still says "What the player has" is worse than not publishing it. */
  if (/What the player has, and what they're looking for|Nudge them toward the right question/.test(text)) {
    failures.push(`labs/${file}: brief or hint is still the scaffolded placeholder.`)
  }
}

/* 6a. A challenge published with the placeholder flag is unsolvable. */
const flagsPath = join(ROOT, '..', 'challenges', 'flags.json')
if (existsSync(flagsPath)) {
  const flags = JSON.parse(readFileSync(flagsPath, 'utf-8'))
  for (const [slug, flag] of Object.entries(flags)) {
    if (/CHANGE_ME/.test(flag) && labPages.includes(`${slug}.md`)) {
      failures.push(`challenges/flags.json: "${slug}" is published but its flag is still the placeholder.`)
    }
  }
}

/* 6b. The committed challenge SOURCES must not give the answer away either.
       Stripping author notes from the published page is worthless if the file
       naming the key is sitting in a public repo. */
const LAB_SRC = join(ROOT, '..', 'challenges')
if (existsSync(LAB_SRC)) {
  for (const file of readdirSync(LAB_SRC).filter((f) => f.endsWith('.md') && f !== 'TEMPLATE.md')) {
    const text = readFileSync(join(LAB_SRC, file), 'utf-8')
    if (/^##\s*(Author notes?|Solution|Flag)\b/mi.test(text)) {
      failures.push(
        `challenges/${file}: this file is committed — move author notes/solution to ` +
        `challenges/notes/ (gitignored) instead.`,
      )
    }
  }
}

/* 7. Nothing in the built output may leak a flag, from any platform or mine.
      The Lab's own flags are the sharpest case: publishing one silently makes
      the challenge pointless. */
if (existsSync(DIST)) {
  const walk = (dir, out = []) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p, out)
      else if (e.name.endsWith('.html')) out.push(p)
    }
    return out
  }

  const patterns = [/\b(crypto|pico)CTF?\{(?!REDACTED)[^}]{2,}\}/i, /\bflag\{(?!\.\.\.)[^}]{2,}\}/i]
  for (const page of walk(DIST)) {
    const html = readFileSync(page, 'utf-8')
    for (const pattern of patterns) {
      const hit = html.match(pattern)
      if (hit) failures.push(`${page}: publishes what looks like a live flag: ${hit[0]}`)
    }
  }

  /* Every flag in flags.json, if it is present locally, must be absent from the
     build. This is the check that would have caught a template mistake. */
  const flagsFile = join(ROOT, '..', 'challenges', 'flags.json')
  if (existsSync(flagsFile)) {
    const flags = JSON.parse(readFileSync(flagsFile, 'utf-8'))
    const pages = walk(DIST)
    for (const [slug, flag] of Object.entries(flags)) {
      for (const page of pages) {
        if (readFileSync(page, 'utf-8').includes(flag)) {
          failures.push(`${page}: contains the plaintext flag for "${slug}".`)
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`\nPolicy check FAILED (${failures.length}):\n`)
  for (const f of failures) console.error(`  - ${f}`)
  console.error('')
  process.exit(1)
}

console.log(`Policy check passed: ${pages.length} published page(s), no violations.`)
