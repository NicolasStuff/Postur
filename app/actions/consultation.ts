"use server"

import { z } from "zod"
import { canAccessFeature } from "@/app/actions/subscription"
import { openAIClinicalGenerationProvider } from "@/lib/ai/openai"
import { AI_BETA_COMPLIANCE_VERSION, assertAiBetaEnabled } from "@/lib/ai-beta"
import { recordAuditEventSafe } from "@/lib/audit"
import { bodyPartLabels, normalizeBodyChartPartIds } from "@/lib/bodyChartLabels"
import {
  calculateInvoiceAmounts,
  formatDateInputValue,
  getBillingProfileStatus as getBillingProfileStatusFromProfile,
  parseDateInputValue,
} from "@/lib/billing"
import {
  normalizeConsultationContent,
  serializeConsultationContent,
} from "@/lib/consultation-note"
import { applyConsultationContentPatch, applyConsultationContentPatchInTransaction } from "@/lib/consultation-note-store"
import { requireCoreAppAccess } from "@/lib/core-access"
import {
  assertBillingProfileReady,
  buildInvoicePatientSnapshot,
  buildStructuredInvoiceArtifacts,
  getNextInvoiceNumber,
  invoiceIssuerSelect,
  serializeIssuerSnapshot,
} from "@/lib/invoice-builder"
import { prisma } from "@/lib/prisma"
import { getErrorMessage } from "@/lib/i18n/errors"
import { Prisma } from "@prisma/client"

async function ensureAppointmentCanBeBilled(
  appointment: { status: string; start: Date },
  issuedAt: Date
) {
  if (
    appointment.status === "CANCELED" ||
    appointment.status === "NOSHOW" ||
    appointment.start > issuedAt
  ) {
    throw new Error(await getErrorMessage("consultationCannotBeBilled"))
  }
}

export async function getConsultations() {
  const userId = await requireCoreAppAccess()

  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
    },
    include: {
      patient: true,
      note: true,
      service: true,
      invoice: {
        select: {
          id: true,
          number: true,
          status: true,
        },
      },
    },
    orderBy: { start: "desc" },
  })

  return appointments.map((appointment) => ({
    ...appointment,
    service: {
      ...appointment.service,
      price: appointment.service.price.toNumber(),
    },
  }))
}

export async function getConsultation(appointmentId: string) {
  const userId = await requireCoreAppAccess()

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    include: {
      note: true,
      invoice: {
        select: {
          id: true,
          number: true,
          status: true,
        },
      },
      notifications: {
        select: {
          id: true,
          kind: true,
          channel: true,
          provider: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          errorMessage: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      patient: {
        include: {
          appointments: {
            orderBy: { start: "desc" },
            take: 5,
            select: {
              id: true,
              start: true,
              end: true,
              status: true,
              completedAt: true,
              note: {
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                  duration: true,
                  price: true,
                },
              },
            },
          },
        },
      },
      user: {
        select: {
          practitionerType: true,
          name: true,
        },
      },
      service: true,
    },
  })

  if (!appointment) return null

  return {
    ...appointment,
    note: appointment.note
      ? {
          ...appointment.note,
          content: serializeConsultationContent(
            normalizeConsultationContent(appointment.note.content)
          ),
        }
      : null,
    service: {
      ...appointment.service,
      price: appointment.service.price.toNumber(),
    },
    patient: {
      ...appointment.patient,
      appointments: appointment.patient.appointments.map((patientAppointment) => ({
        ...patientAppointment,
        service: patientAppointment.service
          ? {
              ...patientAppointment.service,
              price: patientAppointment.service.price.toNumber(),
            }
          : null,
      })),
    },
  }
}

export async function saveConsultationNote(
  appointmentId: string,
  content: Prisma.InputJsonValue
) {
  const userId = await requireCoreAppAccess()

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    select: {
      id: true,
    },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  const note = await applyConsultationContentPatch(appointmentId, content)

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "CONSULTATION",
    action: "CONSULTATION_NOTE_UPDATED",
    entityType: "ConsultationNote",
    entityId: note.id,
    metadata: {
      appointmentId,
    },
  })

  return note
}

