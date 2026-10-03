ALTER TABLE "bookings" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "technician_profiles"
    ALTER COLUMN "experienceYears" SET DEFAULT 0,
    ALTER COLUMN "rating" SET DEFAULT 0.0;

CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "chat_messages_threadId_createdAt_idx" ON "chat_messages"("threadId", "createdAt");
