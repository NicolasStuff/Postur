"use server"

import { Prisma } from "@prisma/client"
import { z } from "zod"

import { recordAuditEventSafe } from "@/lib/audit"
import {
  calculateInvoiceAmounts,
  getBillingProfileStatus as getBillingProfileStatusFromProfile,
  parseDateInputValue,
  roundCurrency,
  toNullableNumber,
} from "@/lib/billing"
import type React from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import {
  StructuredInvoiceBuyerType,
} from "@/lib/facturx"
import {
  assertBillingProfileReady,
  buildInvoicePatientSnapshot,
  buildStructuredInvoiceArtifacts,
  getNextInvoiceNumber,
  invoiceIssuerSelect,
  serializeIssuerSnapshot,
} from "@/lib/invoice-builder"
import { requireSessionUserId } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"

/** Valid invoice status transitions: source -> allowed targets */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["PAID"],
}

const recipientEmailSchema = z.string().email().max(320)

function shouldRegenerateInvoiceNumber(currentNumber: string, invoiceDate: Date) {
  const expectedPrefix = `${invoiceDate.getFullYear()}-`
  return !currentNumber.startsWith(expectedPrefix)
}

function toRecord(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function readString(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return typeof value === "string" ? value : null
}

function readBoolean(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return typeof value === "boolean" ? value : null
}

function readNumber(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return toNullableNumber(typeof value === "number" || typeof value === "string" ? value : null)
}

function readPractitionerType(snapshot: Record<string, unknown> | null, key: string) {
  const value = snapshot?.[key]
  return value === "OSTEOPATH" ? value : null
}

async function assertInvoiceIsDraft(invoice: { status: string }) {
  if (invoice.status !== "DRAFT") {
    throw new Error(await getErrorMessage("invoiceLocked"))
  }
}

async function assertAppointmentCanBeBilled(
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

function mapInvoiceListItem(
  invoice: Prisma.InvoiceGetPayload<{
    include: {
      patient: {
        select: {
          id: true
          firstName: true
          lastName: true
          email: true
          address: true
        }
      }
      appointment: {
        select: {
          id: true
          status: true
        }
      }
    }
  }>
) {
  const patientSnapshot = toRecord(invoice.patientSnapshot)
  const amount = invoice.amount.toNumber()
  const vatAmount = invoice.vatAmount?.toNumber() ?? 0
  const vatRate = invoice.vatRate?.toNumber() ?? null

  return {
    ...invoice,
    amount,
    vatAmount,
    vatRate,
    subtotalAmount: roundCurrency(amount - vatAmount),
    patient: {
      ...invoice.patient,
      firstName: readString(patientSnapshot, "firstName") ?? invoice.patient.firstName,
      lastName: readString(patientSnapshot, "lastName") ?? invoice.patient.lastName,
      address: readString(patientSnapshot, "address") ?? invoice.patient.address,
    },
  }
}

function mapInvoiceDetails(
  invoice: Prisma.InvoiceGetPayload<{
    include: {
      patient: true
      appointment: {
        select: {
          id: true
          status: true
          completedAt: true
          billedAt: true
        }
      }
      user: {
        select: typeof invoiceIssuerSelect
      }
    }
  }>
) {
  const issuerSnapshot = toRecord(invoice.issuerSnapshot)
  const patientSnapshot = toRecord(invoice.patientSnapshot)
  const amount = invoice.amount.toNumber()
  const vatAmount = invoice.vatAmount?.toNumber() ?? 0
  const vatRate = invoice.vatRate?.toNumber() ?? readNumber(issuerSnapshot, "defaultVatRate")

  return {
    ...invoice,
    amount,
    vatAmount,
    vatRate,
    subtotalAmount: roundCurrency(amount - vatAmount),
    user: {
      name: readString(issuerSnapshot, "name") ?? invoice.user.name,
      email: readString(issuerSnapshot, "email") ?? invoice.user.email,
      practitionerType:
        readPractitionerType(issuerSnapshot, "practitionerType") ?? invoice.user.practitionerType,
      siret: readString(issuerSnapshot, "siret") ?? invoice.user.siret,
      companyName: readString(issuerSnapshot, "companyName") ?? invoice.user.companyName,
      companyAddress:
        readString(issuerSnapshot, "companyAddress") ?? invoice.user.companyAddress,
      isVatExempt:
        readBoolean(issuerSnapshot, "isVatExempt") ?? invoice.user.isVatExempt,
      defaultVatRate:
        readNumber(issuerSnapshot, "defaultVatRate") ??
        (invoice.user.defaultVatRate ? invoice.user.defaultVatRate.toNumber() : null),
    },
    patient: {
      ...invoice.patient,
      firstName: readString(patientSnapshot, "firstName") ?? invoice.patient.firstName,
      lastName: readString(patientSnapshot, "lastName") ?? invoice.patient.lastName,
      address: readString(patientSnapshot, "address") ?? invoice.patient.address,
    },
  }
}

async function getInvoiceDetailsRecord(invoiceId: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      patient: true,
      appointment: {
        select: {
          id: true,
          status: true,
          completedAt: true,
          billedAt: true,
        },
      },
      user: {
        select: invoiceIssuerSelect,
      },
    },
  })

  if (!invoice) {
    throw new Error(await getErrorMessage("invoiceNotFound"))
  }

  return invoice
}

