-- v3 Pro Edition: custom plays + combine results.

CREATE TYPE "CombineTest" AS ENUM ('FIFTY_THREES', 'HANDLE_FINISH', 'CLUTCH_FT');

CREATE TABLE "CustomPlay" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "format" "PlayFormat" NOT NULL,
    "category" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "keyCues" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomPlay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomPlay_userId_idx" ON "CustomPlay"("userId");

ALTER TABLE "CustomPlay" ADD CONSTRAINT "CustomPlay_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CombineResult" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "testType" "CombineTest" NOT NULL,
    "score" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "durationS" INTEGER NOT NULL,
    "ovrDelta" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CombineResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CombineResult_userId_idx" ON "CombineResult"("userId");

ALTER TABLE "CombineResult" ADD CONSTRAINT "CombineResult_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
