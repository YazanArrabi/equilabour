-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN "payMax" INTEGER;
ALTER TABLE "JobPosting" ADD COLUMN "payMin" INTEGER;

-- CreateIndex
CREATE INDEX "JobPosting_payMin_idx" ON "JobPosting"("payMin");

-- CreateIndex
CREATE INDEX "JobPosting_payMax_idx" ON "JobPosting"("payMax");