export async function prepareConsultationBillingDraft(appointmentId: string) {
  const userId = await requireCoreAppAccess()
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    include: {
      invoice: {
        select: {
          id: true,
          number: true,
        },
      },
      patient: true,
      service: true,
      user: {
        select: invoiceIssuerSelect,
      },
    },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  const billingStatus = getBillingProfileStatusFromProfile(serializeIssuerSnapshot(appointment.user))
  const issuedAt = new Date()
  const isAlreadyBilled = Boolean(appointment.invoice)
  const isBillable =
    !isAlreadyBilled &&
    appointment.status !== "CANCELED" &&
    appointment.status !== "NOSHOW" &&
    appointment.start <= issuedAt

  const vatPreview = calculateInvoiceAmounts(appointment.service.price.toNumber(), {
    isVatExempt: billingStatus.issuerProfile.isVatExempt,
    vatRate: billingStatus.issuerProfile.defaultVatRate,
  })

  return {
    ready: billingStatus.ready,
    missingFields: billingStatus.missingFields,
    isAlreadyBilled,
    isBillable,
    invoiceNumber: appointment.invoice?.number ?? null,
    issuerProfile: billingStatus.issuerProfile,
    patientSnapshot: buildInvoicePatientSnapshot(appointment.patient),
    sessionDraft: {
      serviceName: appointment.service.name,
      amount: appointment.service.price.toNumber(),
      date: formatDateInputValue(issuedAt),
    },
    vatPreview,
  }
}

export async function confirmConsultationBilling(data: {
  appointmentId: string
  consultationContent: Prisma.InputJsonValue
  patientSnapshot: {
    firstName: string
    lastName: string
    address?: string | null
  }
  serviceName: string
  amount: number
  date: string
}) {
  const userId = await requireCoreAppAccess()
  const normalizedContent = data.consultationContent ?? {}

  if (Number.isNaN(data.amount) || data.amount <= 0) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const invoiceDate = parseDateInputValue(data.date)
  if (!invoiceDate) {
    throw new Error(await getErrorMessage("invalidDate"))
  }

  return prisma.$transaction(
    async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id: data.appointmentId,
          userId,
        },
        include: {
          note: true,
          invoice: {
            select: {
              id: true,
            },
          },
          patient: true,
          service: true,
          user: {
            select: invoiceIssuerSelect,
          },
        },
      })

      if (!appointment) {
        throw new Error(await getErrorMessage("appointmentNotFound"))
      }

      if (appointment.invoice) {
        throw new Error(await getErrorMessage("consultationAlreadyBilled"))
      }

      const billingStatus = await assertBillingProfileReady(appointment.user)
      const issuedAt = new Date()
      await ensureAppointmentCanBeBilled(appointment, issuedAt)

      await applyConsultationContentPatchInTransaction(tx, data.appointmentId, normalizedContent)

      const invoiceNumber = await getNextInvoiceNumber(tx, userId, invoiceDate)
      const amounts = calculateInvoiceAmounts(data.amount, {
        isVatExempt: billingStatus.issuerProfile.isVatExempt,
        vatRate: billingStatus.issuerProfile.defaultVatRate,
      })
      const patientSnapshot = {
        firstName: data.patientSnapshot.firstName.trim(),
        lastName: data.patientSnapshot.lastName.trim(),
        address: data.patientSnapshot.address?.trim() || null,
      }
      const serviceName = data.serviceName.trim()
      const structuredInvoiceArtifacts = buildStructuredInvoiceArtifacts({
        number: invoiceNumber,
        date: invoiceDate,
        serviceDate: appointment.start,
        dueDate: invoiceDate,
        serviceName,
        issuerSnapshot: serializeIssuerSnapshot(appointment.user),
        patientSnapshot,
        amount: amounts.amount,
        subtotalAmount: amounts.subtotalAmount,
        vatAmount: amounts.vatAmount,
        vatRate: amounts.vatRate,
      })

      const invoice = await tx.invoice.create({
        data: {
          userId,
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          number: invoiceNumber,
          serviceDate: appointment.start,
          dueDate: invoiceDate,
          currency: structuredInvoiceArtifacts.currency,
          paymentTerms: structuredInvoiceArtifacts.paymentTerms,
          buyerType: structuredInvoiceArtifacts.buyerType,
          buyerCompanyName: structuredInvoiceArtifacts.buyerCompanyName,
          buyerSiren: structuredInvoiceArtifacts.buyerSiren,
          buyerVatNumber: structuredInvoiceArtifacts.buyerVatNumber,
          amount: amounts.amount,
          vatAmount: amounts.vatAmount,
          vatRate: amounts.vatRate,
          status: "DRAFT",
          date: invoiceDate,
          serviceName,
          issuerSnapshot: serializeIssuerSnapshot(appointment.user),
          patientSnapshot,
          lineItems: structuredInvoiceArtifacts.lineItems as unknown as Prisma.InputJsonValue,
          facturXStatus: structuredInvoiceArtifacts.facturXStatus,
          facturXProfile: structuredInvoiceArtifacts.facturXProfile,
          facturXXml: structuredInvoiceArtifacts.facturXXml,
        },
      })

      await tx.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "COMPLETED",
          completedAt: appointment.completedAt ?? issuedAt,
          billedAt: issuedAt,
        },
      })

      await recordAuditEventSafe(tx, {
        actorUserId: userId,
        targetUserId: userId,
        domain: "INVOICE",
        action: "CONSULTATION_BILLED",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: {
          appointmentId: appointment.id,
          facturXStatus: structuredInvoiceArtifacts.facturXStatus,
        },
      })

      return {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount.toNumber(),
        vatAmount: invoice.vatAmount?.toNumber() ?? 0,
        vatRate: invoice.vatRate?.toNumber() ?? null,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}

