#!/usr/bin/env node
/**
 * sync.mjs — build the Astro site's content from the sources of truth.
 *
 * The site has two halves: challenges Matt is *practicing* on other people's
 * platforms, and challenges he *authored* himself.
 *
 * Reads:
 *   ../writeups/picoctf/...     practice writeups (Title + header fields + prose)
 *   ../picoctf_catalog.json     picoGym challenge metadata for the tracker
 *   ../challenges/<slug>.md     challenges Matt wrote (no flag in the file)
 *   ../challenges/flags.json    the answers, gitignored, never published
 *
 * Writes:
 *   src/content/writeups/<slug>.md   practice writeups, solved + policy-cleared
 *   src/content/labs/<slug>.md       authored challenges, flag replaced by a hash
 *   src/data/challenges.json         practice tracker index
 *   src/data/labs.json               authored challenge index
 *   src/data/tools.json              the tools index
 *   public/challenge-files/...       attachments players download
 *   public/tools/...                 the my-tools scripts players can download
 *
 * CryptoHack is deliberately absent: their FAQ restricts publishing writeups,
 * so that material stays a private local notebook (see ../writeups/cryptohack,
 * gitignored) and never reaches the site.
 *
 * This script runs locally, not in CI — it reads private sources. Its output is
 * committed. See README.md.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync, copyFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const REPO = join(ROOT, '..')
const WRITEUPS = join(REPO, 'writeups')
const PICO_CATALOG = join(REPO, 'picoctf_catalog.json')
const LABS_SRC = join(REPO, 'challenges')
const LABS_FLAGS = join(LABS_SRC, 'flags.json')
const OUT_CONTENT = join(ROOT, 'src', 'content', 'writeups')
const OUT_LABS = join(ROOT, 'src', 'content', 'labs')
const OUT_DATA = join(ROOT, 'src', 'data')
const OUT_FILES = join(ROOT, 'public', 'challenge-files')
const TOOLS_MANIFEST = join(REPO, 'my-tools', 'tools.json')
const TOOLS_SRC = join(REPO, 'my-tools')
const OUT_TOOLS = join(ROOT, 'public', 'tools')

/* Platforms whose challenges appear in the practice tracker. CryptoHack is
   excluded on purpose — see the file header. */
const TRACKED_FOLDERS = ['picoctf']

/* Must match `base` in astro.config.mjs — challenges.json is emitted at sync
   time, so it can't read import.meta.env.BASE_URL. */
const BASE = '/ctf-writeups/'

const CATEGORY_LABELS = {
  general: 'General', mathematics: 'Mathematics', 'symmetric-ciphers': 'Symmetric Ciphers',
  rsa: 'RSA', 'diffie-hellman': 'Diffie-Hellman', 'elliptic-curves': 'Elliptic Curves',
  'hash-functions': 'Hash Functions', lattices: 'Lattices', isogenies: 'Isogenies',
  'zero-knowledge-proofs': 'Zero Knowledge', 'crypto-on-the-web': 'Crypto on the Web',
  miscellaneous: 'Miscellaneous', 'ctf-archive': 'CTF Archive',
  /* Keys are slugs: lookups go through slugify(), so spaced keys never match. */
  'general-skills': 'General Skills', cryptography: 'Cryptography', forensics: 'Forensics',
  'web-exploitation': 'Web Exploitation', 'reverse-engineering': 'Reverse Engineering',
  'binary-exploitation': 'Binary Exploitation',
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const yam = (v) => JSON.stringify(v)

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (entry.endsWith('.md')) out.push(p)
  }
  return out
}

