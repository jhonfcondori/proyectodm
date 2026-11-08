-- AlterTable: add Campaign.status with a safe default (existing rows keep working)
ALTER TABLE "Campaign" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex: composite lookup by status/recency.
-- NOTE: Campaign.name uniqueness is application-level (service-level 409),
-- not a DB constraint, so no unique index on "name" is created here and no
-- migration mutates user data (no UPDATE) to dedupe names.
CREATE INDEX "Campaign_status_updatedAt_idx" ON "Campaign"("status", "updatedAt");
