import type { Prisma, PrismaClient, Session } from '../../generated/prisma/client'

export type SessionRecord = Session

export interface ListSessionsOptions {
  where: Prisma.SessionWhereInput
  skip: number
  take: number
}

// PrismaClient is received by parameter (never the singleton) so tests and
// future modules can inject their own client (e.g. a temp-database client).
export async function campaignExists(
  prisma: PrismaClient,
  campaignId: string,
): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  })
  return campaign !== null
}

export async function list(
  prisma: PrismaClient,
  options: ListSessionsOptions,
): Promise<SessionRecord[]> {
  return prisma.session.findMany({
    where: options.where,
    // Sessions read in story order: number is unique per campaign, id breaks
    // ties deterministically (defensive, should never be needed).
    orderBy: [{ number: 'asc' }, { id: 'asc' }],
    skip: options.skip,
    take: options.take,
  })
}

export async function count(
  prisma: PrismaClient,
  where: Prisma.SessionWhereInput,
): Promise<number> {
  return prisma.session.count({ where })
}

export async function findById(
  prisma: PrismaClient,
  id: string,
): Promise<SessionRecord | null> {
  return prisma.session.findUnique({ where: { id } })
}

export async function create(
  prisma: PrismaClient,
  data: {
    campaignId: string
    number: number
    title: string
    summary?: string | null
    playedAt?: Date | null
    notePath?: string | null
  },
): Promise<SessionRecord> {
  return prisma.session.create({ data })
}

export async function update(
  prisma: PrismaClient,
  id: string,
  data: {
    title?: string
    summary?: string | null
    playedAt?: Date | null
    notePath?: string | null
    status?: 'DRAFT' | 'PLAYED' | 'CLOSED'
  },
): Promise<SessionRecord> {
  return prisma.session.update({ where: { id }, data })
}

export async function remove(prisma: PrismaClient, id: string): Promise<SessionRecord> {
  return prisma.session.delete({ where: { id } })
}

// Next number for the campaign: max(number) + 1, or 1 for an empty campaign.
export async function nextNumber(prisma: PrismaClient, campaignId: string): Promise<number> {
  const aggregate = await prisma.session.aggregate({
    where: { campaignId },
    _max: { number: true },
  })
  return (aggregate._max.number ?? 0) + 1
}
