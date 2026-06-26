-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN IF NOT EXISTS "answers" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GangApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submitterIp" TEXT,
    "submitterDiscordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GangApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GangApplication_status_idx" ON "GangApplication"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GangApplication_userId_idx" ON "GangApplication"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GangApplication" ADD CONSTRAINT "GangApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "GangApplication" ADD CONSTRAINT "GangApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
