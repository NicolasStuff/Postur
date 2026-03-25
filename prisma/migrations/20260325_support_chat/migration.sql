CREATE TYPE "SupportConversationStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "SupportAuthorType" AS ENUM ('USER', 'ADMIN');

CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "lastUserMessageAt" TIMESTAMP(3) NOT NULL,
    "lastAdminMessageAt" TIMESTAMP(3),
    "lastReadByUserAt" TIMESTAMP(3) NOT NULL,
    "lastReadByAdminAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorType" "SupportAuthorType" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportConversation_requesterUserId_key" ON "SupportConversation"("requesterUserId");
CREATE INDEX "SupportConversation_requesterUserId_updatedAt_idx" ON "SupportConversation"("requesterUserId", "updatedAt");
CREATE INDEX "SupportConversation_status_updatedAt_idx" ON "SupportConversation"("status", "updatedAt");
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");
CREATE INDEX "SupportMessage_authorUserId_createdAt_idx" ON "SupportMessage"("authorUserId", "createdAt");

ALTER TABLE "SupportConversation"
ADD CONSTRAINT "SupportConversation_requesterUserId_fkey"
FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SupportMessage"
ADD CONSTRAINT "SupportMessage_authorUserId_fkey"
FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