export async function getBillingProfileStatus() {
  const userId = await requireSessionUserId()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: invoiceIssuerSelect,
  })

  if (!user) {
    throw new Error(await getErrorMessage("notFound"))
  }

  return getBillingProfileStatusFromProfile(serializeIssuerSnapshot(user))
}

export async function getInvoices() {
  const userId = await requireSessionUserId()

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          address: true,
        },
      },
      appointment: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { date: "desc" },
  })

  return invoices.map(mapInvoiceListItem)
}

export async function createInvoice(data: {
  patientId: string
  amount: number
  appointmentId?: string
  serviceName?: string
}) {
  const userId = await requireSessionUserId()

  if (Number.isNaN(data.amount) || data.amount <= 0) {
    throw new Error(await getErrorMessage("validationError"))
  }

  return prisma.$transaction(
    async (tx) => {
      const patient = await tx.patient.findFirst({
        where: {
          id: data.patientId,
          userId,
        },
      })

      if (!patient) {
        throw new Error(await getErrorMessage("patientNotFound"))
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: invoiceIssuerSelect,
      })

      if (!user) {
        throw new Error(await getErrorMessage("notFound"))
      }

      const billingStatus = await assertBillingProfileReady(user)
      const issuedAt = new Date()

      let appointment:
        | Prisma.AppointmentGetPayload<{
            include: {
              invoice: { select: { id: true } }
              service: { select: { name: true } }
            }
          }>
        | null = null

      if (data.appointmentId) {
        appointment = await tx.appointment.findFirst({
          where: {
            id: data.appointmentId,
            userId,
          },
          include: {
            invoice: {
              select: {
                id: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
        })

        if (!appointment) {
          throw new Error(await getErrorMessage("appointmentNotFound"))
        }

        if (appointment.patientId !== data.patientId) {
          throw new Error(await getErrorMessage("validationError"))
        }

        if (appointment.invoice) {
          throw new Error(await getErrorMessage("consultationAlreadyBilled"))
        }

        await assertAppointmentCanBeBilled(appointment, issuedAt)
      }

      const number = await getNextInvoiceNumber(tx, userId, issuedAt)
      const amounts = calculateInvoiceAmounts(data.amount, {
        isVatExempt: billingStatus.issuerProfile.isVatExempt,
        vatRate: billingStatus.issuerProfile.defaultVatRate,
      })
      const serviceDate = appointment?.start ?? issuedAt
      const dueDate = issuedAt
      const serviceName = data.serviceName?.trim() || appointment?.service?.name || "Consultation"
      const patientSnapshot = buildInvoicePatientSnapshot(patient)
      const structuredInvoiceArtifacts = buildStructuredInvoiceArtifacts({
        number,
        date: issuedAt,
        serviceDate,
        dueDate,
        serviceName,
        issuerSnapshot: serializeIssuerSnapshot(user),
        patientSnapshot,
        amount: amounts.amount,
        subtotalAmount: amounts.subtotalAmount,
        vatAmount: amounts.vatAmount,
        vatRate: amounts.vatRate,
      })

      const invoice = await tx.invoice.create({
        data: {
          userId,
          patientId: data.patientId,
          appointmentId: data.appointmentId,
          number,
          date: issuedAt,
          serviceDate,
          dueDate,
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
          serviceName,
          issuerSnapshot: serializeIssuerSnapshot(user),
          patientSnapshot,
          lineItems: structuredInvoiceArtifacts.lineItems as unknown as Prisma.InputJsonValue,
          facturXStatus: structuredInvoiceArtifacts.facturXStatus,
          facturXProfile: structuredInvoiceArtifacts.facturXProfile,
          facturXXml: structuredInvoiceArtifacts.facturXXml,
        },
      })

      if (appointment) {
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
      }

      await recordAuditEventSafe(tx, {
        actorUserId: userId,
        targetUserId: userId,
        domain: "INVOICE",
        action: "INVOICE_CREATED",
        entityType: "Invoice",
        entityId: invoice.id,
        metadata: {
          appointmentId: data.appointmentId ?? null,
          facturXStatus: structuredInvoiceArtifacts.facturXStatus,
        },
      })

      return {
        ...invoice,
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

export async function updateDraftInvoice(data: {
  invoiceId: string
  serviceName: string
  amount: number
  date: string
  patientSnapshot: {
    firstName: string
    lastName: string
    address?: string | null
  }
}) {
  const userId = await requireSessionUserId()

  if (Number.isNaN(data.amount) || data.amount <= 0) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const invoiceDate = parseDateInputValue(data.date)
  if (!invoiceDate) {
    throw new Error(await getErrorMessage("invalidDate"))
  }

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: {
        id: data.invoiceId,
        userId,
      },
      include: {
        user: {
          select: invoiceIssuerSelect,
        },
      },
    })

    if (!invoice) {
      throw new Error(await getErrorMessage("invoiceNotFound"))
    }

    await assertInvoiceIsDraft(invoice)
    const billingStatus = await assertBillingProfileReady(invoice.user)
    const issuerSnapshot = toRecord(invoice.issuerSnapshot)
    const snapshotIsVatExempt =
      readBoolean(issuerSnapshot, "isVatExempt") ?? billingStatus.issuerProfile.isVatExempt
    const snapshotVatRate =
      readNumber(issuerSnapshot, "defaultVatRate") ?? billingStatus.issuerProfile.defaultVatRate
    const amounts = calculateInvoiceAmounts(data.amount, {
      isVatExempt: snapshotIsVatExempt,
      vatRate: snapshotVatRate,
    })
    const nextInvoiceNumber = shouldRegenerateInvoiceNumber(invoice.number, invoiceDate)
      ? await getNextInvoiceNumber(tx, userId, invoiceDate)
      : invoice.number
    const patientSnapshot = {
      firstName: data.patientSnapshot.firstName.trim(),
      lastName: data.patientSnapshot.lastName.trim(),
      address: data.patientSnapshot.address?.trim() || null,
    }
    const serviceName = data.serviceName.trim()
    const structuredInvoiceArtifacts = buildStructuredInvoiceArtifacts({
      number: nextInvoiceNumber,
      date: invoiceDate,
      serviceDate: invoice.serviceDate ?? invoiceDate,
      dueDate: invoiceDate,
      serviceName,
      // buyerType is stored as string in DB but constrained to StructuredInvoiceBuyerType values at creation
      buyerType: invoice.buyerType as StructuredInvoiceBuyerType,
      buyerCompanyName: invoice.buyerCompanyName,
      buyerSiren: invoice.buyerSiren,
      buyerVatNumber: invoice.buyerVatNumber,
      issuerSnapshot: {
        name: readString(issuerSnapshot, "name") ?? invoice.user.name,
        email: readString(issuerSnapshot, "email") ?? invoice.user.email,
        practitionerType:
          readPractitionerType(issuerSnapshot, "practitionerType") ?? invoice.user.practitionerType,
        siret: readString(issuerSnapshot, "siret") ?? invoice.user.siret,
        companyName: readString(issuerSnapshot, "companyName") ?? invoice.user.companyName,
        companyAddress:
          readString(issuerSnapshot, "companyAddress") ?? invoice.user.companyAddress,
        isVatExempt: snapshotIsVatExempt,
        defaultVatRate: snapshotVatRate,
      },
      patientSnapshot,
      amount: amounts.amount,
      subtotalAmount: amounts.subtotalAmount,
      vatAmount: amounts.vatAmount,
      vatRate: amounts.vatRate,
    })

    const updatedInvoice = await tx.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        number: nextInvoiceNumber,
        serviceName,
        date: invoiceDate,
        dueDate: invoiceDate,
        amount: amounts.amount,
        vatAmount: amounts.vatAmount,
        vatRate: amounts.vatRate,
        patientSnapshot,
        lineItems: structuredInvoiceArtifacts.lineItems as unknown as Prisma.InputJsonValue,
        facturXStatus: structuredInvoiceArtifacts.facturXStatus,
        facturXProfile: structuredInvoiceArtifacts.facturXProfile,
        facturXXml: structuredInvoiceArtifacts.facturXXml,
      },
      include: {
        patient: true,
        appointment: {
          select: {
            id: true,
            status: true,
            completedAt: true,
            billedAt: true,
          },
        },
        user: {
          select: invoiceIssuerSelect,
        },
      },
    })

    await recordAuditEventSafe(tx, {
      actorUserId: userId,
      targetUserId: userId,
      domain: "INVOICE",
      action: "INVOICE_DRAFT_UPDATED",
      entityType: "Invoice",
      entityId: updatedInvoice.id,
      metadata: {
        facturXStatus: structuredInvoiceArtifacts.facturXStatus,
      },
    })

    return mapInvoiceDetails(updatedInvoice)
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "DRAFT" | "SENT" | "PAID"
) {
  const userId = await requireSessionUserId()

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: {
        user: {
          select: invoiceIssuerSelect,
        },
      },
    })

    if (!invoice) {
      throw new Error(await getErrorMessage("invoiceNotFound"))
    }

    // Validate state transition
    const allowedTargets = VALID_STATUS_TRANSITIONS[invoice.status]
    if (!allowedTargets?.includes(status)) {
      throw new Error(
        await getErrorMessage("invalidStatusTransition")
      )
    }

    await assertBillingProfileReady(invoice.user)

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId, userId },
      data: { status },
    })

    await recordAuditEventSafe(tx, {
      actorUserId: userId,
      targetUserId: userId,
      domain: "INVOICE",
      action: "INVOICE_STATUS_UPDATED",
      entityType: "Invoice",
      entityId: invoiceId,
      metadata: {
        previousStatus: invoice.status,
        status,
      },
    })

    return {
      ...updatedInvoice,
      amount: updatedInvoice.amount.toNumber(),
      vatAmount: updatedInvoice.vatAmount?.toNumber() ?? 0,
      vatRate: updatedInvoice.vatRate?.toNumber() ?? null,
    }
  })
}

