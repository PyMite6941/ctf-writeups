// Encrypt training lessons for scrape-proof publishing.  (local only, like sync.mjs)
//
//   cd site && npm run encrypt
//
// Reads PLAINTEXT lessons in training/lessons/*.md (gitignored) and the access
// code in training/access-code.txt (gitignored), renders each body to HTML, and
// encrypts the body with AES-256-GCM under a PBKDF2 key derived from the code.
// Writes site/src/data/lessons.json (COMMITTED), which holds only:
//   - public metadata (title, summary, difficulty...) for the teaser/list
//   - kdf salt + per-lesson iv + ciphertext for the body
//
// The plaintext body never enters the repo or the built HTML. A scraper, a
// crawler, or curl gets ciphertext; a student with the code decrypts it in the
// browser. Run whenever a lesson or the code changes, then commit lessons.json.
// Must NOT run in CI (CI has no plaintext and would wipe the data).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const HERE = path.dirname(fileURLToPath(import.meta.url));      // site/scripts
const TRAINING = path.join(HERE, '..', '..', 'training');
const LESSON_DIR = path.join(TRAINING, 'lessons');
const CODE_FILE = path.join(TRAINING, 'access-code.txt');
const OUT = path.join(HERE, '..', 'src', 'data', 'lessons.json');

const ITERATIONS = 200000;

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('missing frontmatter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (!mm) continue;
    let [, k, v] = mm;
    v = v.trim().replace(/^["']|["']$/g, '');
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+$/.test(v)) v = Number(v);
    meta[k] = v;
  }
  return { meta, body: m[2] };
}

function main() {
  const code = fs.readFileSync(CODE_FILE, 'utf8').trim();
  if (!code) throw new Error('training/access-code.txt is empty');

  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(code, salt, ITERATIONS, 32, 'sha256');

  const files = fs.readdirSync(LESSON_DIR).filter((f) => f.endsWith('.md')).sort();
  const lessons = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(LESSON_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const html = marked.parse(body, { async: false });

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(html, 'utf8'), cipher.final()]);
    const payload = Buffer.concat([enc, cipher.getAuthTag()]); // tag appended for WebCrypto

    lessons.push({
      slug: file.replace(/\.md$/, ''),
      title: meta.title || file,
      summary: meta.summary || '',
      order: meta.order ?? 0,
      difficulty: meta.difficulty || 'easy',
      concept: meta.concept || '',
      lab: meta.lab || '',
      labUrl: meta.labUrl || '',
      noindex: meta.noindex !== false, // gated lessons default to noindex
      unlisted: meta.unlisted === true,
      iv: iv.toString('base64'),
      ct: payload.toString('base64'),
    });
  }

  lessons.sort((a, b) => a.order - b.order);
  const out = {
    kdf: { salt: salt.toString('base64'), iterations: ITERATIONS, hash: 'SHA-256' },
    lessons,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`encrypted ${lessons.length} lesson(s) -> src/data/lessons.json (ciphertext only)`);
}

main();
