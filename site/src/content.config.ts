import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    // Platform key, not a fixed set: writeups may declare their own via the
    // Platform: header (see scripts/sync.mjs).
    site: z.string().default('cryptohack'),
    siteLabel: z.string().default('CryptoHack'),
    category: z.string(),
    categoryKey: z.string(),
    points: z.number(),
    url: z.string(),
    status: z.enum(['solved', 'unsolved']),
    solvedDate: z.string().optional(),
  }),
})

/* Challenges Matt authored. The flag itself never gets here — only a SHA-256
   of it, so the page can check an answer without publishing one. */
const labs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/labs' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
    points: z.number().default(0),
    published: z.string().optional(),
    files: z.array(z.string()).default([]),
    flagHash: z.string().default(''),
  }),
})

/* "Learn CTF" teaching track. Methodology + guided lessons that use my own
   live challenges (Lockbox, Vault) as the practice grounds. Lessons are hand-
   authored markdown (not generated, no secrets) and never contain a flag or a
   full solution -- they teach how to approach a challenge and hint toward it. */
const lessons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().default(0),
    difficulty: z.enum(['intro', 'easy', 'medium', 'hard']).default('easy'),
    concept: z.string().optional(),
    lab: z.string().optional(),      // name of the live challenge it uses
    labUrl: z.string().optional(),   // where to go practice
    // Discovery controls for training pages:
    noindex: z.boolean().default(false),   // keep out of search engines + site search
    unlisted: z.boolean().default(false),  // also hide from the /learn index (direct-link only)
  }),
})

export const collections = { writeups, labs, lessons }