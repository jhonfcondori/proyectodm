import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../src/generated/prisma/client'
import { resolveDatabaseUrl } from '../../src/database-url'

export interface TestDatabase {
  prisma: PrismaClient
  dbPath: string
  cleanup: () => Promise<void>
}

// Creates a throwaway SQLite database under apps/api/.tmp-tests/, applies all
// migrations with `prisma migrate deploy`, and returns a client bound to it.
// Reusable by every sub-phase backend test.
export function createTestDatabase(): TestDatabase {
  const apiRoot = path.resolve(import.meta.dirname, '../..')
  const repoRoot = path.resolve(apiRoot, '../..')
  const tmpDir = path.join(apiRoot, '.tmp-tests')
  fs.mkdirSync(tmpDir, { recursive: true })

  const dbPath = path.join(tmpDir, `${randomUUID()}.db`)
  const databaseUrl = `file:${dbPath.replaceAll(path.sep, '/')}`

  // Apply migrations to the temp file (config resolution happens in prisma.config.ts).
  // node + prisma JS entry avoids the npx .cmd shim (spawnSync EINVAL on Windows).
  const prismaCli = path.join(repoRoot, 'node_modules', 'prisma', 'build', 'index.js')
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  })

  const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl(databaseUrl) })
  const prisma = new PrismaClient({ adapter })

  const cleanup = async (): Promise<void> => {
    await prisma.$disconnect()
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      // Windows can keep the file locked (EBUSY/EPERM) right after disconnect.
      // Retry unlink up to 3 times with a short 50ms pause, then swallow
      // EBUSY/EPERM so cleanup in afterAll never breaks the test run.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          fs.unlinkSync(`${dbPath}${suffix}`)
          break
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code
          if (code === 'ENOENT') {
            break
          }
          if ((code === 'EBUSY' || code === 'EPERM') && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 50))
            continue
          }
          if (code === 'EBUSY' || code === 'EPERM') {
            console.warn(`cleanup: could not unlink ${dbPath}${suffix} (${code}), ignoring`)
            break
          }
          throw error
        }
      }
    }
  }

  return { prisma, dbPath, cleanup }
}
