import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')

export function resolveDatabaseUrl(url: string): string {
  if (!url.startsWith('file:')) {
    return url
  }

  const rawPath = url.slice('file:'.length)
  if (path.isAbsolute(rawPath)) {
    return `file:${rawPath}`
  }

  return `file:${path.resolve(REPO_ROOT, rawPath)}`
}
