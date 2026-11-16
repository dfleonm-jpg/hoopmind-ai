-- HoopMind AI — v4 Life OS RLS. Run in the Supabase SQL editor.
-- PlannerEvent is strictly per-user.

ALTER TABLE "PlannerEvent" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planner_event_select" ON "PlannerEvent";
DROP POLICY IF EXISTS "planner_event_insert" ON "PlannerEvent";
DROP POLICY IF EXISTS "planner_event_update" ON "PlannerEvent";
DROP POLICY IF EXISTS "planner_event_delete" ON "PlannerEvent";
CREATE POLICY "planner_event_select" ON "PlannerEvent"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "planner_event_insert" ON "PlannerEvent"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "planner_event_update" ON "PlannerEvent"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "planner_event_delete" ON "PlannerEvent"
  FOR DELETE USING ("userId" = auth.uid());
