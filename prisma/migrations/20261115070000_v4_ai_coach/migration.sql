-- v4 Fase 4: AI Coach conversations.

CREATE TYPE "CoachSpecialty" AS ENUM ('BASKETBALL','STRENGTH','NUTRITION','GLOWUP','RECOVERY','PERFORMANCE');
CREATE TYPE "AiRole" AS ENUM ('USER','ASSISTANT');

CREATE TABLE "AiConversation" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "specialty" "CoachSpecialty" NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'Conversación',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId","updatedAt");
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AiMessage" (
  "id" UUID NOT NULL,
  "conversationId" UUID NOT NULL,
  "role" "AiRole" NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId","createdAt");
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
