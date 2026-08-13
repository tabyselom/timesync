-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "workspaceId" TEXT;

-- CreateIndex
CREATE INDEX "RefreshToken_workspaceId_idx" ON "RefreshToken"("workspaceId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
