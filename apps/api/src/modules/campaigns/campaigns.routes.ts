import { Router } from 'express'
import { z } from 'zod'
import type {
  CampaignCreate,
  CampaignDetail,
  CampaignListQuery,
  CampaignUpdate,
} from '@proyectodm/shared'
import { asyncHandler, getValidated, validate } from '../../http/handler'
import type { PrismaClient } from '../../generated/prisma/client'
import {
  CampaignCreateSchema,
  CampaignListQuerySchema,
  CampaignUpdateSchema,
  IdParamSchema,
} from './campaigns.schema'
import * as service from './campaigns.service'

const IdParamsSchema = z.object({ id: IdParamSchema })

export interface CampaignsRouterDeps {
  prisma: PrismaClient
}

export function createCampaignsRouter(deps: CampaignsRouterDeps): Router {
  const router = Router()
  const { prisma } = deps

  router.get(
    '/',
    validate({ query: CampaignListQuerySchema }),
    asyncHandler(async (_request, response) => {
      const query = getValidated<unknown, CampaignListQuery>(response).query
      const result = await service.listCampaigns(prisma, query)
      response.status(200).json({ data: result.data, meta: result.meta })
    }),
  )

  router.post(
    '/',
    validate({ body: CampaignCreateSchema }),
    asyncHandler(async (_request, response) => {
      const body = getValidated<CampaignCreate>(response).body
      const campaign = await service.createCampaign(prisma, body)
      response.status(201).json({ data: campaign })
    }),
  )

  router.get(
    '/:id',
    validate({ params: IdParamsSchema }),
    asyncHandler(async (_request, response) => {
      const params = getValidated<unknown, unknown, { id: string }>(response).params
      const detail: CampaignDetail = await service.getCampaignDetail(prisma, params.id)
      response.status(200).json({ data: detail })
    }),
  )

  router.patch(
    '/:id',
    validate({ params: IdParamsSchema, body: CampaignUpdateSchema }),
    asyncHandler(async (_request, response) => {
      const validated = getValidated<CampaignUpdate, unknown, { id: string }>(response)
      const campaign = await service.updateCampaign(prisma, validated.params.id, validated.body)
      response.status(200).json({ data: campaign })
    }),
  )

  router.delete(
    '/:id',
    validate({ params: IdParamsSchema }),
    asyncHandler(async (_request, response) => {
      const params = getValidated<unknown, unknown, { id: string }>(response).params
      const result = await service.deleteCampaign(prisma, params.id)
      response.status(200).json({ data: result })
    }),
  )

  return router
}
