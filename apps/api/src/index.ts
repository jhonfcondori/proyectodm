import { createApp } from './app'
import { config } from './config'
import { prisma, probeDatabase } from './db'

const VERSION = process.env.npm_package_version ?? '0.1.0'
const app = createApp({ version: VERSION, probeDatabase })

const server = app.listen(config.PORT, () => {
  console.log(`ProyectoDM API listening on http://localhost:${config.PORT}`)
  console.log(`Health: http://localhost:${config.PORT}/api/v1/health`)
})

const shutdown = (signal: string): void => {
  console.log(`Received ${signal}, shutting down`)
  const forceExitTimer = setTimeout(() => process.exit(1), 10_000).unref()
  server.close(() => {
    clearTimeout(forceExitTimer)
    void prisma.$disconnect().finally(() => process.exit(0))
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
