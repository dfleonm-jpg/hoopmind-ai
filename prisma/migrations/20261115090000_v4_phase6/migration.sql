-- v4 Fase 6: anthropometry fields, plyometrics sessions, progress photos.

ALTER TABLE "Profile" ADD COLUMN "wingspanCm" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "standingReachCm" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "inseamCm" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "femurLengthCm" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "verticalJumpCm" INTEGER;

CREATE TYPE "PhotoPose" AS ENUM ('FRONT','SIDE','BACK');

CREATE TABLE "PlyoSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "drills" TEXT[],
  "totalContacts" INTEGER NOT NULL,
  "durationS" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlyoSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PlyoSession_userId_startedAt_idx" ON "PlyoSession"("userId","startedAt");
ALTER TABLE "PlyoSession" ADD CONSTRAINT "PlyoSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProgressPhoto" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "pose" "PhotoPose" NOT NULL,
  "storagePath" TEXT NOT NULL,
  "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProgressPhoto_userId_takenAt_idx" ON "ProgressPhoto"("userId","takenAt");
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
