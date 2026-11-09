import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import { sendError, validationError } from './http/errors'
import type { PrismaClient } from './generated/prisma/client'
import { createHealthRouter, type HealthModuleOptions } from './modules/health/index'
import { createCampaignsRouter } from './modules/campaigns/index'
import { createSessionsRouter } from './modules/sessions/index'

export type AppDependencies = HealthModuleOptions & { prisma?: PrismaClient }

export function createApp(deps: AppDependencies): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  app.use('/api/v1/health', createHealthRouter(deps))

  // Campaigns need a real database. prisma is optional so health-only
  // tests can build the app without a BD (no singleton import here).
  if (deps.prisma !== undefined) {
    app.use('/api/v1/campaigns', createCampaignsRouter({ prisma: deps.prisma }))
    // Mounted at /api/v1 because sessions mix campaign-scoped collection routes
    // (/campaigns/:campaignId/sessions) with direct item routes (/sessions/:id).
    app.use('/api/v1', createSessionsRouter({ prisma: deps.prisma }))
  }

  app.use((_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    })
  })

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    // express.json() throws a SyntaxError (status 400 / entity.parse.failed)
    // on malformed JSON. That is a client validation problem, not a 500.
    if (
      error instanceof SyntaxError &&
      ((error as { status?: unknown }).status === 400 ||
        (error as { type?: unknown }).type === 'entity.parse.failed')
    ) {
      sendError(response, validationError('Malformed JSON in request body'))
      return
    }
    console.error(error)
    sendError(response, error)
  })

  return app
}
