-- v4 Fase 2: Nutrition Intelligence.

CREATE TYPE "BiologicalSex" AS ENUM ('MALE','FEMALE');
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY','LIGHT','MODERATE','ACTIVE','VERY_ACTIVE');
CREATE TYPE "NutritionObjective" AS ENUM ('MUSCLE_GAIN','MAINTENANCE','PERFORMANCE','RECOMPOSITION');
CREATE TYPE "MealType" AS ENUM ('BREAKFAST','LUNCH','DINNER','SNACK');

ALTER TABLE "Profile" ADD COLUMN "age" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "sex" "BiologicalSex";
ALTER TABLE "Profile" ADD COLUMN "activityLevel" "ActivityLevel" NOT NULL DEFAULT 'MODERATE';

CREATE TABLE "NutritionGoal" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "objective" "NutritionObjective" NOT NULL DEFAULT 'MAINTENANCE',
  "calories" INTEGER NOT NULL,
  "proteinG" INTEGER NOT NULL,
  "carbsG" INTEGER NOT NULL,
  "fatG" INTEGER NOT NULL,
  "fiberG" INTEGER NOT NULL DEFAULT 28,
  "waterMl" INTEGER NOT NULL DEFAULT 2500,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NutritionGoal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NutritionGoal_userId_key" ON "NutritionGoal"("userId");
ALTER TABLE "NutritionGoal" ADD CONSTRAINT "NutritionGoal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "FoodLog" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "mealType" "MealType" NOT NULL,
  "name" TEXT NOT NULL,
  "sourceRef" TEXT,
  "quantityG" DOUBLE PRECISION NOT NULL,
  "calories" DOUBLE PRECISION NOT NULL,
  "proteinG" DOUBLE PRECISION NOT NULL,
  "carbsG" DOUBLE PRECISION NOT NULL,
  "fatG" DOUBLE PRECISION NOT NULL,
  "fiberG" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "FoodLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FoodLog_userId_loggedAt_idx" ON "FoodLog"("userId", "loggedAt");
ALTER TABLE "FoodLog" ADD CONSTRAINT "FoodLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HydrationLog" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amountMl" INTEGER NOT NULL,
  CONSTRAINT "HydrationLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HydrationLog_userId_loggedAt_idx" ON "HydrationLog"("userId", "loggedAt");
ALTER TABLE "HydrationLog" ADD CONSTRAINT "HydrationLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