export async function finishConsultationAndCreateInvoice(
  appointmentId: string,
  content: Prisma.InputJsonValue
) {
  const draft = await prepareConsultationBillingDraft(appointmentId)

  if (!draft.ready) {
    throw new Error(await getErrorMessage("billingProfileIncomplete"))
  }

  if (!draft.isBillable) {
    throw new Error(await getErrorMessage("consultationCannotBeBilled"))
  }

  return confirmConsultationBilling({
    appointmentId,
    consultationContent: content,
    patientSnapshot: draft.patientSnapshot,
    serviceName: draft.sessionDraft.serviceName,
    amount: draft.sessionDraft.amount,
    date: draft.sessionDraft.date,
  })
}

export async function saveBodyChartHistory(appointmentId: string, selectedParts: string[]) {
  const userId = await requireCoreAppAccess()
  const normalizedSelectedParts = normalizeBodyChartPartIds(selectedParts)

  return prisma.$transaction(
    async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          userId,
        },
        select: {
          id: true,
        },
      })

      if (!appointment) {
        throw new Error(await getErrorMessage("appointmentNotFound"))
      }

      await tx.consultationNote.upsert({
        where: {
          appointmentId,
        },
        create: {
          appointmentId,
          content: serializeConsultationContent(normalizeConsultationContent(null)),
        },
        update: {
          updatedAt: new Date(),
        },
      })

      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "ConsultationNote"
        WHERE "appointmentId" = ${appointmentId}
        FOR UPDATE
      `
      const lockedNote = lockedRows[0]

      if (!lockedNote) {
        throw new Error(await getErrorMessage("consultationNotFound"))
      }

      const lastHistory = await tx.bodyChartHistory.findFirst({
        where: { consultationNoteId: lockedNote.id },
        orderBy: { createdAt: "desc" },
      })

      const hasChanges =
        !lastHistory ||
        JSON.stringify([...normalizeBodyChartPartIds(lastHistory.selectedParts)].sort()) !==
          JSON.stringify([...normalizedSelectedParts].sort())

      if (hasChanges && (normalizedSelectedParts.length > 0 || Boolean(lastHistory))) {
        return tx.bodyChartHistory.create({
          data: {
            consultationNoteId: lockedNote.id,
            selectedParts: normalizedSelectedParts,
          },
        })
      }

      return lastHistory
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}

export async function getBodyChartHistory(appointmentId: string) {
  const userId = await requireCoreAppAccess()

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    include: {
      note: {
        include: {
          bodyChartHistory: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  })

  return (
    appointment?.note?.bodyChartHistory.map((entry) => ({
      ...entry,
      selectedParts: normalizeBodyChartPartIds(entry.selectedParts),
    })) || []
  )
}

export async function getConsultationAIAccess() {
  const userId = await requireCoreAppAccess()
  const [audioSoap, smartNotesLive, patientRecap] = await Promise.all([
    canAccessFeature("ai_audio_soap"),
    canAccessFeature("ai_smart_notes_live"),
    canAccessFeature("ai_patient_recap"),
  ])
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiFeaturesConsentAt: true,
      aiBetaEnabled: true,
      aiComplianceAcceptedAt: true,
    },
  })

  return {
    audioSoap,
    smartNotesLive,
    patientRecap,
    anyAI: audioSoap || smartNotesLive || patientRecap,
    hasConsent: Boolean(
      user?.aiFeaturesConsentAt || (user?.aiBetaEnabled && user?.aiComplianceAcceptedAt)
    ),
  }
}

export async function grantAIFeaturesConsent() {
  const userId = await requireCoreAppAccess()

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiFeaturesConsentAt: new Date(),
      aiBetaEnabled: true,
      aiComplianceAcceptedAt: new Date(),
      aiComplianceVersion: AI_BETA_COMPLIANCE_VERSION,
    },
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "AI",
    action: "AI_BETA_ENABLED",
    entityType: "User",
    entityId: userId,
    metadata: {
      aiComplianceVersion: AI_BETA_COMPLIANCE_VERSION,
    },
  })

  return { success: true }
}

export async function generateSmartNoteSuggestions(
  appointmentId: string,
  data: {
    bodyChart: string[]
    noteText: string
  }
) {
  const userId = await requireCoreAppAccess()

  if (!(await canAccessFeature("ai_smart_notes_live"))) {
    throw new Error(await getErrorMessage("aiFeatureUnavailable"))
  }
  await assertAiBetaEnabled(userId)

  const normalizedBodyChart = normalizeBodyChartPartIds(data.bodyChart)
  const normalizedNoteText = data.noteText.trim()

  if (normalizedBodyChart.length === 0 && !normalizedNoteText) {
    return []
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    include: {
      patient: true,
      service: true,
    },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  const suggestions = await openAIClinicalGenerationProvider.generateSmartNotes({
    serviceName: appointment.service.name,
    bodyChartLabels: normalizedBodyChart.map((part) => bodyPartLabels[part] ?? part),
    noteText: normalizedNoteText,
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "AI",
    action: "SMART_NOTES_GENERATED",
    entityType: "Appointment",
    entityId: appointmentId,
    metadata: {
      suggestionCount: suggestions.length,
    },
  })

  return suggestions
}

export async function generatePatientRecap(
  appointmentId: string,
  data: {
    bodyChart: string[]
    noteText: string
    soapSummary: string
  }
) {
  const userId = await requireCoreAppAccess()

  if (!(await canAccessFeature("ai_patient_recap"))) {
    throw new Error(await getErrorMessage("aiFeatureUnavailable"))
  }
  await assertAiBetaEnabled(userId)

  const normalizedBodyChart = normalizeBodyChartPartIds(data.bodyChart)
  const normalizedNoteText = data.noteText.trim()
  const normalizedSoapSummary = data.soapSummary.trim()

  if (!normalizedNoteText && !normalizedSoapSummary) {
    throw new Error(await getErrorMessage("patientRecapRequiresNote"))
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    include: {
      patient: true,
      service: true,
    },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  const recap = await openAIClinicalGenerationProvider.generatePatientRecap({
    serviceName: appointment.service.name,
    bodyChartLabels: normalizedBodyChart.map((part) => bodyPartLabels[part] ?? part),
    noteText: normalizedNoteText,
    soapSummary: normalizedSoapSummary,
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "AI",
    action: "PATIENT_RECAP_GENERATED",
    entityType: "Appointment",
    entityId: appointmentId,
    metadata: {
      hasSoapSummary: Boolean(normalizedSoapSummary),
    },
  })

  return recap
}

const validatedRecapSchema = z.object({
  summary: z.string().min(1).max(5000),
  advice: z.array(z.string().max(1000)),
  exercises: z.array(z.string().max(1000)),
  precautions: z.array(z.string().max(1000)),
  followUp: z.string().max(1000),
  generatedAt: z.string().min(1),
  model: z.string().min(1),
})

export async function saveValidatedRecap(
  appointmentId: string,
  recap: {
    summary: string
    advice: string[]
    exercises: string[]
    precautions: string[]
    followUp: string
    generatedAt: string
    model: string
  }
) {
  const userId = await requireCoreAppAccess()

  const parsed = validatedRecapSchema.safeParse(recap)
  if (!parsed.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    select: { id: true },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  await applyConsultationContentPatch(appointmentId, {
    ai: {
      patientRecap: {
        ...parsed.data,
        validatedAt: new Date().toISOString(),
        editedByPractitioner: true,
      },
    },
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "CONSULTATION",
    action: "PATIENT_RECAP_VALIDATED",
    entityType: "Appointment",
    entityId: appointmentId,
    metadata: {},
  })
}
