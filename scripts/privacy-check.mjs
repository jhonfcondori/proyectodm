#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SECRET_PATTERNS = [
  { name: 'GitHub token', regex: /\b(gho|ghp|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/ },
  { name: 'GitHub fine-grained token', regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: 'OpenAI/Anthropic key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'Slack token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Private key', regex: /-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----/ },
]

const CAMPAIGN_PATTERNS = [
  { name: 'campaign name', regex: /\b(Boerdium|Caerleon|Xandros|Xandrathos|NerviCamp|Silverflow|Fortsterling|Reymisterio)\b/i },
  { name: 'campaign NPC', regex: /\b(Roger Rias|Garlo|Matriarca Rias)\b/i },
  { name: 'campaign item', regex: /\bL[aá]grima de Plata\b/i },
  { name: 'personal email', regex: /jhonf\.condori@gmail\.com/i },
  { name: 'real vault path', regex: /ProyectoDM-Vault/i },
]

const IGNORED_FILES = new Set([
  'scripts/privacy-check.mjs',
])

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.db', '.sqlite', '.sqlite3',
  '.woff', '.woff2', '.ttf', '.otf', '.zip', '.gz', '.7z', '.mp3', '.mp4', '.webm',
])

const FORBIDDEN_TRACKED_PATHS = [
  /^DocMaterial\//,
  /^vault\//,
  /^respaldos\//,
  /\.(db|sqlite|sqlite3)$/i,
]

function listFiles(staged) {
  const args = staged
    ? ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']
    : ['ls-files', '-z']
  const output = execFileSync('git', args, { encoding: 'utf8' })
  return output.split('\0').filter(Boolean)
}

function lineOf(buffer, index) {
  return buffer.slice(0, index).split('\n').length
}

const staged = process.argv.includes('--staged')
const files = listFiles(staged)
const findings = []

for (const file of files) {
  if (IGNORED_FILES.has(file)) continue
  if (FORBIDDEN_TRACKED_PATHS.some((pattern) => pattern.test(file))) {
    findings.push({ file, line: 0, name: 'forbidden tracked path', value: file })
    continue
  }
  if (BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())) continue

  let content
  try {
    content = await readFile(file, 'utf8')
  } catch {
    continue
  }

  for (const { name, regex } of [...SECRET_PATTERNS, ...CAMPAIGN_PATTERNS]) {
    const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`)
    let match
    while ((match = global.exec(content)) !== null) {
      findings.push({ file, line: lineOf(content, match.index), name, value: match[0] })
      if (match.index === global.lastIndex) global.lastIndex += 1
    }
  }
}

if (findings.length === 0) {
  console.log(`Privacy check passed (${files.length} tracked files scanned).`)
  process.exit(0)
}

console.error('Privacy check failed:')
for (const finding of findings) {
  console.error(`  ${finding.file}:${finding.line} — ${finding.name}: ${finding.value}`)
}
console.error('\nRemove the data or add the file to .gitignore. Never commit campaign material or secrets.')
process.exit(1)
