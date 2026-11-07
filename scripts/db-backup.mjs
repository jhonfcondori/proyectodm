#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = {
    label: 'manual',
    src: path.join('prisma', 'dev.db'),
    dest: null,
    requireDb: false,
    vacuum: true,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--label') args.label = argv[++i]
    else if (arg === '--src') args.src = argv[++i]
    else if (arg === '--dest') args.dest = argv[++i]
    else if (arg === '--require') args.requireDb = true
    else if (arg === '--no-vacuum') args.vacuum = false
  }
  return args
}

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

const args = parseArgs(process.argv.slice(2))
const src = path.resolve(args.src)

if (!existsSync(src)) {
  const message = `No database found at ${src}. Nothing to back up.`
  if (args.requireDb) {
    console.error(`ERROR: ${message}`)
    process.exit(1)
  }
  console.warn(`WARN: ${message}`)
  process.exit(0)
}

const safeLabel = args.label.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'manual'
const dest = path.resolve(
  args.dest ?? path.join('backups', 'db', `proyectodm-${timestamp()}-${safeLabel}.db`),
)

await mkdir(path.dirname(dest), { recursive: true })

let mode = 'copy'
if (args.vacuum) {
  try {
    const { DatabaseSync } = await import('node:sqlite')
    const db = new DatabaseSync(src)
    try {
      db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`)
      mode = 'vacuum-into'
    } finally {
      db.close()
    }
  } catch (error) {
    console.warn(`WARN: VACUUM INTO failed (${error.message}). Falling back to file copy.`)
    mode = 'copy'
  }
}

if (mode === 'copy') {
  await copyFile(src, dest)
}

const buffer = await readFile(dest)
const checksum = sha256(buffer)
await writeFile(`${dest}.sha256`, `${checksum}  ${path.basename(dest)}\n`, 'utf8')

console.log(`Backup created (${mode}): ${dest}`)
console.log(`SHA256: ${checksum}`)
console.log('Store this path in the PR revert document.')
