-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationProvider" AS ENUM ('RESEND', 'SMSMODE');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION', 'REMINDER_J3', 'REMINDER_J2', 'REMINDER_J1', 'REMINDER_H1');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('CREATED', 'SENT', 'ENROUTE', 'DELIVERED', 'DELIVERY_DELAYED', 'FAILED', 'BOUNCED', 'UNDELIVERABLE', 'UNDELIVERED', 'COMPLAINED', 'SUPPRESSED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ScheduleExceptionType" AS ENUM ('ADDED', 'BLOCKED');

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'CANCELLED';

-- DropIndex
DROP INDEX "Invoice_appointmentId_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderH1SentAt" TIMESTAMPTZ(3),
ADD COLUMN     "reminderJ1SentAt" TIMESTAMPTZ(3),
ADD COLUMN     "reminderJ2SentAt" TIMESTAMPTZ(3),
ADD COLUMN     "reminderJ3SentAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "AppointmentNotification" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" "NotificationProvider" NOT NULL,
    "recipient" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'CREATED',
    "providerStatus" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "failedAt" TIMESTAMPTZ(3),
    "lastEventAt" TIMESTAMPTZ(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AppointmentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentNotificationEvent" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "source" "NotificationProvider" NOT NULL,
    "externalEventType" TEXT NOT NULL,
    "externalStatus" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentNotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "ScheduleExceptionType" NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentNotification_appointmentId_kind_channel_idx" ON "AppointmentNotification"("appointmentId", "kind", "channel");

-- CreateIndex
CREATE INDEX "AppointmentNotification_status_idx" ON "AppointmentNotification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentNotification_provider_providerMessageId_key" ON "AppointmentNotification"("provider", "providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentNotificationEvent_dedupeKey_key" ON "AppointmentNotificationEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "AppointmentNotificationEvent_notificationId_receivedAt_idx" ON "AppointmentNotificationEvent"("notificationId", "receivedAt");

-- CreateIndex
CREATE INDEX "ScheduleException_userId_date_idx" ON "ScheduleException"("userId", "date");

-- CreateIndex
CREATE INDEX "ScheduleException_userId_type_date_idx" ON "ScheduleException"("userId", "type", "date");

-- CreateIndex
CREATE INDEX "Patient_userId_idx" ON "Patient"("userId");

-- AddForeignKey
ALTER TABLE "AppointmentNotification" ADD CONSTRAINT "AppointmentNotification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentNotificationEvent" ADD CONSTRAINT "AppointmentNotificationEvent_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "AppointmentNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