export async function deleteInvoice(invoiceId: string) {
  const userId = await requireSessionUserId()

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, userId },
    })

    if (!invoice) {
      throw new Error(await getErrorMessage("invoiceNotFound"))
    }

    if (invoice.status !== "DRAFT") {
      throw new Error(await getErrorMessage("invoiceCannotDelete"))
    }

    if (invoice.appointmentId) {
      await tx.appointment.update({
        where: { id: invoice.appointmentId },
        data: {
          billedAt: null,
        },
      })
    }

    const deletedInvoice = await tx.invoice.delete({
      where: { id: invoiceId },
    })

    await recordAuditEventSafe(tx, {
      actorUserId: userId,
      targetUserId: userId,
      domain: "INVOICE",
      action: "INVOICE_DELETED",
      entityType: "Invoice",
      entityId: invoiceId,
      metadata: {
        number: invoice.number,
      },
    })

    return {
      ...deletedInvoice,
      amount: deletedInvoice.amount.toNumber(),
      vatAmount: deletedInvoice.vatAmount?.toNumber() ?? 0,
      vatRate: deletedInvoice.vatRate?.toNumber() ?? null,
    }
  })
}

export async function cancelInvoice(invoiceId: string) {
  const userId = await requireSessionUserId()

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, userId },
    })

    if (!invoice) {
      throw new Error(await getErrorMessage("invoiceNotFound"))
    }

    if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") {
      throw new Error(await getErrorMessage("invoiceCannotCancel"))
    }

    if (invoice.appointmentId) {
      await tx.appointment.update({
        where: { id: invoice.appointmentId },
        data: { billedAt: null },
      })
    }

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: "CANCELLED" },
    })

    await recordAuditEventSafe(tx, {
      actorUserId: userId,
      targetUserId: userId,
      domain: "INVOICE",
      action: "INVOICE_CANCELLED",
      entityType: "Invoice",
      entityId: invoiceId,
      metadata: {
        number: invoice.number,
      },
    })

    return {
      ...updatedInvoice,
      amount: updatedInvoice.amount.toNumber(),
      vatAmount: updatedInvoice.vatAmount?.toNumber() ?? 0,
      vatRate: updatedInvoice.vatRate?.toNumber() ?? null,
    }
  })
}

