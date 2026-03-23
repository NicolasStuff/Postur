"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { getErrorMessage } from "@/lib/i18n/errors"
import { Prisma } from "@prisma/client"

const invoiceIssuerSelect = {
  name: true,
  email: true,
  practitionerType: true,
  siret: true,
  companyName: true,
  companyAddress: true,
  isVatExempt: true,
} satisfies Prisma.UserSelect

function buildInvoiceNumber(lastNumber: string | null, currentDate: Date) {
  const year = currentDate.getFullYear()
  const prefix = `${year}-`
  const lastSequence = lastNumber?.startsWith(prefix)
    ? Number.parseInt(lastNumber.slice(prefix.length), 10)
    : 0

  return `${prefix}${String((Number.isNaN(lastSequence) ? 0 : lastSequence) + 1).padStart(3, "0")}`
}

async function requireSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user.id) {
    throw new Error(await getErrorMessage("unauthorized"))
  }

  return session.user.id
}

async function getNextInvoiceNumber(userId: string, currentDate: Date) {
  const prefix = `${currentDate.getFullYear()}-`
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      userId,
      number: {
        startsWith: prefix,
      },
    },
    orderBy: {
      number: "desc",
    },
    select: {
      number: true,
    },
  })

  return buildInvoiceNumber(latestInvoice?.number ?? null, currentDate)
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

  return invoices.map((invoice) => ({
    ...invoice,
    amount: invoice.amount.toNumber(),
  }))
}

export async function createInvoice(data: {
  patientId: string
  amount: number
  appointmentId?: string
  serviceName?: string
}) {
  const userId = await requireSessionUserId()

  const patient = await prisma.patient.findFirst({
    where: {
      id: data.patientId,
      userId,
    },
  })

  if (!patient) {
    throw new Error(await getErrorMessage("patientNotFound"))
  }

  if (Number.isNaN(data.amount) || data.amount <= 0) {
    throw new Error(await getErrorMessage("validationError"))
  }

  if (data.appointmentId) {
    const appointment = await prisma.appointment.findFirst({
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
      },
    })

    if (!appointment) {
      throw new Error(await getErrorMessage("appointmentNotFound"))
    }

    if (appointment.invoice) {
      throw new Error(await getErrorMessage("consultationAlreadyBilled"))
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: invoiceIssuerSelect,
  })
  const number = await getNextInvoiceNumber(userId, new Date())

  return prisma.invoice.create({
    data: {
      userId,
      patientId: data.patientId,
      appointmentId: data.appointmentId,
      number,
      amount: data.amount,
      status: "DRAFT",
      serviceName: data.serviceName,
      issuerSnapshot: user
        ? {
            ...user,
          }
        : Prisma.JsonNull,
      patientSnapshot: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
      },
    },
  })
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "DRAFT" | "SENT" | "PAID"
) {
  const userId = await requireSessionUserId()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  })

  if (!invoice) {
    throw new Error(await getErrorMessage("invoiceNotFound"))
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status },
  })
}

export async function deleteInvoice(invoiceId: string) {
  const userId = await requireSessionUserId()

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  })

  if (!invoice) {
    throw new Error(await getErrorMessage("invoiceNotFound"))
  }

  return prisma.invoice.delete({
    where: { id: invoiceId },
  })
}

export async function getInvoiceDetails(invoiceId: string) {
  const userId = await requireSessionUserId()

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

  const issuerSnapshot = toRecord(invoice.issuerSnapshot)
  const patientSnapshot = toRecord(invoice.patientSnapshot)

  return {
    ...invoice,
    amount: invoice.amount.toNumber(),
    user: {
      name: readString(issuerSnapshot, "name") ?? invoice.user.name,
      email: readString(issuerSnapshot, "email") ?? invoice.user.email,
      practitionerType:
        readString(issuerSnapshot, "practitionerType") ?? invoice.user.practitionerType,
      siret: readString(issuerSnapshot, "siret") ?? invoice.user.siret,
      companyName: readString(issuerSnapshot, "companyName") ?? invoice.user.companyName,
      companyAddress:
        readString(issuerSnapshot, "companyAddress") ?? invoice.user.companyAddress,
      isVatExempt:
        readBoolean(issuerSnapshot, "isVatExempt") ?? invoice.user.isVatExempt,
    },
    patient: {
      ...invoice.patient,
      firstName: readString(patientSnapshot, "firstName") ?? invoice.patient.firstName,
      lastName: readString(patientSnapshot, "lastName") ?? invoice.patient.lastName,
      email: readString(patientSnapshot, "email") ?? invoice.patient.email,
      phone: readString(patientSnapshot, "phone") ?? invoice.patient.phone,
      address: readString(patientSnapshot, "address") ?? invoice.patient.address,
    },
  }
}
