// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
  site: 'https://pymite6941.github.io',
  base: '/ctf-writeups/',
  output: 'static',
  integrations: [sitemap()],
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