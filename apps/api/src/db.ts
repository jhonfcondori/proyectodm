import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { config } from './config'
import { resolveDatabaseUrl } from './database-url'
import { PrismaClient } from './generated/prisma/client'

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(config.DATABASE_URL),
})

export const prisma = new PrismaClient({ adapter })

export async function probeDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`
}
