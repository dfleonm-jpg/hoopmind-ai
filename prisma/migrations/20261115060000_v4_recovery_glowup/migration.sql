-- v4 Fase 3: Recovery & Longevity + Glow Up.

CREATE TYPE "CareCategory" AS ENUM ('SKINCARE','HAIRCARE','GROOMING','POSTURE');

CREATE TABLE "RecoveryLog" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sleepHours" DOUBLE PRECISION,
  "sleepQuality" INTEGER,
  "fatigue" INTEGER,
  "soreness" INTEGER,
  "stress" INTEGER,
  "energy" INTEGER,
  "mood" INTEGER,
  "notes" TEXT,
  CONSTRAINT "RecoveryLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RecoveryLog_userId_loggedAt_idx" ON "RecoveryLog"("userId","loggedAt");
ALTER TABLE "RecoveryLog" ADD CONSTRAINT "RecoveryLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Habit" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HabitLog" (
  "id" UUID NOT NULL,
  "habitId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "day" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "HabitLog_habitId_day_key" ON "HabitLog"("habitId","day");
CREATE INDEX "HabitLog_userId_day_idx" ON "HabitLog"("userId","day");
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey"
  FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CareRoutine" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "category" "CareCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "steps" TEXT[],
  "timeOfDay" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CareRoutine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareRoutine_userId_category_idx" ON "CareRoutine"("userId","category");
ALTER TABLE "CareRoutine" ADD CONSTRAINT "CareRoutine_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
