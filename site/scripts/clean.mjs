#!/usr/bin/env node
/**
 * Remove dist/ before a build.
 *
 * Astro does not clear its output directory, so a page that is withdrawn -
 * unsolved again, renamed, or held back by a platform's publishing policy -
 * survives in dist/ and gets deployed anyway. That turns a policy decision
 * into a silent leak, so the build starts from an empty directory.
 *
 * Implemented with unlinkSync/rmdirSync rather than rmSync: on the OneDrive
 * path this repo lives on, rmSync returns success without deleting anything
 * (files and directories alike), which would defeat the whole point.
 */
import { readdirSync, unlinkSync, rmdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function removeTree(path) {
  if (!existsSync(path)) return 0
  let removed = 0
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) removed += removeTree(join(path, entry))
    rmdirSync(path)
  } else {
    unlinkSync(path)
    removed = 1
  }
  return removed
}

const target = join(ROOT, 'dist')
const removed = removeTree(target)

if (existsSync(target)) {
  console.error(`[clean] failed to remove ${target} - the build would inherit stale pages.`)
  process.exit(1)
}

console.log(`[clean] dist/ removed (${removed} files)`)
