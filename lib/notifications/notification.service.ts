import type {
  Appointment,
  NotificationKind,
  Patient,
  Prisma,
  Service,
  User,
} from "@prisma/client"
import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { prisma } from "@/lib/prisma"

import type { EmailSendResult } from "./email.service"
import {
  sendBookingCancellation,
  sendBookingConfirmation,
  sendBookingReminderJ1,
  sendBookingReminderJ2,
  sendBookingReminderJ3,
} from "./email.service"
import { createNotificationAttempt } from "./notification-tracking.service"
import { isSmsConfigurationError, sendSms } from "./sms.service"
import { REMINDER_KIND_BY_LEVEL, type ReminderLevel } from "./types"

type AppointmentWithRelations = Appointment & {
  patient: Patient
  service: Service
  user: User
}

const TIMEZONE = "Europe/Paris"

function formatDate(date: Date): string {
  return format(new TZDate(date, TIMEZONE), "EEEE d MMMM yyyy", { locale: fr })
}

function formatTime(date: Date): string {
  return format(new TZDate(date, TIMEZONE), "HH'h'mm")
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur inconnue"
}

async function persistNotificationAttempt(
  appointmentId: string,
  params: {
    kind: NotificationKind
    channel: "EMAIL" | "SMS"
    provider: "RESEND" | "SMSMODE"
    recipient: string
    status: "SENT" | "FAILED"
    providerMessageId?: string | null
    providerStatus?: string | null
    errorMessage?: string | null
    metadata?: Prisma.InputJsonValue
  },
): Promise<void> {
  try {
    await createNotificationAttempt(prisma, {
      appointmentId,
      kind: params.kind,
      channel: params.channel,
      provider: params.provider,
      recipient: params.recipient,
      status: params.status,
      providerMessageId: params.providerMessageId,
      providerStatus: params.providerStatus,
      errorMessage: params.errorMessage,
      metadata: params.metadata,
    })
  } catch (error) {
    console.error("Failed to persist notification attempt:", error)
  }
}

async function sendTrackedEmail(params: {
  appointment: AppointmentWithRelations
  kind: NotificationKind
  send: () => Promise<EmailSendResult>
  metadata?: Prisma.InputJsonValue
}): Promise<boolean> {
  const recipient = params.appointment.patient.email
  if (!recipient) return false

  try {
    const result = await params.send()
    await persistNotificationAttempt(params.appointment.id, {
      kind: params.kind,
      channel: "EMAIL",
      provider: "RESEND",
      recipient,
      status: "SENT",
      providerMessageId: result.providerMessageId,
      providerStatus: "accepted",
      metadata: params.metadata,
    })
    return true
  } catch (error) {
    console.error(`Email ${params.kind} failed:`, error)
    await persistNotificationAttempt(params.appointment.id, {
      kind: params.kind,
      channel: "EMAIL",
      provider: "RESEND",
      recipient,
      status: "FAILED",
      errorMessage: getErrorMessage(error),
      metadata: params.metadata,
    })
    return false
  }
}

async function sendTrackedSms(params: {
  appointment: AppointmentWithRelations
  kind: NotificationKind
  message: string
  refClient: string
  metadata?: Prisma.InputJsonValue
}): Promise<boolean> {
  const recipient = params.appointment.patient.phone
  if (!recipient) return false

  try {
    const result = await sendSms({
      to: recipient,
      message: params.message,
      refClient: params.refClient,
      callbackUrlStatus: process.env.SMSMODE_STATUS_CALLBACK_URL ?? undefined,
    })
    await persistNotificationAttempt(params.appointment.id, {
      kind: params.kind,
      channel: "SMS",
      provider: "SMSMODE",
      recipient,
      status: result.accepted ? "SENT" : "FAILED",
      providerMessageId: result.providerMessageId,
      providerStatus: result.accepted ? "accepted" : null,
      errorMessage: result.accepted
        ? null
        : "SMS non accepte par le fournisseur",
      metadata: params.metadata,
    })
    return result.accepted
  } catch (error) {
    if (!isSmsConfigurationError(error)) {
      console.error(`SMS ${params.kind} failed:`, error)
    }
    await persistNotificationAttempt(params.appointment.id, {
      kind: params.kind,
      channel: "SMS",
      provider: "SMSMODE",
      recipient,
      status: "FAILED",
      errorMessage: getErrorMessage(error),
      metadata: params.metadata,
    })
    return false
  }
}

