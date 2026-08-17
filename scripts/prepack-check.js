/**
 * prepack-check.js — pre-publish health check for dsh-niulai-sound.
 * Verifies the bundle manifest, audio assets, and plugin entry before `npm publish`.
 * Usage: node scripts/prepack-check.js
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const failures = []
const ok = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => { failures.push(msg); console.error(`  ✗ ${msg}`) }

// 1. package.json bundle manifest
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
if (!pkg.dsh || !pkg.dsh.bundle || !pkg.dsh.bundle.patch) fail('package.json missing dsh.bundle.patch')
else ok(`dsh.bundle.patch = ${pkg.dsh.bundle.patch}`)
if (!pkg.main || !existsSync(resolve(ROOT, pkg.main))) fail(`main not found: ${pkg.main}`)
else ok(`main = ${pkg.main}`)

// 2. cordis.patch.yml
const patch = readFileSync(resolve(ROOT, pkg.dsh.bundle.patch), 'utf8')
if (!patch.includes('dsh-niulai-sound')) fail('cordis.patch.yml does not reference dsh-niulai-sound')
else ok('cordis.patch.yml references dsh-niulai-sound')

// 3. audio assets (RIFF/WAVE magic)
for (const wav of ['mama.wav', 'niulai.wav']) {
  const p = resolve(ROOT, 'assets', wav)
  if (!existsSync(p)) { fail(`assets/${wav} missing`); continue }
  const head = readFileSync(p).subarray(0, 12).toString('ascii')
  if (!head.startsWith('RIFF') || !head.includes('WAVE')) fail(`assets/${wav} is not a RIFF/WAVE file`)
  else ok(`assets/${wav} ${statSync(p).size} bytes`)
}

if (failures.length > 0) {
  console.error(`\nprepack-check FAILED (${failures.length}):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('\nprepack-check OK')