/** Parse a writeup file into {title, categoryKey, points, url, status, solvedDate, body}. */
function parseWriteup(file) {
  const text = readFileSync(file, 'utf-8')
  const title = (text.match(/^#\s+(.+)$/m) || [])[1] || ''
  const field = (key) => {
    const m = text.match(new RegExp(`^\\s*[-*]\\s*\\*\\*${key}:\\*\\*\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : ''
  }
  const status = (field('Status') || 'unsolved').toLowerCase()
  const solvedDate = field('Solved date').replace(/^_+|_+$/g, '').trim()
  const bodyIdx = text.search(/^## /m)
  return {
    title,
    categoryKey: slugify(field('Category')),
    points: parseInt(field('Points') || '0', 10) || 0,
    url: field('Link') || '',
    /* Optional. Challenges hosted somewhere other than the folder's default
       platform (e.g. a Cylab Academy challenge filed under picoctf/) declare
       it here so the site does not misattribute them. */
    platform: field('Platform'),
    status: status === 'solved' ? 'solved' : 'unsolved',
    solvedDate: status === 'solved' ? solvedDate : '',
    body: bodyIdx === -1 ? text.trim() : text.slice(bodyIdx).trim(),
  }
}

const PLATFORMS = {
  cryptohack: 'CryptoHack',
  picoctf: 'picoGym',
  cylab: 'Cylab Academy',
}

/**
 * Per-platform publishing rules.
 *
 * CryptoHack's FAQ: "Please do not publish solutions or writeups outside of
 * the platform. However, for 'Starter' challenges, and challenges worth 25
 * points or less, we make an exception - feel free to discuss those publicly."
 * So a CryptoHack challenge above 25 points is tracker-only, no matter what
 * its Status says. This is enforced here rather than left to memory.
 */
const PUBLISH_RULES = {
  cryptohack: {
    maxPoints: 25,
    reason: "CryptoHack allows public writeups only for Starter challenges and those worth <= 25 points",
    // Their challenge text is theirs; published pages link to it instead.
    stripDescription: true,
  },
}

/** May this solved writeup become a public page? */
function publishable(site, points) {
  const rule = PUBLISH_RULES[site]
  if (!rule) return true
  return points <= rule.maxPoints
}

/** Resolve a writeup's platform key + display label from its Platform: field. */
function platformOf(w, fallbackKey) {
  if (!w.platform) return [fallbackKey, PLATFORMS[fallbackKey]]
  const key = slugify(w.platform)
  const known = Object.entries(PLATFORMS).find(
    ([k, label]) => k === key || slugify(label) === key,
  )
  return known ? [known[0], known[1]] : [key, w.platform]
}

/**
 * Remove the verbatim challenge description from a page body. The stub keeps
 * it locally for reference, but a published page carries only Matt's own
 * writing plus a link to the challenge.
 */
function stripDescription(body) {
  /* Split into `## ` sections and drop the description outright. Done by
     section rather than one regex: a lookahead for the next heading also
     matches end-of-line under /m and silently strips only the heading,
     leaving the text it was supposed to remove. */
  const parts = body.split(/^(?=##\s)/m)
  return parts
    .filter((part) => !/^##\s*(Description|The challenge)\b/i.test(part.trim()))
    .join('')
    .trim()
}

function frontmatter(w) {
  const lines = [
    '---',
    `title: ${yam(w.title)}`,
    `site: ${w.site || 'cryptohack'}`,
    `siteLabel: ${w.siteLabel || 'CryptoHack'}`,
    `category: ${yam(CATEGORY_LABELS[w.categoryKey] || w.categoryKey)}`,
    `categoryKey: ${yam(w.categoryKey)}`,
    `points: ${w.points}`,
    `url: ${yam(w.url)}`,
    `status: ${w.status}`,
    w.solvedDate ? `solvedDate: ${yam(w.solvedDate)}` : '',
    '---',
    '',
    w.body,
  ].filter(Boolean)
  return lines.join('\n') + '\n'
}

/**
 * Build the authored-challenge half of the site.
 *
 * Source files live in ../challenges/ and are committed, but they never contain
 * the answer: flags live in ../challenges/flags.json, which is gitignored. Only
 * a SHA-256 of the flag reaches the site, so the page can check a player's
 * answer in the browser without the answer ever being published.
 *
 * (A hash is a deterrent, not a security boundary — a guessable flag is still
 * guessable. It keeps the answer out of "view source", which is the point.)
 */
function syncLabs() {
  mkdirSync(OUT_LABS, { recursive: true })
  mkdirSync(OUT_FILES, { recursive: true })

  const flags = existsSync(LABS_FLAGS) ? JSON.parse(readFileSync(LABS_FLAGS, 'utf-8')) : {}
  /* TEMPLATE.md is authoring scaffolding, not a challenge. Anything starting
     with _ or . is likewise treated as a draft and left unpublished. */
  const files = existsSync(LABS_SRC)
    ? readdirSync(LABS_SRC)
        .filter((f) => f.endsWith('.md') && f !== 'TEMPLATE.md' && !/^[._]/.test(f))
        .sort()
    : []

  const index = []
  const emitted = new Set()
  const missingFlags = []

  for (const file of files) {
    const text = readFileSync(join(LABS_SRC, file), 'utf-8')
    const slug = file.replace(/\.md$/, '')
    const title = (text.match(/^#\s+(.+)$/m) || [])[1] || slug
    const field = (key) => {
      const m = text.match(new RegExp(`^\\s*[-*]\\s*\\*\\*${key}:\\*\\*\\s*(.+)$`, 'm'))
      return m ? m[1].trim() : ''
    }

    /* Author notes are the intended solution and why it was built — useful to
       keep beside the challenge, fatal to publish. Drop them, plus any section
       that names the flag outright. */
    const bodyIdx = text.search(/^## /m)
    const body = (bodyIdx === -1 ? '' : text.slice(bodyIdx))
      .split(/^(?=##\s)/m)
      .filter((part) => !/^##\s*(Author notes?|Solution|Flag)\b/i.test(part.trim()))
      .join('')
      .trim()

    const flag = flags[slug]
    if (!flag) missingFlags.push(slug)

    const attachments = field('Files')
      .split(',').map((s) => s.trim()).filter(Boolean)
    for (const rel of attachments) {
      const from = join(LABS_SRC, rel)
      if (!existsSync(from)) {
        console.warn(`[!] ${slug}: attachment not found: ${rel}`)
        continue
      }
      copyFileSync(from, join(OUT_FILES, rel.split(/[\\/]/).pop()))
    }

    const meta = {
      title,
      slug,
      category: field('Category') || 'Miscellaneous',
      difficulty: (field('Difficulty') || 'easy').toLowerCase(),
      points: parseInt(field('Points') || '0', 10) || 0,
      published: field('Published'),
      files: attachments.map((f) => f.split(/[\\/]/).pop()),
      /* Hash the flag exactly as a player would type it. */
      flagHash: flag ? createHash('sha256').update(flag.trim()).digest('hex') : '',
    }

    const front = [
      '---',
      `title: ${yam(meta.title)}`,
      `category: ${yam(meta.category)}`,
      `difficulty: ${yam(meta.difficulty)}`,
      `points: ${meta.points}`,
      meta.published ? `published: ${yam(meta.published)}` : '',
      `files: ${JSON.stringify(meta.files)}`,
      `flagHash: ${yam(meta.flagHash)}`,
      '---',
      '',
      body,
    ].filter(Boolean).join('\n') + '\n'

    writeFileSync(join(OUT_LABS, `${slug}.md`), front, 'utf-8')
    emitted.add(`${slug}.md`)
    index.push({ ...meta, url: `${BASE}lab/${slug}/` })
  }

  for (const stale of readdirSync(OUT_LABS).filter((f) => f.endsWith('.md') && !emitted.has(f))) {
    unlinkSync(join(OUT_LABS, stale))
  }

  writeFileSync(join(OUT_DATA, 'labs.json'), JSON.stringify(index, null, 2) + '\n', 'utf-8')

  if (missingFlags.length) {
    console.warn(`[!] no flag in challenges/flags.json for: ${missingFlags.join(', ')}`)
    console.warn('    those challenges publish without a working flag checker.')
  }
  return index
}

/**
 * Build the tools half of the site.
 *
 * The scripts Matt keeps reaching for live in ../my-tools/ and are committed.
 * ../my-tools/tools.json is the manifest: it says which .py files to publish,
 * what to call them, and which in-browser widget type the Tools page should
 * render for each. sync copies the scripts for download and emits an index the
 * page renders from.
 */
function syncTools() {
  if (!existsSync(TOOLS_MANIFEST)) {
    console.warn('[sync] no my-tools/tools.json manifest — skipping tools')
    return []
  }

  mkdirSync(OUT_TOOLS, { recursive: true })
  const manifest = JSON.parse(readFileSync(TOOLS_MANIFEST, 'utf-8'))
  const emitted = new Set()
  const index = []

  for (const tool of manifest) {
    const src = join(TOOLS_SRC, tool.file)
    if (!existsSync(src)) {
      console.warn(`[!] tool file not found: ${tool.file}`)
      continue
    }
    copyFileSync(src, join(OUT_TOOLS, tool.file))
    emitted.add(tool.file)
    index.push({
      slug: slugify(tool.name) || tool.file.replace(/\.py$/, ''),
      file: tool.file,
      name: tool.name,
      description: tool.description || '',
      category: tool.category || 'Utility',
      widget: tool.widget || '',
    })
  }

  /* Drop downloads for tools removed from the manifest. unlinkSync, not
     rmSync: rmSync silently no-ops against this path under OneDrive on
     Windows (see the writeup purge below). */
  for (const stale of readdirSync(OUT_TOOLS).filter((f) => f.endsWith('.py') && !emitted.has(f))) {
    unlinkSync(join(OUT_TOOLS, stale))
  }

  writeFileSync(join(OUT_DATA, 'tools.json'), JSON.stringify(index, null, 2) + '\n', 'utf-8')
  return index
}

function main() {
  mkdirSync(OUT_CONTENT, { recursive: true })
  mkdirSync(OUT_DATA, { recursive: true })

  const index = []
  const seen = new Set()
  const emitted = new Set()
  const withheld = []

  /* --- Writeups: source of truth for both page + index.
         One folder per platform; a file may override its platform with a
         Platform: header (see platformOf). --- */
  const written = new Set()
  for (const folder of TRACKED_FOLDERS) {
    for (const file of walk(join(WRITEUPS, folder))) {
      const w = parseWriteup(file)
      const slug = slugify(w.title) || file.replace(/[\\/]/g, '/').split('/').pop().replace(/\.md$/, '')
      if (!seen.has(slug)) seen.add(slug)
      else { console.warn('[!] slug collision:', slug); continue }

      const [site, siteLabel] = platformOf(w, folder)

      /* Only solved challenges get a public page. An unsolved stub is a
         placeholder wrapped around the platform's own challenge description —
         publishing it would be 300 blank pages of someone else's text. The
         challenge still appears in the tracker, linking out to the platform.
         Solved challenges are additionally gated by the platform's own rules
         on publishing writeups (see PUBLISH_RULES). */
      if (w.status === 'solved') {
        if (publishable(site, w.points)) {
          const rule = PUBLISH_RULES[site]
          const body = rule?.stripDescription ? stripDescription(w.body) : w.body
          writeFileSync(join(OUT_CONTENT, `${slug}.md`), frontmatter({ ...w, site, siteLabel, body }), 'utf-8')
          emitted.add(`${slug}.md`)
        } else {
          withheld.push(`${w.title} (${siteLabel}, ${w.points} pts)`)
        }
      }

      written.add(w.title.toLowerCase())
      index.push({
        name: w.title, site, siteLabel,
        category: CATEGORY_LABELS[w.categoryKey] || w.categoryKey,
        points: w.points, status: w.status, solvedDate: w.solvedDate, url: w.url,
        writeup: emitted.has(`${slug}.md`) ? `${BASE}writeup/${slug}/` : null,
      })
    }
  }

  /* Drop pages for challenges that were un-solved or renamed since last sync,
     so a stale build never leaves an orphan page in dist/.
     unlinkSync, not rmSync: rmSync silently no-ops against this path under
     OneDrive on Windows, which would leave every stale page in the build. */
  let purged = 0
  for (const stale of readdirSync(OUT_CONTENT).filter((f) => f.endsWith('.md') && !emitted.has(f))) {
    unlinkSync(join(OUT_CONTENT, stale))
    purged++
  }
  const leftover = readdirSync(OUT_CONTENT).filter((f) => f.endsWith('.md') && !emitted.has(f))
  if (leftover.length) {
    throw new Error(`[sync] failed to purge ${leftover.length} stale writeup file(s), e.g. ${leftover[0]}`)
  }

  /* Astro's content layer persists entries in node_modules/.astro/data-store.json
     and does not drop them when the glob loader's directory empties out — a build
     after this sync would happily re-emit pages whose source files are gone.
     Invalidate the store so the collection is rebuilt from what's on disk now. */
  const dataStore = join(ROOT, 'node_modules', '.astro', 'data-store.json')
  if (existsSync(dataStore)) unlinkSync(dataStore)

  /* --- picoGym: index rows from catalog, minus anything a writeup already
         covers (a writeup carries the real status, the catalog never does). --- */
  let pico = []
  if (existsSync(PICO_CATALOG)) {
    const cat = JSON.parse(readFileSync(PICO_CATALOG, 'utf-8'))
    pico = cat
      .filter((r) => !written.has(r.name.toLowerCase()))
      .map((r) => ({
        name: r.name, site: 'picoctf', siteLabel: 'picoGym',
        category: r.category, points: r.points || 0, status: 'unsolved',
        solvedDate: '', url: r.url, writeup: null,
      }))
  }

  /* --- crypto writeups already counted into index within the loop --- */
  const all = [...index, ...pico]
  writeFileSync(join(OUT_DATA, 'challenges.json'), JSON.stringify(all, null, 2) + '\n', 'utf-8')

  const solved = all.filter((c) => c.status === 'solved').length
  console.log(`[sync] tracked: ${all.length} (${index.length} from writeups, ${pico.length} from the picoGym catalog) — ${solved} solved, ${emitted.size} writeup page(s) emitted, ${purged} stale purged`)

  if (withheld.length) {
    console.log(`[sync] ${withheld.length} solved writeup(s) held back by platform policy:`)
    for (const w of withheld.slice(0, 10)) console.log(`         - ${w}`)
    if (withheld.length > 10) console.log(`         ... and ${withheld.length - 10} more`)
    console.log(`       ${PUBLISH_RULES.cryptohack.reason}.`)
  }

  const labs = syncLabs()
  console.log(`[sync] authored challenges: ${labs.length} (${labs.filter((l) => l.flagHash).length} with a flag checker)`)

  const tools = syncTools()
  console.log(`[sync] tools: ${tools.length} (${tools.filter((t) => t.widget).length} with an in-browser widget)`)
}

main()