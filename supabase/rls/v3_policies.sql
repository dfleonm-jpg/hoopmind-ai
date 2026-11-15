-- HoopMind AI — v3 Row Level Security policies
-- Run in the Supabase SQL editor. Enables RLS and restricts each row to its owner.
-- CustomPlay / CombineResult own userId directly; SessionReport is scoped via Session.

-- =========================================================
-- CustomPlay (owned directly by userId = auth.uid())
-- =========================================================
ALTER TABLE "CustomPlay" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_play_select" ON "CustomPlay";
DROP POLICY IF EXISTS "custom_play_insert" ON "CustomPlay";
DROP POLICY IF EXISTS "custom_play_update" ON "CustomPlay";
DROP POLICY IF EXISTS "custom_play_delete" ON "CustomPlay";

CREATE POLICY "custom_play_select" ON "CustomPlay"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "custom_play_insert" ON "CustomPlay"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "custom_play_update" ON "CustomPlay"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "custom_play_delete" ON "CustomPlay"
  FOR DELETE USING ("userId" = auth.uid());

-- =========================================================
-- CombineResult (owned directly by userId = auth.uid())
-- =========================================================
ALTER TABLE "CombineResult" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "combine_result_select" ON "CombineResult";
DROP POLICY IF EXISTS "combine_result_insert" ON "CombineResult";
DROP POLICY IF EXISTS "combine_result_update" ON "CombineResult";
DROP POLICY IF EXISTS "combine_result_delete" ON "CombineResult";

CREATE POLICY "combine_result_select" ON "CombineResult"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "combine_result_insert" ON "CombineResult"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "combine_result_update" ON "CombineResult"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "combine_result_delete" ON "CombineResult"
  FOR DELETE USING ("userId" = auth.uid());

-- =========================================================
-- SessionReport (scoped via its parent Session's userId)
-- =========================================================
ALTER TABLE "SessionReport" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "session_report_all" ON "SessionReport";

CREATE POLICY "session_report_all" ON "SessionReport"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Session" s
      WHERE s.id = "SessionReport"."sessionId" AND s."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Session" s
      WHERE s.id = "SessionReport"."sessionId" AND s."userId" = auth.uid()
    )
  );
