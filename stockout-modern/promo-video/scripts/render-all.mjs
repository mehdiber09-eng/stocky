#!/usr/bin/env node
/**
 * Rend les 6 vidéos d'un coup : 2 formats (vertical/horizontal) × 3 langues (fr/ar/en).
 * Usage : npm run render:all
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const formats = ['vertical', 'horizontal']
const langs = ['fr', 'ar', 'en']

const outDir = resolve('out')
mkdirSync(outDir, { recursive: true })

function render(id, file) {
  return new Promise((res, rej) => {
    const p = spawn('npx', ['remotion', 'render', id, file], {
      stdio: 'inherit',
      shell: true,
    })
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`render ${id} exit ${code}`))))
  })
}

const start = Date.now()
let done = 0
const total = formats.length * langs.length

for (const fmt of formats) {
  for (const lang of langs) {
    const id = `Stocky-${fmt}-${lang}`
    const file = resolve(outDir, `stocky-${fmt}-${lang}.mp4`)
    console.log(`\n→ [${++done}/${total}] ${id}`)
    await render(id, file)
    console.log(`  ✓ ${file}`)
  }
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`\n✓ ${total} vidéos rendues en ${elapsed}s — dossier : out/`)
