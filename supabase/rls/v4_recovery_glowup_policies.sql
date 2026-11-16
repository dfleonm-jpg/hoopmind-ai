-- HoopMind AI — v4 Recovery & Glow Up RLS. Run in the Supabase SQL editor.
-- RecoveryLog / Habit / HabitLog / CareRoutine are strictly per-user (sensitive).

-- ===== RecoveryLog =====
ALTER TABLE "RecoveryLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recovery_log_select" ON "RecoveryLog";
DROP POLICY IF EXISTS "recovery_log_insert" ON "RecoveryLog";
DROP POLICY IF EXISTS "recovery_log_delete" ON "RecoveryLog";
CREATE POLICY "recovery_log_select" ON "RecoveryLog"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "recovery_log_insert" ON "RecoveryLog"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "recovery_log_delete" ON "RecoveryLog"
  FOR DELETE USING ("userId" = auth.uid());

-- ===== Habit =====
ALTER TABLE "Habit" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "habit_select" ON "Habit";
DROP POLICY IF EXISTS "habit_insert" ON "Habit";
DROP POLICY IF EXISTS "habit_update" ON "Habit";
DROP POLICY IF EXISTS "habit_delete" ON "Habit";
CREATE POLICY "habit_select" ON "Habit"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "habit_insert" ON "Habit"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "habit_update" ON "Habit"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "habit_delete" ON "Habit"
  FOR DELETE USING ("userId" = auth.uid());

-- ===== HabitLog =====
ALTER TABLE "HabitLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "habit_log_all" ON "HabitLog";
CREATE POLICY "habit_log_all" ON "HabitLog"
  FOR ALL USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());

-- ===== CareRoutine =====
ALTER TABLE "CareRoutine" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "care_routine_select" ON "CareRoutine";
DROP POLICY IF EXISTS "care_routine_insert" ON "CareRoutine";
DROP POLICY IF EXISTS "care_routine_update" ON "CareRoutine";
DROP POLICY IF EXISTS "care_routine_delete" ON "CareRoutine";
CREATE POLICY "care_routine_select" ON "CareRoutine"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "care_routine_insert" ON "CareRoutine"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "care_routine_update" ON "CareRoutine"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "care_routine_delete" ON "CareRoutine"
  FOR DELETE USING ("userId" = auth.uid());
