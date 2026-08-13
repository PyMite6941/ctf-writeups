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

export const collections = { writeups, labs }