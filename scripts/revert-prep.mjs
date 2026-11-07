#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const args = {
    pr: null,
    branch: null,
    mergeSha: null,
    backup: null,
    migrations: 'None',
    noDb: false,
    force: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--pr') args.pr = argv[++i]
    else if (arg === '--branch') args.branch = argv[++i]
    else if (arg === '--merge-sha') args.mergeSha = argv[++i]
    else if (arg === '--backup') args.backup = argv[++i]
    else if (arg === '--migrations') args.migrations = argv[++i]
    else if (arg === '--no-db') args.noDb = true
    else if (arg === '--force') args.force = true
  }
  return args
}

function git(args, fallback = null) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
  } catch {
    return fallback
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

const args = parseArgs(process.argv.slice(2))

if (!args.pr) {
  console.error('Usage: npm run revert:prep -- --pr <number> --branch <branch> [--backup <file>] [--migrations <names>] [--merge-sha <sha>] [--no-db]')
  process.exit(1)
}

const pr = String(args.pr)
const branch = args.branch ?? git(['rev-parse', '--abbrev-ref', 'HEAD'], 'unknown')
const featureSha = git(['rev-parse', '--verify', branch], git(['rev-parse', 'HEAD'], 'unknown'))
const preMergeDevSha = git(['rev-parse', '--verify', `refs/tags/pre-merge-pr-${pr}`], git(['rev-parse', 'dev'], 'unknown'))
const mergeSha = args.mergeSha ?? 'PENDING (fill after merge)'

let backupPath = 'None (no database change)'
let checksum = 'None'
if (!args.noDb && args.backup) {
  const backup = path.resolve(args.backup)
  if (!existsSync(backup)) {
    console.error(`ERROR: backup not found: ${backup}`)
    process.exit(1)
  }
  const buffer = await readFile(backup)
  backupPath = backup
  checksum = sha256(buffer)
}

const templatePath = path.join('docs', 'revert', 'TEMPLATE.md')
const template = await readFile(templatePath, 'utf8')
const outputPath = path.join('docs', 'revert', `PR-${pr}.md`)

if (existsSync(outputPath) && !args.force) {
  console.error(`ERROR: ${outputPath} already exists. Use --force to overwrite.`)
  process.exit(1)
}

const date = new Date().toISOString().slice(0, 10)
const migrations = args.noDb ? 'None (no database change)' : args.migrations

let output = template
  .replaceAll('<number>', pr)
  .replaceAll('<branch>', branch)
  .replaceAll('<feature_sha>', featureSha)
  .replaceAll('<pre_merge_dev_sha>', preMergeDevSha)
  .replaceAll('<merge_sha_or_pending>', mergeSha)
  .replaceAll('<merge_sha>', mergeSha)
  .replaceAll('<date>', date)
  .replaceAll('<backup_path_or_none>', backupPath)
  .replaceAll('<checksum_or_none>', checksum)
  .replaceAll('<migrations_or_none>', migrations)
  .replaceAll('<migration_name>', args.noDb ? 'n/a' : '<migration_name>')
  .replaceAll('<backup_path>', args.noDb ? 'n/a' : backupPath)
  .replaceAll('<flag_name>', 'None')
  .replaceAll('<free text>', 'None')

if (args.noDb) {
  output = output.replace(
    /## Database revert\n\n```bash\n[\s\S]*?```\n\nIf there was no migration, skip the `prisma` commands\./,
    '## Database revert\n\nNo database change. Nothing to restore.',
  )
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, output, 'utf8')

console.log(`Revert document written: ${outputPath}`)
console.log(`Pre-merge dev: ${preMergeDevSha}`)
console.log(`Merge SHA: ${mergeSha}`)
