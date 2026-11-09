import type {
  Campaign,
  CampaignCreate,
  CampaignDetail,
  CampaignListQuery,
  CampaignUpdate,
} from '@proyectodm/shared'
import { conflict, fromPrismaError, notFound } from '../../http/errors'
import type { Prisma, PrismaClient } from '../../generated/prisma/client'
import * as repo from './campaigns.repo'
import type { CampaignRecord } from './campaigns.repo'

export interface ListCampaignsResult {
  data: Campaign[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function toCampaign(record: CampaignRecord): Campaign {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function buildWhere(query: CampaignListQuery): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = {}
  if (query.status !== undefined) {
    where.status = query.status
  }
  // SQLite: `contains` is case-insensitive for ASCII by default (no mode support).
  // Trim first so `q='  anillo  '` matches `anillo`; a whitespace-only q is ignored.
  const q = query.q?.trim()
  if (q !== undefined && q !== '') {
    where.name = { contains: q }
  }
  return where
}

export async function listCampaigns(
  prisma: PrismaClient,
  query: CampaignListQuery,
): Promise<ListCampaignsResult> {
  const where = buildWhere(query)
  const skip = (query.page - 1) * query.limit

  const [records, total] = await Promise.all([
    repo.list(prisma, { where, skip, take: query.limit }),
    repo.count(prisma, where),
  ])

  return {
    data: records.map(toCampaign),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: query.limit > 0 ? Math.ceil(total / query.limit) : 0,
    },
  }
}

export async function createCampaign(
  prisma: PrismaClient,
  input: CampaignCreate,
): Promise<Campaign> {
  const duplicate = await repo.existsByName(prisma, input.name)
  if (duplicate) {
    throw conflict('A campaign with this name already exists')
  }

  let record: CampaignRecord
  try {
    record = await repo.create(prisma, {
      name: input.name,
      description: input.description ?? null,
    })
  } catch (error) {
    // Race: name uniqueness is application-level, so a concurrent create can
    // slip past existsByName. Map P2002 (if any unique constraint) to 409.
    throw fromPrismaError(error)
  }
  return toCampaign(record)
}

export async function getCampaignDetail(
  prisma: PrismaClient,
  id: string,
): Promise<CampaignDetail> {
  const record = await repo.findById(prisma, id)
  if (record === null) {
    throw notFound('Campaign not found')
  }

  const counts = await repo.detailCounts(prisma, id)
  return { ...toCampaign(record), ...counts }
}

export async function updateCampaign(
  prisma: PrismaClient,
  id: string,
  input: CampaignUpdate,
): Promise<Campaign> {
  const existing = await repo.findById(prisma, id)
  if (existing === null) {
    throw notFound('Campaign not found')
  }

  if (input.name !== undefined && input.name !== existing.name) {
    const duplicate = await repo.existsByName(prisma, input.name, id)
    if (duplicate) {
      throw conflict('A campaign with this name already exists')
    }
  }

  let record: CampaignRecord
  try {
    record = await repo.update(prisma, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
  } catch (error) {
    // P2002 -> 409 (duplicate name race), P2025 -> 404 (deleted between check and write).
    throw fromPrismaError(error)
  }
  return toCampaign(record)
}

export async function deleteCampaign(prisma: PrismaClient, id: string): Promise<{ id: string }> {
  const existing = await repo.findById(prisma, id)
  if (existing === null) {
    throw notFound('Campaign not found')
  }

  try {
    await repo.remove(prisma, id)
  } catch (error) {
    // P2025 -> 404 if deleted between the existence check and the delete.
    throw fromPrismaError(error)
  }
  return { id }
}
