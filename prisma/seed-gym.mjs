// Seeds the curated gym exercise catalog into GymExercise (idempotent by slug).
// Run: node prisma/seed-gym.mjs
import { PrismaClient } from "@prisma/client";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Load the TS catalog via tsx's loader when available; fall back to a JSON mirror.
let GYM_CATALOG;
try {
  register("tsx/esm", pathToFileURL("./"));
  ({ GYM_CATALOG } = await import("./src/lib/gym/catalog.ts"));
} catch {
  ({ GYM_CATALOG } = await import("../src/lib/gym/catalog.ts"));
}

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  for (const ex of GYM_CATALOG) {
    await prisma.gymExercise.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        level: ex.level,
        jointImpact: ex.jointImpact,
        equipment: ex.equipment,
        execution: ex.execution,
        commonMistakes: ex.commonMistakes,
        variations: ex.variations,
        defaultSets: ex.defaultSets,
        defaultRepsLow: ex.defaultRepsLow,
        defaultRepsHigh: ex.defaultRepsHigh,
        restSeconds: ex.restSeconds,
      },
      create: {
        slug: ex.slug,
        name: ex.name,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        level: ex.level,
        jointImpact: ex.jointImpact,
        equipment: ex.equipment,
        execution: ex.execution,
        commonMistakes: ex.commonMistakes,
        variations: ex.variations,
        defaultSets: ex.defaultSets,
        defaultRepsLow: ex.defaultRepsLow,
        defaultRepsHigh: ex.defaultRepsHigh,
        restSeconds: ex.restSeconds,
      },
    });
    created++;
  }
  const total = await prisma.gymExercise.count();
  console.log(`Upserted ${created} exercises. Catalog total in DB: ${total}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
