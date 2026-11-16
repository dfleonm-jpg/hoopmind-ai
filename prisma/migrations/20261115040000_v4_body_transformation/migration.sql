-- v4 Body Transformation: gym catalog, sessions, set logs, body measurements.

CREATE TYPE "MuscleGroup" AS ENUM (
  'CHEST','BACK','SHOULDERS','BICEPS','TRICEPS','FOREARMS','CORE','QUADS','HAMSTRINGS','GLUTES','CALVES'
);
CREATE TYPE "JointImpact" AS ENUM ('LOW','MEDIUM','HIGH');
CREATE TYPE "ExerciseLevel" AS ENUM ('BEGINNER','INTERMEDIATE','ADVANCED');

CREATE TABLE "GymExercise" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "primaryMuscles" "MuscleGroup"[],
  "secondaryMuscles" "MuscleGroup"[],
  "level" "ExerciseLevel" NOT NULL,
  "jointImpact" "JointImpact" NOT NULL,
  "equipment" TEXT NOT NULL,
  "execution" TEXT NOT NULL,
  "commonMistakes" TEXT[],
  "variations" TEXT[],
  "defaultSets" INTEGER NOT NULL DEFAULT 3,
  "defaultRepsLow" INTEGER NOT NULL DEFAULT 8,
  "defaultRepsHigh" INTEGER NOT NULL DEFAULT 12,
  "restSeconds" INTEGER NOT NULL DEFAULT 90,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GymExercise_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GymExercise_slug_key" ON "GymExercise"("slug");

CREATE TABLE "GymSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "focus" "MuscleGroup"[],
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "notes" TEXT,
  CONSTRAINT "GymSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GymSession_userId_startedAt_idx" ON "GymSession"("userId", "startedAt");
ALTER TABLE "GymSession" ADD CONSTRAINT "GymSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GymSetLog" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "exerciseId" UUID NOT NULL,
  "setNumber" INTEGER NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "reps" INTEGER NOT NULL,
  "rpe" INTEGER,
  "isPr" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GymSetLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GymSetLog_sessionId_idx" ON "GymSetLog"("sessionId");
CREATE INDEX "GymSetLog_exerciseId_idx" ON "GymSetLog"("exerciseId");
ALTER TABLE "GymSetLog" ADD CONSTRAINT "GymSetLog_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "GymSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GymSetLog" ADD CONSTRAINT "GymSetLog_exerciseId_fkey"
  FOREIGN KEY ("exerciseId") REFERENCES "GymExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "BodyMeasurement" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "weightKg" DOUBLE PRECISION,
  "bodyFatPct" DOUBLE PRECISION,
  "chestCm" DOUBLE PRECISION,
  "waistCm" DOUBLE PRECISION,
  "hipsCm" DOUBLE PRECISION,
  "armCm" DOUBLE PRECISION,
  "thighCm" DOUBLE PRECISION,
  "notes" TEXT,
  CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BodyMeasurement_userId_measuredAt_idx" ON "BodyMeasurement"("userId", "measuredAt");
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
