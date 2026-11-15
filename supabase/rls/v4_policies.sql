-- HoopMind AI — v4 Row Level Security policies (Body Transformation)
-- Run in the Supabase SQL editor.
-- GymExercise is a SHARED read-only catalog (seeded server-side).
-- GymSession / GymSetLog / BodyMeasurement are strictly per-user.

-- =========================================================
-- GymExercise — shared catalog: readable by any authenticated user.
-- Writes happen only via the service role (seed), which bypasses RLS.
-- =========================================================
ALTER TABLE "GymExercise" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gym_exercise_read" ON "GymExercise";
CREATE POLICY "gym_exercise_read" ON "GymExercise"
  FOR SELECT USING (auth.role() = 'authenticated');

-- =========================================================
-- GymSession (owned by userId = auth.uid())
-- =========================================================
ALTER TABLE "GymSession" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gym_session_select" ON "GymSession";
DROP POLICY IF EXISTS "gym_session_insert" ON "GymSession";
DROP POLICY IF EXISTS "gym_session_update" ON "GymSession";
DROP POLICY IF EXISTS "gym_session_delete" ON "GymSession";

CREATE POLICY "gym_session_select" ON "GymSession"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "gym_session_insert" ON "GymSession"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "gym_session_update" ON "GymSession"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "gym_session_delete" ON "GymSession"
  FOR DELETE USING ("userId" = auth.uid());

-- =========================================================
-- GymSetLog (scoped via its parent GymSession's userId)
-- =========================================================
ALTER TABLE "GymSetLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gym_set_log_all" ON "GymSetLog";
CREATE POLICY "gym_set_log_all" ON "GymSetLog"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "GymSession" s
      WHERE s.id = "GymSetLog"."sessionId" AND s."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "GymSession" s
      WHERE s.id = "GymSetLog"."sessionId" AND s."userId" = auth.uid()
    )
  );

-- =========================================================
-- BodyMeasurement (owned by userId = auth.uid()) — sensitive body data
-- =========================================================
ALTER TABLE "BodyMeasurement" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "body_measurement_select" ON "BodyMeasurement";
DROP POLICY IF EXISTS "body_measurement_insert" ON "BodyMeasurement";
DROP POLICY IF EXISTS "body_measurement_update" ON "BodyMeasurement";
DROP POLICY IF EXISTS "body_measurement_delete" ON "BodyMeasurement";

CREATE POLICY "body_measurement_select" ON "BodyMeasurement"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "body_measurement_insert" ON "BodyMeasurement"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "body_measurement_update" ON "BodyMeasurement"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "body_measurement_delete" ON "BodyMeasurement"
  FOR DELETE USING ("userId" = auth.uid());
