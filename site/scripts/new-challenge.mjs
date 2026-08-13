#!/usr/bin/env node
/**
 * Scaffold a new Challenge Lab challenge.
 *
 *   npm run new -- xor-warmup "XOR Warmup"
 *
 * Creates three files, because the answer and the challenge must not live
 * together: the public brief, the private notes, and the flag entry.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LABS = join(ROOT, '..', 'challenges')
const NOTES = join(LABS, 'notes')
const FLAGS = join(LABS, 'flags.json')

const [, , rawSlug, ...titleWords] = process.argv

if (!rawSlug) {
  console.error('usage: npm run new -- <slug> ["Title"]')
  console.error('   eg: npm run new -- xor-warmup "XOR Warmup"')
  process.exit(1)
}

const slug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const title =
  titleWords.join(' ').trim() ||
  slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

const challengeFile = join(LABS, `${slug}.md`)
if (existsSync(challengeFile)) {
  console.error(`refusing to overwrite challenges/${slug}.md`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)

/* --- 1. the public brief --- */
writeFileSync(challengeFile, `# ${title}

- **Category:** Cryptography
- **Difficulty:** easy
- **Points:** 50
- **Published:** ${today}
- **Files:**

## Brief

What the player has, and what they're looking for. Say nothing about how to get
there. Two or three sentences and one clear goal.

## Hint

Optional. Nudge them toward the right question, don't answer it.
`, 'utf-8')

/* --- 2. the private notes: gitignored, and the part that teaches you --- */
mkdirSync(NOTES, { recursive: true })
const notesFile = join(NOTES, `${slug}.md`)
if (!existsSync(notesFile)) {
  writeFileSync(notesFile, `# ${title} — author notes

PRIVATE. Gitignored. Nothing here reaches the site or the repo.

## What this teaches

The one idea a player should walk away with. If you can't write this line, the
challenge doesn't have a point yet — fix that before building it.

## What I had to learn to build it

The actual reason for doing this. Write it down as you go, not after.

## Intended solution

Step by step, the path you expect. Note where you expect them to get stuck.

## Reference solver

Write a script that solves it from ONLY the published files, and keep it here.
If you can't solve your own challenge from the player's position, it isn't
finished.

    challenges/notes/${slug}-solver.py

## Playtest checklist

- [ ] Solvable using only the files and text on the page
- [ ] The brief gives away no part of the method
- [ ] The hint helps without solving it
- [ ] Flag format is obvious, or stated
- [ ] Reference solver recovers exactly the flag in flags.json
- [ ] Nothing in the published output leaks the answer (npm run refresh)
`, 'utf-8')
}

/* --- 3. the flag entry --- */
const flags = existsSync(FLAGS) ? JSON.parse(readFileSync(FLAGS, 'utf-8')) : {}
if (!(slug in flags)) {
  flags[slug] = `flag{CHANGE_ME_${slug.replace(/-/g, '_')}}`
  writeFileSync(FLAGS, JSON.stringify(flags, null, 2) + '\n', 'utf-8')
}

console.log(`Created "${title}"

  challenges/${slug}.md              the brief          (committed)
  challenges/notes/${slug}.md        notes + solver     (gitignored)
  challenges/flags.json              flag placeholder   (gitignored)

Next:
  1. set the real flag in challenges/flags.json
  2. write the brief; put any attachments in challenges/files/
     and list them on the Files: line
  3. npm run refresh
`)
