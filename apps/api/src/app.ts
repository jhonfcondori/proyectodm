import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import { createHealthRouter, type HealthModuleOptions } from './modules/health/index'

export type AppDependencies = HealthModuleOptions

export function createApp(deps: AppDependencies): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  app.use('/api/v1/health', createHealthRouter(deps))

  app.use((_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    })
  })

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error(error)
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    })
  })

  return app
}
