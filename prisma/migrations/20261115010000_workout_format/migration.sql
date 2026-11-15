-- Capture play format on the workout for stats filtering.
ALTER TABLE "Workout" ADD COLUMN "format" "PlayFormat" NOT NULL DEFAULT 'FIVE_V_FIVE';
