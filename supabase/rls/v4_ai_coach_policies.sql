-- HoopMind AI — v4 AI Coach RLS. Run in the Supabase SQL editor.
-- AiConversation is per-user; AiMessage is scoped via its conversation.

-- ===== AiConversation =====
ALTER TABLE "AiConversation" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_conversation_select" ON "AiConversation";
DROP POLICY IF EXISTS "ai_conversation_insert" ON "AiConversation";
DROP POLICY IF EXISTS "ai_conversation_update" ON "AiConversation";
DROP POLICY IF EXISTS "ai_conversation_delete" ON "AiConversation";
CREATE POLICY "ai_conversation_select" ON "AiConversation"
  FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "ai_conversation_insert" ON "AiConversation"
  FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "ai_conversation_update" ON "AiConversation"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());
CREATE POLICY "ai_conversation_delete" ON "AiConversation"
  FOR DELETE USING ("userId" = auth.uid());

-- ===== AiMessage (scoped via parent conversation) =====
ALTER TABLE "AiMessage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_message_all" ON "AiMessage";
CREATE POLICY "ai_message_all" ON "AiMessage"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "AiConversation" c
      WHERE c.id = "AiMessage"."conversationId" AND c."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "AiConversation" c
      WHERE c.id = "AiMessage"."conversationId" AND c."userId" = auth.uid()
    )
  );
