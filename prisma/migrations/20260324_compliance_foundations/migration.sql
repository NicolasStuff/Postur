-- Add AI beta controls on users
ALTER TABLE "User"
ADD COLUMN "aiBetaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "aiComplianceAcceptedAt" TIMESTAMP(3),
ADD COLUMN "aiComplianceVersion" TEXT;

-- Enums for invoice structuring / Factur-X readiness
CREATE TYPE "InvoiceBuyerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');
CREATE TYPE "FacturXProfile" AS ENUM ('BASIC', 'EN16931');
CREATE TYPE "FacturXStatus" AS ENUM ('INCOMPLETE', 'BASIC_READY', 'EN16931_CANDIDATE');

-- Add invoice structuring fields
ALTER TABLE "Invoice"
ADD COLUMN "serviceDate" TIMESTAMP(3),
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN "paymentTerms" TEXT NOT NULL DEFAULT 'Paiement comptant',
ADD COLUMN "buyerType" "InvoiceBuyerType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN "buyerCompanyName" TEXT,
ADD COLUMN "buyerSiren" TEXT,
ADD COLUMN "buyerVatNumber" TEXT,
ADD COLUMN "lineItems" JSONB,
ADD COLUMN "facturXProfile" "FacturXProfile",
ADD COLUMN "facturXStatus" "FacturXStatus" NOT NULL DEFAULT 'INCOMPLETE',
ADD COLUMN "facturXXml" TEXT;

-- Best-effort backfill for existing invoices
UPDATE "Invoice"
SET
  "serviceDate" = COALESCE("serviceDate", "date"),
  "dueDate" = COALESCE("dueDate", "date"),
  "lineItems" = COALESCE(
    "lineItems",
    jsonb_build_array(
      jsonb_build_object(
        'label', COALESCE(NULLIF("serviceName", ''), 'Consultation'),
        'quantity', 1,
        'unitPriceInclTax', "amount",
        'unitPriceExclTax', COALESCE(("amount" - COALESCE("vatAmount", 0)), "amount"),
        'totalInclTax', "amount",
        'totalExclTax', COALESCE(("amount" - COALESCE("vatAmount", 0)), "amount"),
        'vatRate', "vatRate"
      )
    )
  );

-- Audit events
CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "domain" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");
CREATE INDEX "AuditEvent_domain_createdAt_idx" ON "AuditEvent"("domain", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
