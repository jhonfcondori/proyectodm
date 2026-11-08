import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv({ path: path.resolve(import.meta.dirname, '../../../.env'), quiet: true })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1).default('file:./apps/api/prisma/dev.db'),
  VAULT_PATH: z.string().optional(),
  VAULT_SYNC_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  LOG_LEVEL: z.string().default('info'),
})

export type AppConfig = z.infer<typeof envSchema>

export const config: AppConfig = envSchema.parse(process.env)
