-- v2: gamification columns on Profile + post-session report table.

ALTER TABLE "Profile" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD COLUMN "gameLevel" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "SessionReport" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionReport_sessionId_key" ON "SessionReport"("sessionId");

ALTER TABLE "SessionReport" ADD CONSTRAINT "SessionReport_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
