import type { Campaign, Prisma, PrismaClient } from '../../generated/prisma/client'

export type CampaignRecord = Campaign

export interface ListCampaignsOptions {
  where: Prisma.CampaignWhereInput
  skip: number
  take: number
}

// PrismaClient is received by parameter (never the singleton) so tests and
// future modules can inject their own client (e.g. a temp-database client).
export async function list(
  prisma: PrismaClient,
  options: ListCampaignsOptions,
): Promise<CampaignRecord[]> {
  return prisma.campaign.findMany({
    where: options.where,
    // Stable pagination: updatedAt ties (same ms) break deterministically by id.
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    skip: options.skip,
    take: options.take,
  })
}

export async function count(
  prisma: PrismaClient,
  where: Prisma.CampaignWhereInput,
): Promise<number> {
  return prisma.campaign.count({ where })
}

export async function findById(
  prisma: PrismaClient,
  id: string,
): Promise<CampaignRecord | null> {
  return prisma.campaign.findUnique({ where: { id } })
}

export async function create(
  prisma: PrismaClient,
  data: { name: string; description?: string | null },
): Promise<CampaignRecord> {
  return prisma.campaign.create({ data })
}

export async function update(
  prisma: PrismaClient,
  id: string,
  data: { name?: string; description?: string | null; status?: 'ACTIVE' | 'ARCHIVED' },
): Promise<CampaignRecord> {
  return prisma.campaign.update({ where: { id }, data })
}

export async function remove(prisma: PrismaClient, id: string): Promise<CampaignRecord> {
  return prisma.campaign.delete({ where: { id } })
}

export async function existsByName(
  prisma: PrismaClient,
  name: string,
  excludeId?: string,
): Promise<boolean> {
  // `name` has no DB unique constraint (application-level uniqueness), so
  // findUnique cannot be used here; findFirst matches the service-level check.
  const existing = await prisma.campaign.findFirst({ where: { name } })
  if (existing === null) {
    return false
  }
  return excludeId === undefined || existing.id !== excludeId
}

export async function detailCounts(
  prisma: PrismaClient,
  id: string,
): Promise<{ sessionCount: number; entityCount: number }> {
  const [sessionCount, entityCount] = await Promise.all([
    prisma.session.count({ where: { campaignId: id } }),
    prisma.entity.count({ where: { campaignId: id } }),
  ])
  return { sessionCount, entityCount }
}
