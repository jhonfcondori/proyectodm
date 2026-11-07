#!/usr/bin/env node
import { copyFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

function parseArgs(argv) {
  const args = {
    file: null,
    to: path.join('prisma', 'dev.db'),
    yes: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--file') args.file = argv[++i]
    else if (arg === '--to') args.to = argv[++i]
    else if (arg === '--yes') args.yes = true
  }
  return args
}

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

const args = parseArgs(process.argv.slice(2))

if (!args.file) {
  console.error('Usage: npm run db:restore -- --file <backup.db> --yes [--to prisma/dev.db]')
  process.exit(1)
}

const file = path.resolve(args.file)
const to = path.resolve(args.to)

if (!existsSync(file)) {
  console.error(`ERROR: backup not found: ${file}`)
  process.exit(1)
}

if (!args.yes) {
  console.log(`DRY RUN: would replace ${to} with ${file}`)
  console.log('Re-run with --yes to confirm. Stop the API before restoring.')
  process.exit(1)
}

if (existsSync(to)) {
  const safety = path.join('backups', 'db', `proyectodm-pre-restore-${timestamp()}.db`)
  await mkdir(path.dirname(safety), { recursive: true })
  await copyFile(to, safety)
  console.log(`Current database saved as: ${safety}`)
}

await mkdir(path.dirname(to), { recursive: true })
await copyFile(file, to)
console.log(`Database restored: ${file} -> ${to}`)
console.log('Next: npx prisma migrate resolve --rolled-back <migration> (if needed), then npx prisma migrate deploy.')
