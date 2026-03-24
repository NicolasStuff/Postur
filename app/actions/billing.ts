"use server"

import { Prisma } from "@prisma/client"

import { recordAuditEventSafe } from "@/lib/audit"
import {
  calculateInvoiceAmounts,
  getBillingProfileStatus as getBillingProfileStatusFromProfile,
  parseDateInputValue,
  roundCurrency,
  toNullableNumber,
} from "@/lib/billing"
import {
  buildFacturXDraftXml,
  buildStructuredInvoiceLineItem,
  getFacturXProfileForStatus,
  getFacturXReadinessStatus,
  StructuredInvoiceBuyerType,
  StructuredInvoiceLineItem,
} from "@/lib/facturx"
import { requireSessionUserId } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"

const invoiceIssuerSelect = {
  name: true,
  email: true,
  practitionerType: true,
  siret: true,
  companyName: true,
  companyAddress: true,
  isVatExempt: true,
  defaultVatRate: true,
} satisfies Prisma.UserSelect

type BillingUser = Prisma.UserGetPayload<{ select: typeof invoiceIssuerSelect }>

function buildInvoiceNumber(lastSequence: number, currentDate: Date) {
  const year = currentDate.getFullYear()
  return `${year}-${String(lastSequence + 1).padStart(3, "0")}`
}

function extractInvoiceSequence(number: string, prefix: string) {
  if (!number.startsWith(prefix)) {
    return 0
  }

  const sequence = Number.parseInt(number.slice(prefix.length), 10)
  return Number.isNaN(sequence) ? 0 : sequence
}

async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  currentDate: Date
) {
  const prefix = `${currentDate.getFullYear()}-`
  const invoiceNumbers = await tx.invoice.findMany({
    where: {
      userId,
      number: {
        startsWith: prefix,
      },
    },
    select: {
      number: true,
    },
  })

  const lastSequence = invoiceNumbers.reduce(
    (maxSequence, invoice) => Math.max(maxSequence, extractInvoiceSequence(invoice.number, prefix)),
    0
  )

  return buildInvoiceNumber(lastSequence, currentDate)
}

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

function serializeIssuerSnapshot(user: BillingUser) {
  return {
    name: user.name,
    email: user.email,
    practitionerType: user.practitionerType,
    siret: user.siret,
    companyName: user.companyName,
    companyAddress: user.companyAddress,
    isVatExempt: user.isVatExempt,
    defaultVatRate: user.defaultVatRate ? user.defaultVatRate.toNumber() : null,
  }
}

async function assertBillingProfileReady(user: BillingUser) {
  const billingStatus = getBillingProfileStatusFromProfile(serializeIssuerSnapshot(user))

  if (!billingStatus.ready) {
    throw new Error(await getErrorMessage("billingProfileIncomplete"))
  }

  return billingStatus
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

function buildInvoicePatientSnapshot(patient: {
  firstName: string
  lastName: string
  address?: string | null
}) {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    address: patient.address ?? null,
  }
}

function buildStructuredInvoiceArtifacts(input: {
  number: string
  date: Date
  serviceDate: Date
  dueDate: Date
  serviceName: string
  buyerType?: StructuredInvoiceBuyerType
  buyerCompanyName?: string | null
  buyerSiren?: string | null
  buyerVatNumber?: string | null
  issuerSnapshot: ReturnType<typeof serializeIssuerSnapshot>
  patientSnapshot: ReturnType<typeof buildInvoicePatientSnapshot>
  amount: number
  subtotalAmount: number
  vatAmount: number
  vatRate: number | null
}) {
  const lineItems: StructuredInvoiceLineItem[] = [
    buildStructuredInvoiceLineItem({
      label: input.serviceName,
      amount: input.amount,
      subtotalAmount: input.subtotalAmount,
      vatRate: input.vatRate,
    }),
  ]

  const buyerType = input.buyerType ?? "INDIVIDUAL"
  const structuredInvoice = {
    number: input.number,
    date: input.date,
    serviceDate: input.serviceDate,
    dueDate: input.dueDate,
    currency: "EUR",
    paymentTerms: "Paiement comptant",
    buyerType,
    buyerCompanyName: input.buyerCompanyName,
    buyerSiren: input.buyerSiren,
    buyerVatNumber: input.buyerVatNumber,
    sellerName: input.issuerSnapshot.companyName || input.issuerSnapshot.name,
    sellerAddress: input.issuerSnapshot.companyAddress,
    sellerSiret: input.issuerSnapshot.siret,
    buyerDisplayName: `${input.patientSnapshot.firstName} ${input.patientSnapshot.lastName}`.trim(),
    buyerAddress: input.patientSnapshot.address,
    amount: input.amount,
    subtotalAmount: input.subtotalAmount,
    vatAmount: input.vatAmount,
    vatRate: input.vatRate,
    lineItems,
  }

  const facturXStatus = getFacturXReadinessStatus(structuredInvoice)

  return {
    currency: "EUR",
    paymentTerms: "Paiement comptant",
    buyerType,
    buyerCompanyName: input.buyerCompanyName ?? null,
    buyerSiren: input.buyerSiren ?? null,
    buyerVatNumber: input.buyerVatNumber ?? null,
    lineItems: structuredInvoice.lineItems,
    facturXStatus,
    facturXProfile: getFacturXProfileForStatus(facturXStatus),
    facturXXml: buildFacturXDraftXml(structuredInvoice),
  }
}

function mapInvoiceListItem(
  invoice: Prisma.InvoiceGetPayload<{
    include: {
      patient: true
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
      patient: true,
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

  const invoice = await prisma.invoice.findFirst({
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

  await assertBillingProfileReady(invoice.user)

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "INVOICE",
    action: "INVOICE_STATUS_UPDATED",
    entityType: "Invoice",
    entityId: invoiceId,
    metadata: {
      status,
    },
  })

  return updatedInvoice
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

    return deletedInvoice
  })
}

export async function getInvoiceDetails(invoiceId: string) {
  const userId = await requireSessionUserId()
  const invoice = await getInvoiceDetailsRecord(invoiceId, userId)
  await assertBillingProfileReady(invoice.user)
  return mapInvoiceDetails(invoice)
}
