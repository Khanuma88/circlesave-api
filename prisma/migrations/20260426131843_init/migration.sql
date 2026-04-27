-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CircleStatus" AS ENUM ('FORMING', 'ACTIVE', 'RUNNING', 'COMPLETED', 'FROZEN');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEFAULTED', 'EXITED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL_50', 'PARTIAL_70', 'PAID', 'DEFAULTED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('MEMBER_RECEIVABLE', 'CIRCLE_POT', 'LATE_FEE_INCOME', 'ORGANIZER_PAYABLE', 'BANK_COMMISSION');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "trustScore" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "verifiedPhone" BOOLEAN NOT NULL DEFAULT false,
    "verifiedId" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contributionAmount" DECIMAL(12,2) NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "status" "CircleStatus" NOT NULL DEFAULT 'FORMING',
    "startDate" TIMESTAMP(3),
    "cycleLengthDays" INTEGER NOT NULL DEFAULT 30,
    "organizerId" TEXT NOT NULL,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_memberships" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionInRotation" INTEGER NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),

    CONSTRAINT "circle_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT,
    "entryType" "LedgerType" NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "description" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "circleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lateFeeAccrued" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_trustScore_idx" ON "users"("trustScore");

-- CreateIndex
CREATE INDEX "circles_status_idx" ON "circles"("status");

-- CreateIndex
CREATE INDEX "circles_organizerId_idx" ON "circles"("organizerId");

-- CreateIndex
CREATE INDEX "circle_memberships_circleId_positionInRotation_idx" ON "circle_memberships"("circleId", "positionInRotation");

-- CreateIndex
CREATE INDEX "circle_memberships_userId_status_idx" ON "circle_memberships"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "circle_memberships_circleId_userId_key" ON "circle_memberships"("circleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_idempotencyKey_key" ON "ledger_entries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_circleId_account_createdAt_idx" ON "ledger_entries"("circleId", "account", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_userId_createdAt_idx" ON "ledger_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_idempotencyKey_idx" ON "ledger_entries"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_status_dueDate_idx" ON "payments"("status", "dueDate");

-- CreateIndex
CREATE INDEX "payments_circleId_cycleNumber_idx" ON "payments"("circleId", "cycleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_circleId_userId_cycleNumber_key" ON "payments"("circleId", "userId", "cycleNumber");

-- AddForeignKey
ALTER TABLE "circles" ADD CONSTRAINT "circles_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_memberships" ADD CONSTRAINT "circle_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
