-- HoopMind AI — v4 Nutrition RLS policies. Run in the Supabase SQL editor.
-- NutritionGoal / FoodLog / HydrationLog are strictly per-user.

-- ===== NutritionGoal =====
ALTER TABLE "NutritionGoal" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nutrition_goal_select" ON "NutritionGoal";
DROP POLICY IF EXISTS "nutrition_goal_insert" ON "NutritionGoal";
DROP POLICY IF EXISTS "nutrition_goal_update" ON "NutritionGoal";
DROP POLICY IF EXISTS "nutrition_goal_delete" ON "NutritionGoal";
CREATE POLICY "nutrition_goal_select" ON "NutritionGoal"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "nutrition_goal_insert" ON "NutritionGoal"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "nutrition_goal_update" ON "NutritionGoal"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "nutrition_goal_delete" ON "NutritionGoal"
  FOR DELETE USING ("userId" = auth.uid());

-- ===== FoodLog =====
ALTER TABLE "FoodLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "food_log_select" ON "FoodLog";
DROP POLICY IF EXISTS "food_log_insert" ON "FoodLog";
DROP POLICY IF EXISTS "food_log_update" ON "FoodLog";
DROP POLICY IF EXISTS "food_log_delete" ON "FoodLog";
CREATE POLICY "food_log_select" ON "FoodLog"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "food_log_insert" ON "FoodLog"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "food_log_update" ON "FoodLog"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "food_log_delete" ON "FoodLog"
  FOR DELETE USING ("userId" = auth.uid());

-- ===== HydrationLog =====
ALTER TABLE "HydrationLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hydration_log_select" ON "HydrationLog";
DROP POLICY IF EXISTS "hydration_log_insert" ON "HydrationLog";
DROP POLICY IF EXISTS "hydration_log_delete" ON "HydrationLog";
CREATE POLICY "hydration_log_select" ON "HydrationLog"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "hydration_log_insert" ON "HydrationLog"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "hydration_log_delete" ON "HydrationLog"
  FOR DELETE USING ("userId" = auth.uid());