export async function notifyBookingReminder(
  appointment: AppointmentWithRelations,
  level: ReminderLevel,
): Promise<{ emailSent: boolean; smsSent: boolean }> {
  const date = formatDate(appointment.start)
  const time = formatTime(appointment.start)
  const kind = REMINDER_KIND_BY_LEVEL[level]
  const practitionerName =
    appointment.user.companyName || appointment.user.name || "votre praticien"

  const emailParams = {
    to: appointment.patient.email!,
    patientFirstName: appointment.patient.firstName,
    practitionerName,
    serviceName: appointment.service.name,
    date,
    time,
    duration: appointment.service.duration,
  }

  const smsMessages: Record<ReminderLevel, string> = {
    J3: `Rappel ${practitionerName} : RDV ${appointment.service.name} dans 3 jours, le ${date} a ${time}.`,
    J2: `Rappel ${practitionerName} : RDV ${appointment.service.name} apres-demain a ${time}.`,
    J1: `Rappel ${practitionerName} : RDV ${appointment.service.name} demain a ${time}.`,
    H1: `Rappel : votre RDV ${appointment.service.name} est dans 1h avec ${practitionerName}.`,
  }

  const emailFns: Record<
    ReminderLevel,
    (() => Promise<EmailSendResult>) | null
  > = {
    J3: () => sendBookingReminderJ3(emailParams),
    J2: () => sendBookingReminderJ2(emailParams),
    J1: () => sendBookingReminderJ1(emailParams),
    H1: null, // H-1 : SMS uniquement
  }

  let emailSent = false
  let smsSent = false

  const emailFn = emailFns[level]
  if (emailFn && appointment.patient.email) {
    emailSent = await sendTrackedEmail({
      appointment,
      kind,
      metadata: { level },
      send: emailFn,
    })
  }

  if (appointment.patient.phone) {
    smsSent = await sendTrackedSms({
      appointment,
      kind,
      message: smsMessages[level],
      refClient: `${appointment.id}:reminder_${level.toLowerCase()}`,
      metadata: { level },
    })
  }

  return { emailSent, smsSent }
}

export async function notifyBookingConfirmation(
  appointment: AppointmentWithRelations,
): Promise<void> {
  const date = formatDate(appointment.start)
  const time = formatTime(appointment.start)
  const practitionerName =
    appointment.user.companyName || appointment.user.name || "votre praticien"

  const emailPromise = appointment.patient.email
    ? sendTrackedEmail({
        appointment,
        kind: "BOOKING_CONFIRMATION",
        send: () =>
          sendBookingConfirmation({
            to: appointment.patient.email!,
            patientFirstName: appointment.patient.firstName,
            practitionerName,
            serviceName: appointment.service.name,
            date,
            time,
            duration: appointment.service.duration,
          }),
      })
    : Promise.resolve(false)

  const smsPromise = appointment.patient.phone
    ? sendTrackedSms({
        appointment,
        kind: "BOOKING_CONFIRMATION",
        message: `${practitionerName} - RDV confirme : ${appointment.service.name} le ${date} a ${time}.`,
        refClient: `${appointment.id}:booking_confirmation`,
      })
    : Promise.resolve(false)

  await Promise.allSettled([emailPromise, smsPromise])
}

export async function notifyBookingCancellation(
  appointment: AppointmentWithRelations,
): Promise<void> {
  const date = formatDate(appointment.start)
  const time = formatTime(appointment.start)
  const practitionerName =
    appointment.user.companyName || appointment.user.name || "votre praticien"

  const emailPromise = appointment.patient.email
    ? sendTrackedEmail({
        appointment,
        kind: "BOOKING_CANCELLATION",
        send: () =>
          sendBookingCancellation({
            to: appointment.patient.email!,
            patientFirstName: appointment.patient.firstName,
            practitionerName,
            serviceName: appointment.service.name,
            date,
            time,
          }),
      })
    : Promise.resolve(false)

  const smsPromise = appointment.patient.phone
    ? sendTrackedSms({
        appointment,
        kind: "BOOKING_CANCELLATION",
        message: `${practitionerName} - RDV ${appointment.service.name} du ${date} annule.`,
        refClient: `${appointment.id}:booking_cancellation`,
      })
    : Promise.resolve(false)

  await Promise.allSettled([emailPromise, smsPromise])
}