export async function getInvoiceDetails(invoiceId: string) {
  const userId = await requireSessionUserId()
  const invoice = await getInvoiceDetailsRecord(invoiceId, userId)
  await assertBillingProfileReady(invoice.user)
  return mapInvoiceDetails(invoice)
}

export async function sendInvoiceByEmail(invoiceId: string, recipientEmail: string) {
  const validatedEmail = recipientEmailSchema.parse(recipientEmail)

  const reactPdf = await import("@react-pdf/renderer")
  const { InvoicePdfDocument } = await import("@/components/billing/InvoicePdfDocument")
  const { RecapPdfDocument } = await import("@/components/billing/RecapPdfDocument")
  const { sendInvoiceEmail } = await import("@/lib/email")
  const { normalizeConsultationContent } = await import("@/lib/consultation-note")

  const userId = await requireSessionUserId()

  try {
    const invoice = await getInvoiceDetailsRecord(invoiceId, userId)
    await assertBillingProfileReady(invoice.user)

    const mapped = mapInvoiceDetails(invoice)
    const issuerName = mapped.user.companyName || mapped.user.name || "Praticien"
    const patientName = `${mapped.patient.firstName} ${mapped.patient.lastName}`

    const invoiceDate = mapped.date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    const totalAmount = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(mapped.amount)

    const document = InvoicePdfDocument({ invoice: mapped, locale: "fr" }) as React.ReactElement<DocumentProps>
    const buffer = await reactPdf.renderToBuffer(document)

    // Generate recap PDF if a validated recap exists for this consultation
    let recapPdfBuffer: Buffer | undefined
    if (invoice.appointmentId) {
      const note = await prisma.consultationNote.findUnique({
        where: { appointmentId: invoice.appointmentId },
        select: { content: true },
      })
      if (note) {
        const content = normalizeConsultationContent(note.content)
        if (content.ai.patientRecap?.validatedAt) {
          const consultationDate = mapped.date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
          const recapDoc = RecapPdfDocument({
            locale: "fr",
            recap: content.ai.patientRecap,
            patient: {
              firstName: mapped.patient.firstName,
              lastName: mapped.patient.lastName,
            },
            practitioner: {
              name: mapped.user.name || issuerName,
              companyName: mapped.user.companyName,
              companyAddress: mapped.user.companyAddress,
              siret: mapped.user.siret,
            },
            consultationDate,
          }) as React.ReactElement<DocumentProps>
          const recapBuffer = await reactPdf.renderToBuffer(recapDoc)
          recapPdfBuffer = Buffer.from(recapBuffer)
        }
      }
    }

    // Record audit BEFORE sending to ensure traceability even if email delivery fails
    await recordAuditEventSafe(prisma, {
      actorUserId: userId,
      targetUserId: userId,
      domain: "INVOICE",
      action: "INVOICE_EMAIL_SENT",
      entityType: "Invoice",
      entityId: invoiceId,
      metadata: {
        invoiceNumber: mapped.number,
        recipientEmail: validatedEmail,
        hasRecapAttachment: Boolean(recapPdfBuffer),
      },
    })

    await sendInvoiceEmail({
      to: validatedEmail,
      invoiceNumber: mapped.number,
      invoiceDate,
      totalAmount,
      patientName,
      issuerName,
      issuerAddress: mapped.user.companyAddress ?? null,
      issuerSiret: mapped.user.siret ?? null,
      pdfBuffer: Buffer.from(buffer),
      recapPdfBuffer,
    })
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : await getErrorMessage("emailSendFailed")
    )
  }
}
