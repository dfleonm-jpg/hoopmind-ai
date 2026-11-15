-- v4 Fase 5: Life OS planner.

CREATE TYPE "PlannerCategory" AS ENUM ('TRAINING','GYM','NUTRITION','RECOVERY','PERSONAL');

CREATE TABLE "PlannerEvent" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "category" "PlannerCategory" NOT NULL DEFAULT 'PERSONAL',
  "day" TEXT NOT NULL,
  "time" TEXT,
  "done" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlannerEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlannerEvent_userId_day_idx" ON "PlannerEvent"("userId","day");
ALTER TABLE "PlannerEvent" ADD CONSTRAINT "PlannerEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
