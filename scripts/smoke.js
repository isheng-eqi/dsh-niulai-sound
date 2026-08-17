/**
 * smoke.js — verify the wav assets are valid RIFF/WAVE files and report durations.
 * Usage: node scripts/smoke.js
 */
import { readFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

for (const name of ['mama.wav', 'niulai.wav']) {
  const p = resolve(ROOT, 'assets', name)
  const buf = readFileSync(p)
  const ascii = buf.subarray(0, 12).toString('ascii')
  if (!ascii.startsWith('RIFF') || !ascii.includes('WAVE')) {
    console.error(`✗ ${name}: not a RIFF/WAVE file`)
    process.exitCode = 1
    continue
  }
  // fmt chunk: sample rate at offset 24 (after RIFF+size+WAVE+fmt +size)
  const sampleRate = buf.readUInt32LE(24)
  const byteRate = buf.readUInt32LE(28)
  const blockAlign = buf.readUInt16LE(32)
  const bits = buf.readUInt16LE(34)
  // data chunk size: scan for 'data'
  let dataSize = 0
  let off = 12
  while (off + 8 <= buf.length) {
    const tag = buf.toString('ascii', off, off + 4)
    const size = buf.readUInt32LE(off + 4)
    if (tag === 'data') { dataSize = size; break }
    off += 8 + size + (size % 2)
  }
  const duration = dataSize / byteRate
  console.log(`✓ ${name}: ${sampleRate}Hz ${bits}bit mono? ${blockAlign} bytes ${duration.toFixed(2)}s (${statSync(p).size} bytes)`)
}
