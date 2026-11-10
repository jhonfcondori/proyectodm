-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "playedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("campaignId", "createdAt", "id", "number", "playedAt", "summary", "title", "updatedAt") SELECT "campaignId", "createdAt", "id", "number", "playedAt", "summary", "title", "updatedAt" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_campaignId_playedAt_idx" ON "Session"("campaignId", "playedAt");
CREATE INDEX "Session_campaignId_status_idx" ON "Session"("campaignId", "status");
CREATE UNIQUE INDEX "Session_campaignId_number_key" ON "Session"("campaignId", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
