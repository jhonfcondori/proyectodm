import { Router } from 'express'
import { z } from 'zod'
import type {
  SessionCreate,
  SessionListQuery,
  SessionTransition,
  SessionUpdate,
} from '@proyectodm/shared'
import { asyncHandler, getValidated, validate } from '../../http/handler'
import type { PrismaClient } from '../../generated/prisma/client'
import {
  IdParamSchema,
  SessionCreateSchema,
  SessionListQuerySchema,
  SessionTransitionSchema,
  SessionUpdateSchema,
} from './sessions.schema'
import * as service from './sessions.service'

const CampaignIdParamsSchema = z.object({ campaignId: IdParamSchema })
const SessionIdParamsSchema = z.object({ id: IdParamSchema })

export interface SessionsRouterDeps {
  prisma: PrismaClient
}

// Mounted at /api/v1: session list/create are campaign-scoped, while detail,
// update, transition and delete address the session directly.
export function createSessionsRouter(deps: SessionsRouterDeps): Router {
  const router = Router()
  const { prisma } = deps

  router.get(
    '/campaigns/:campaignId/sessions',
    validate({ params: CampaignIdParamsSchema, query: SessionListQuerySchema }),
    asyncHandler(async (_request, response) => {
      const validated = getValidated<unknown, SessionListQuery, { campaignId: string }>(response)
      const result = await service.listSessions(
        prisma,
        validated.params.campaignId,
        validated.query,
      )
      response.status(200).json({ data: result.data, meta: result.meta })
    }),
  )

  // Literal segment route: must be reachable alongside the collection route
  // above without being swallowed by an `:id`-style match.
  router.get(
    '/campaigns/:campaignId/sessions/next-number',
    validate({ params: CampaignIdParamsSchema }),
    asyncHandler(async (_request, response) => {
      const params = getValidated<unknown, unknown, { campaignId: string }>(response).params
      const result = await service.getNextSessionNumber(prisma, params.campaignId)
      response.status(200).json({ data: result })
    }),
  )

  router.post(
    '/campaigns/:campaignId/sessions',
    validate({ params: CampaignIdParamsSchema, body: SessionCreateSchema }),
    asyncHandler(async (_request, response) => {
      const validated = getValidated<SessionCreate, unknown, { campaignId: string }>(response)
      const session = await service.createSession(
        prisma,
        validated.params.campaignId,
        validated.body,
      )
      response.status(201).json({ data: session })
    }),
  )

  router.get(
    '/sessions/:id',
    validate({ params: SessionIdParamsSchema }),
    asyncHandler(async (_request, response) => {
      const params = getValidated<unknown, unknown, { id: string }>(response).params
      const session = await service.getSession(prisma, params.id)
      response.status(200).json({ data: session })
    }),
  )

  router.patch(
    '/sessions/:id',
    validate({ params: SessionIdParamsSchema, body: SessionUpdateSchema }),
    asyncHandler(async (_request, response) => {
      const validated = getValidated<SessionUpdate, unknown, { id: string }>(response)
      const session = await service.updateSession(prisma, validated.params.id, validated.body)
      response.status(200).json({ data: session })
    }),
  )

  router.post(
    '/sessions/:id/transition',
    validate({ params: SessionIdParamsSchema, body: SessionTransitionSchema }),
    asyncHandler(async (_request, response) => {
      const validated = getValidated<SessionTransition, unknown, { id: string }>(response)
      const session = await service.transitionSession(
        prisma,
        validated.params.id,
        validated.body,
      )
      response.status(200).json({ data: session })
    }),
  )

  router.delete(
    '/sessions/:id',
    validate({ params: SessionIdParamsSchema }),
    asyncHandler(async (_request, response) => {
      const params = getValidated<unknown, unknown, { id: string }>(response).params
      const result = await service.deleteSession(prisma, params.id)
      response.status(200).json({ data: result })
    }),
  )

  return router
}
