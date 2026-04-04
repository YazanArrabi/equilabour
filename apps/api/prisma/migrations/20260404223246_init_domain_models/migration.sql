-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('entry', 'junior', 'mid', 'senior');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('active', 'closed', 'deleted');

-- CreateEnum
CREATE TYPE "FileAssetType" AS ENUM ('cv', 'certificate', 'recommendation_letter', 'profile_picture', 'logo');

-- CreateEnum
CREATE TYPE "FileOwnerType" AS ENUM ('worker', 'company');

-- CreateEnum
CREATE TYPE "AIAnalysisStatus" AS ENUM ('fresh', 'stale', 'failed');

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "location" TEXT,
    "profilePictureFileId" TEXT,
    "skills" TEXT[],
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "workExperienceSummary" TEXT,
    "pastJobTitles" TEXT[],
    "employmentHistory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT,
    "industry" TEXT,
    "contactInfo" TEXT,
    "overview" TEXT,
    "logoFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "companyProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "salary" TEXT,
    "location" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'active',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "ownerType" "FileOwnerType" NOT NULL,
    "workerProfileId" TEXT,
    "companyProfileId" TEXT,
    "type" "FileAssetType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "isCompanyIssued" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysisResult" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "status" "AIAnalysisStatus" NOT NULL DEFAULT 'fresh',
    "skillSummary" TEXT NOT NULL,
    "skillRating" INTEGER NOT NULL,
    "topSkills" TEXT[],
    "matchRecommendations" JSONB NOT NULL,
    "candidateRecommendations" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_profilePictureFileId_key" ON "WorkerProfile"("profilePictureFileId");

-- CreateIndex
CREATE INDEX "WorkerProfile_fullName_idx" ON "WorkerProfile"("fullName");

-- CreateIndex
CREATE INDEX "WorkerProfile_location_idx" ON "WorkerProfile"("location");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_userId_key" ON "CompanyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_logoFileId_key" ON "CompanyProfile"("logoFileId");

-- CreateIndex
CREATE INDEX "CompanyProfile_companyName_idx" ON "CompanyProfile"("companyName");

-- CreateIndex
CREATE INDEX "CompanyProfile_location_idx" ON "CompanyProfile"("location");

-- CreateIndex
CREATE INDEX "CompanyProfile_industry_idx" ON "CompanyProfile"("industry");

-- CreateIndex
CREATE INDEX "JobPosting_companyProfileId_idx" ON "JobPosting"("companyProfileId");

-- CreateIndex
CREATE INDEX "JobPosting_status_idx" ON "JobPosting"("status");

-- CreateIndex
CREATE INDEX "JobPosting_postedAt_idx" ON "JobPosting"("postedAt" DESC);

-- CreateIndex
CREATE INDEX "JobPosting_location_idx" ON "JobPosting"("location");

-- CreateIndex
CREATE INDEX "JobPosting_employmentType_idx" ON "JobPosting"("employmentType");

-- CreateIndex
CREATE INDEX "JobPosting_experienceLevel_idx" ON "JobPosting"("experienceLevel");

-- CreateIndex
CREATE INDEX "JobApplication_workerProfileId_idx" ON "JobApplication"("workerProfileId");

-- CreateIndex
CREATE INDEX "JobApplication_jobPostingId_idx" ON "JobApplication"("jobPostingId");

-- CreateIndex
CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobPostingId_workerProfileId_key" ON "JobApplication"("jobPostingId", "workerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_s3Key_key" ON "FileAsset"("s3Key");

-- CreateIndex
CREATE INDEX "FileAsset_workerProfileId_idx" ON "FileAsset"("workerProfileId");

-- CreateIndex
CREATE INDEX "FileAsset_companyProfileId_idx" ON "FileAsset"("companyProfileId");

-- CreateIndex
CREATE INDEX "FileAsset_type_idx" ON "FileAsset"("type");

-- CreateIndex
CREATE INDEX "FileAsset_ownerType_idx" ON "FileAsset"("ownerType");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_workerProfileId_idx" ON "AIAnalysisResult"("workerProfileId");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_status_idx" ON "AIAnalysisResult"("status");

-- CreateIndex
CREATE INDEX "AIAnalysisResult_lastAnalyzedAt_idx" ON "AIAnalysisResult"("lastAnalyzedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_profilePictureFileId_fkey" FOREIGN KEY ("profilePictureFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_logoFileId_fkey" FOREIGN KEY ("logoFileId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_companyProfileId_fkey" FOREIGN KEY ("companyProfileId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisResult" ADD CONSTRAINT "AIAnalysisResult_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
