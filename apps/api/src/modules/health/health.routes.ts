import { Router } from 'express'
import { checkHealth, type HealthDependencies } from './health.service'

export type HealthModuleOptions = HealthDependencies

export function createHealthRouter(options: HealthModuleOptions): Router {
  const router = Router()

  router.get('/', async (_request, response, next) => {
    try {
      const health = await checkHealth(options)
      response.status(health.status === 'ok' ? 200 : 503).json(health)
    } catch (error) {
      next(error)
    }
  })

  return router
}
