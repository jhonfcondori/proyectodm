import {
  canTransitionSession,
  type Session,
  type SessionCreate,
  type SessionListQuery,
  type SessionTransition,
  type SessionUpdate,
} from '@proyectodm/shared'
import { fromPrismaError, invalidTransition, notFound } from '../../http/errors'
import type { Prisma, PrismaClient } from '../../generated/prisma/client'
import * as repo from './sessions.repo'
import type { SessionRecord } from './sessions.repo'

export interface ListSessionsResult {
  data: Session[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const PRISMA_MESSAGES = {
  conflict: 'The session number was taken concurrently; retry the request',
  notFound: 'Session not found',
}

function toSession(record: SessionRecord): Session {
  return {
    id: record.id,
    campaignId: record.campaignId,
    number: record.number,
    title: record.title,
    summary: record.summary,
    playedAt: record.playedAt?.toISOString() ?? null,
    status: record.status,
    notePath: record.notePath,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

// Sessions live inside a campaign: every campaign-scoped route 404s when the
// parent does not exist, instead of returning an empty list or creating an
// orphan-looking resource.
async function assertCampaignExists(prisma: PrismaClient, campaignId: string): Promise<void> {
  if (!(await repo.campaignExists(prisma, campaignId))) {
    throw notFound('Campaign not found')
  }
}

function buildWhere(campaignId: string, query: SessionListQuery): Prisma.SessionWhereInput {
  return {
    campaignId,
    ...(query.status !== undefined ? { status: query.status } : {}),
  }
}

export async function listSessions(
  prisma: PrismaClient,
  campaignId: string,
  query: SessionListQuery,
): Promise<ListSessionsResult> {
  await assertCampaignExists(prisma, campaignId)

  const where = buildWhere(campaignId, query)
  const skip = (query.page - 1) * query.limit

  const [records, total] = await Promise.all([
    repo.list(prisma, { where, skip, take: query.limit }),
    repo.count(prisma, where),
  ])

  return {
    data: records.map(toSession),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: query.limit > 0 ? Math.ceil(total / query.limit) : 0,
    },
  }
}

export async function getNextSessionNumber(
  prisma: PrismaClient,
  campaignId: string,
): Promise<{ number: number }> {
  await assertCampaignExists(prisma, campaignId)
  return { number: await repo.nextNumber(prisma, campaignId) }
}

export async function createSession(
  prisma: PrismaClient,
  campaignId: string,
  input: SessionCreate,
): Promise<Session> {
  await assertCampaignExists(prisma, campaignId)

  // Numbering is computed server-side; a client cannot choose it. A concurrent
  // create can still hit @@unique([campaignId, number]) -> 409 CONFLICT.
  const number = await repo.nextNumber(prisma, campaignId)

  let record: SessionRecord
  try {
    record = await repo.create(prisma, {
      campaignId,
      number,
      title: input.title,
      summary: input.summary ?? null,
      playedAt: input.playedAt !== undefined && input.playedAt !== null
        ? new Date(input.playedAt)
        : null,
      notePath: input.notePath ?? null,
    })
  } catch (error) {
    throw fromPrismaError(error, PRISMA_MESSAGES)
  }
  return toSession(record)
}

export async function getSession(prisma: PrismaClient, id: string): Promise<Session> {
  const record = await repo.findById(prisma, id)
  if (record === null) {
    throw notFound('Session not found')
  }
  return toSession(record)
}

export async function updateSession(
  prisma: PrismaClient,
  id: string,
  input: SessionUpdate,
): Promise<Session> {
  const existing = await repo.findById(prisma, id)
  if (existing === null) {
    throw notFound('Session not found')
  }

  let record: SessionRecord
  try {
    record = await repo.update(prisma, id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.playedAt !== undefined
        ? { playedAt: input.playedAt === null ? null : new Date(input.playedAt) }
        : {}),
      ...(input.notePath !== undefined ? { notePath: input.notePath } : {}),
    })
  } catch (error) {
    // P2025 -> 404 if deleted between the existence check and the write.
    throw fromPrismaError(error, PRISMA_MESSAGES)
  }
  return toSession(record)
}

export async function transitionSession(
  prisma: PrismaClient,
  id: string,
  input: SessionTransition,
): Promise<Session> {
  const existing = await repo.findById(prisma, id)
  if (existing === null) {
    throw notFound('Session not found')
  }

  if (!canTransitionSession(existing.status, input.status)) {
    throw invalidTransition(
      `Cannot transition a session from ${existing.status} to ${input.status}`,
      { from: existing.status, to: input.status },
    )
  }

  let record: SessionRecord
  try {
    record = await repo.update(prisma, id, {
      status: input.status,
      // First move to PLAYED stamps the play date when the DM did not set one,
      // so a played session always has a date to sort/report by.
      ...(input.status === 'PLAYED' && existing.playedAt === null
        ? { playedAt: new Date() }
        : {}),
    })
  } catch (error) {
    throw fromPrismaError(error, PRISMA_MESSAGES)
  }
  return toSession(record)
}

export async function deleteSession(prisma: PrismaClient, id: string): Promise<{ id: string }> {
  const existing = await repo.findById(prisma, id)
  if (existing === null) {
    throw notFound('Session not found')
  }

  try {
    await repo.remove(prisma, id)
  } catch (error) {
    throw fromPrismaError(error, PRISMA_MESSAGES)
  }
  return { id }
}
