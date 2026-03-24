CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "User"
ADD COLUMN "aiFeaturesConsentAt" TIMESTAMP(3);

CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitBucket_scope_key_windowStart_key"
ON "RateLimitBucket"("scope", "key", "windowStart");

CREATE INDEX "RateLimitBucket_scope_windowStart_idx"
ON "RateLimitBucket"("scope", "windowStart");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Appointment" a
    JOIN "Patient" p ON p."id" = a."patientId"
    WHERE p."userId" <> a."userId"
  ) THEN
    RAISE EXCEPTION 'Cross-tenant Appointment -> Patient links detected. Fix data before applying migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Appointment" a
    JOIN "Service" s ON s."id" = a."serviceId"
    WHERE s."userId" <> a."userId"
  ) THEN
    RAISE EXCEPTION 'Cross-tenant Appointment -> Service links detected. Fix data before applying migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Invoice" i
    JOIN "Patient" p ON p."id" = i."patientId"
    WHERE p."userId" <> i."userId"
  ) THEN
    RAISE EXCEPTION 'Cross-tenant Invoice -> Patient links detected. Fix data before applying migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Invoice" i
    JOIN "Appointment" a ON a."id" = i."appointmentId"
    WHERE i."appointmentId" IS NOT NULL
      AND a."userId" <> i."userId"
  ) THEN
    RAISE EXCEPTION 'Cross-tenant Invoice -> Appointment links detected. Fix data before applying migration.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Appointment" a1
    JOIN "Appointment" a2
      ON a1."id" <> a2."id"
     AND a1."userId" = a2."userId"
     AND a1."status" <> 'CANCELED'
     AND a2."status" <> 'CANCELED'
     AND tsrange(a1."start", a1."end", '[)') && tsrange(a2."start", a2."end", '[)')
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'Overlapping appointments detected. Resolve overlaps before applying exclusion constraint.';
  END IF;
END $$;

CREATE UNIQUE INDEX "Patient_id_userId_key" ON "Patient"("id", "userId");
CREATE UNIQUE INDEX "Service_id_userId_key" ON "Service"("id", "userId");
CREATE UNIQUE INDEX "Appointment_id_userId_key" ON "Appointment"("id", "userId");
CREATE UNIQUE INDEX "Invoice_id_userId_key" ON "Invoice"("id", "userId");
CREATE UNIQUE INDEX "Invoice_appointmentId_userId_key" ON "Invoice"("appointmentId", "userId");

ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_serviceId_fkey";
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_patientId_fkey";
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_appointmentId_fkey";

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_patientId_userId_fkey"
FOREIGN KEY ("patientId", "userId") REFERENCES "Patient"("id", "userId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_serviceId_userId_fkey"
FOREIGN KEY ("serviceId", "userId") REFERENCES "Service"("id", "userId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_patientId_userId_fkey"
FOREIGN KEY ("patientId", "userId") REFERENCES "Patient"("id", "userId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_appointmentId_userId_fkey"
FOREIGN KEY ("appointmentId", "userId") REFERENCES "Appointment"("id", "userId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_no_overlap"
EXCLUDE USING GIST (
  "userId" WITH =,
  tsrange("start", "end", '[)') WITH &&
)
WHERE ("status" <> 'CANCELED');
