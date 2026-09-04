-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'DEEMED', 'DNB');

-- CreateEnum
CREATE TYPE "QuotaType" AS ENUM ('AIQ', 'STATE', 'DEEMED', 'MANAGEMENT', 'NRI', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('GENERAL', 'EWS', 'OBC', 'SC', 'ST');

-- CreateEnum
CREATE TYPE "SubCategory" AS ENUM ('NONE', 'PWD', 'ARMED_FORCES', 'NRI', 'MANAGEMENT', 'MINORITY');

-- CreateEnum
CREATE TYPE "PreferredCollegeType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'DEEMED', 'DNB', 'ANY');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Likelihood" AS ENUM ('STRONG', 'MODERATE', 'STRETCH', 'VERY_DIFFICULT');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PREVIEW', 'UNLOCKED');

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'CONSUMPTION', 'REFUND', 'BONUS', 'ADMIN_ADJUSTMENT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'ATTEMPTED', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "defaultState" TEXT,
    "defaultCategory" "Category",
    "defaultSubCategory" "SubCategory" DEFAULT 'NONE',
    "gender" "Gender",
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_credits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "purchased" INTEGER NOT NULL DEFAULT 0,
    "used" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prediction_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "paymentId" TEXT,
    "predictionId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "creditsSold" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "method" TEXT,
    "errorCode" TEXT,
    "errorDescription" TEXT,
    "receipt" TEXT,
    "notes" JSONB,
    "refundedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "state" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "subCategory" "SubCategory" NOT NULL DEFAULT 'NONE',
    "correctAnswers" INTEGER NOT NULL,
    "wrongAnswers" INTEGER NOT NULL,
    "unattempted" INTEGER NOT NULL DEFAULT 0,
    "expectedScore" INTEGER NOT NULL,
    "preferredType" "PreferredCollegeType" NOT NULL DEFAULT 'ANY',
    "rankMin" INTEGER NOT NULL,
    "rankMax" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "percentile" DOUBLE PRECISION,
    "aiqOpportunities" INTEGER NOT NULL DEFAULT 0,
    "stateOpportunities" INTEGER NOT NULL DEFAULT 0,
    "totalOpportunities" INTEGER NOT NULL DEFAULT 0,
    "resultPayload" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL DEFAULT 'rule-based-v1',
    "providerId" TEXT NOT NULL DEFAULT 'rule-based',
    "status" "PredictionStatus" NOT NULL DEFAULT 'PREVIEW',
    "unlockedAt" TIMESTAMP(3),
    "examYear" INTEGER NOT NULL DEFAULT 2025,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dream_validations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" TEXT,
    "dreamBranch" TEXT NOT NULL,
    "dreamCollege" TEXT,
    "collegeId" TEXT,
    "branchProbability" INTEGER NOT NULL,
    "branchLikelihood" "Likelihood" NOT NULL,
    "branchMessage" TEXT NOT NULL,
    "collegeLikelihood" "Likelihood",
    "requiredRankMin" INTEGER,
    "requiredRankMax" INTEGER,
    "studentRankMin" INTEGER,
    "studentRankMax" INTEGER,
    "eligibleQuotas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availableBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collegeMessage" TEXT,
    "resultPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dream_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" TEXT,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "error" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_database" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "slug" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "type" "CollegeType" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "university" TEXT,
    "establishedYear" INTEGER,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_database" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "degree" TEXT NOT NULL DEFAULT 'MD',
    "isClinical" BOOLEAN NOT NULL DEFAULT true,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_database_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_seats" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quota" "QuotaType" NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "academicYear" INTEGER NOT NULL,

    CONSTRAINT "college_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_cutoffs" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "quota" "QuotaType" NOT NULL,
    "category" "Category" NOT NULL,
    "subCategory" "SubCategory" NOT NULL DEFAULT 'NONE',
    "closingRank" INTEGER NOT NULL,
    "openingRank" INTEGER,
    "closingScore" INTEGER,
    "seatCount" INTEGER NOT NULL DEFAULT 0,
    "round" INTEGER NOT NULL DEFAULT 1,
    "academicYear" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "source" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historical_cutoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_rules" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "quota" "QuotaType" NOT NULL,
    "category" "Category",
    "reservationPct" DOUBLE PRECISION,
    "requiresDomicile" BOOLEAN NOT NULL DEFAULT true,
    "seatSharePct" DOUBLE PRECISION,
    "notes" TEXT,
    "academicYear" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quota_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_threads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictionId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Counseling chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_expires_idx" ON "verification_tokens"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_userId_key" ON "admin_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_credits_userId_key" ON "prediction_credits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transactions_idempotencyKey_key" ON "credit_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayOrderId_key" ON "payments"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayPaymentId_key" ON "payments"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payments_userId_createdAt_idx" ON "payments"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "predictions_userId_createdAt_idx" ON "predictions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "predictions_status_idx" ON "predictions"("status");

-- CreateIndex
CREATE INDEX "predictions_state_category_idx" ON "predictions"("state", "category");

-- CreateIndex
CREATE INDEX "dream_validations_userId_createdAt_idx" ON "dream_validations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "dream_validations_dreamBranch_idx" ON "dream_validations"("dreamBranch");

-- CreateIndex
CREATE INDEX "reports_userId_createdAt_idx" ON "reports"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "reports_predictionId_idx" ON "reports"("predictionId");

-- CreateIndex
CREATE UNIQUE INDEX "college_database_slug_key" ON "college_database"("slug");

-- CreateIndex
CREATE INDEX "college_database_state_idx" ON "college_database"("state");

-- CreateIndex
CREATE INDEX "college_database_type_idx" ON "college_database"("type");

-- CreateIndex
CREATE INDEX "college_database_name_idx" ON "college_database"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branch_database_name_key" ON "branch_database"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branch_database_slug_key" ON "branch_database"("slug");

-- CreateIndex
CREATE INDEX "branch_database_popularity_idx" ON "branch_database"("popularity");

-- CreateIndex
CREATE INDEX "college_seats_collegeId_idx" ON "college_seats"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "college_seats_collegeId_branchId_quota_academicYear_key" ON "college_seats"("collegeId", "branchId", "quota", "academicYear");

-- CreateIndex
CREATE INDEX "historical_cutoffs_academicYear_quota_category_idx" ON "historical_cutoffs"("academicYear", "quota", "category");

-- CreateIndex
CREATE INDEX "historical_cutoffs_closingRank_idx" ON "historical_cutoffs"("closingRank");

-- CreateIndex
CREATE INDEX "historical_cutoffs_state_quota_category_idx" ON "historical_cutoffs"("state", "quota", "category");

-- CreateIndex
CREATE INDEX "historical_cutoffs_branchId_closingRank_idx" ON "historical_cutoffs"("branchId", "closingRank");

-- CreateIndex
CREATE UNIQUE INDEX "historical_cutoffs_collegeId_branchId_quota_category_subCat_key" ON "historical_cutoffs"("collegeId", "branchId", "quota", "category", "subCategory", "round", "academicYear");

-- CreateIndex
CREATE INDEX "quota_rules_state_idx" ON "quota_rules"("state");

-- CreateIndex
CREATE UNIQUE INDEX "quota_rules_state_quota_category_academicYear_key" ON "quota_rules"("state", "quota", "category", "academicYear");

-- CreateIndex
CREATE INDEX "assistant_threads_userId_updatedAt_idx" ON "assistant_threads"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "assistant_messages_threadId_createdAt_idx" ON "assistant_messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_createdAt_idx" ON "webhook_events"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_credits" ADD CONSTRAINT "prediction_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dream_validations" ADD CONSTRAINT "dream_validations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dream_validations" ADD CONSTRAINT "dream_validations_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dream_validations" ADD CONSTRAINT "dream_validations_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "college_database"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_seats" ADD CONSTRAINT "college_seats_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "college_database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_seats" ADD CONSTRAINT "college_seats_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch_database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_cutoffs" ADD CONSTRAINT "historical_cutoffs_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "college_database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_cutoffs" ADD CONSTRAINT "historical_cutoffs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branch_database"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "predictions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistant_messages" ADD CONSTRAINT "assistant_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "assistant_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

