// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  site: 'https://pymite6941.github.io',
  base: '/ctf-writeups/',
  output: 'static',
  // Keep the gated /learn pages out of the sitemap too — a sitemap would
  // re-advertise the very URLs their noindex is meant to keep out of search.
  integrations: [sitemap({ filter: (page) => !page.includes('/learn') })],
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  build: {
    // GitHub Pages serves from a subpath; leave assets relative-agnostic
    // (Pagefind needs absolute URLs, handled at index time).
  },
})