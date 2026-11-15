-- HoopMind AI — v4 Fase 6 RLS + Storage. Run in the Supabase SQL editor.
-- Tables: PlyoSession, ProgressPhoto (per-user). Storage bucket: progress-photos.
-- (Anthropometry fields live on Profile, already covered by Profile RLS.)

-- ===== PlyoSession =====
ALTER TABLE "PlyoSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plyo_session_select" ON "PlyoSession";
DROP POLICY IF EXISTS "plyo_session_insert" ON "PlyoSession";
DROP POLICY IF EXISTS "plyo_session_delete" ON "PlyoSession";
CREATE POLICY "plyo_session_select" ON "PlyoSession"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "plyo_session_insert" ON "PlyoSession"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "plyo_session_delete" ON "PlyoSession"
  FOR DELETE USING ("userId" = auth.uid());

-- ===== ProgressPhoto (metadata; sensitive) =====
ALTER TABLE "ProgressPhoto" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_photo_select" ON "ProgressPhoto";
DROP POLICY IF EXISTS "progress_photo_insert" ON "ProgressPhoto";
DROP POLICY IF EXISTS "progress_photo_delete" ON "ProgressPhoto";
CREATE POLICY "progress_photo_select" ON "ProgressPhoto"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "progress_photo_insert" ON "ProgressPhoto"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "progress_photo_delete" ON "ProgressPhoto"
  FOR DELETE USING ("userId" = auth.uid());

-- ============================================================
-- Storage: private bucket "progress-photos"
-- ============================================================
-- 1) Create the PRIVATE bucket (id = name = 'progress-photos'):
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 2) Per-user object policies: a user can only touch files whose path
--    starts with their own uid, i.e. objects under "{uid}/...".
DROP POLICY IF EXISTS "progress_photos_read_own" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_delete_own" ON storage.objects;

CREATE POLICY "progress_photos_read_own" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "progress_photos_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "progress_photos_delete_own" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
