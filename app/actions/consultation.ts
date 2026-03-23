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

async function requireSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user.id) {
    throw new Error(await getErrorMessage("unauthorized"))
  }

  return session.user.id
}

function buildInvoiceNumber(lastNumber: string | null, currentDate: Date) {
  const year = currentDate.getFullYear()
  const prefix = `${year}-`
  const lastSequence = lastNumber?.startsWith(prefix)
    ? Number.parseInt(lastNumber.slice(prefix.length), 10)
    : 0

  return `${prefix}${String((Number.isNaN(lastSequence) ? 0 : lastSequence) + 1).padStart(3, "0")}`
}

async function getNextInvoiceNumber(
  tx: Prisma.TransactionClient,
  userId: string,
  currentDate: Date
) {
  const prefix = `${currentDate.getFullYear()}-`
  const latestInvoice = await tx.invoice.findFirst({
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

export async function getConsultations() {
  const userId = await requireSessionUserId()

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
  const userId = await requireSessionUserId()

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
      patient: {
        include: {
          appointments: {
            orderBy: { start: "desc" },
            take: 5,
            include: {
              note: true,
              service: true,
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
  const userId = await requireSessionUserId()

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

  return prisma.consultationNote.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      content,
    },
    update: {
      content,
    },
  })
}

export async function finishConsultationAndCreateInvoice(
  appointmentId: string,
  content: Prisma.InputJsonValue
) {
  const userId = await requireSessionUserId()
  const normalizedContent = content ?? {}

  return prisma.$transaction(
    async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: {
          id: appointmentId,
          userId,
        },
        include: {
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

      await tx.consultationNote.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          content: normalizedContent,
        },
        update: {
          content: normalizedContent,
        },
      })

      const issuedAt = new Date()
      const invoiceNumber = await getNextInvoiceNumber(tx, userId, issuedAt)

      const invoice = await tx.invoice.create({
        data: {
          userId,
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          number: invoiceNumber,
          amount: appointment.service.price,
          status: "DRAFT",
          date: issuedAt,
          serviceName: appointment.service.name,
          issuerSnapshot: {
            ...appointment.user,
          },
          patientSnapshot: {
            firstName: appointment.patient.firstName,
            lastName: appointment.patient.lastName,
            email: appointment.patient.email,
            phone: appointment.patient.phone,
            address: appointment.patient.address,
          },
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

      return {
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount.toNumber(),
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}

export async function saveBodyChartHistory(appointmentId: string, selectedParts: string[]) {
  const userId = await requireSessionUserId()

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId,
    },
    include: { note: true },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  let note = appointment.note
  if (!note) {
    note = await prisma.consultationNote.create({
      data: {
        appointmentId,
        content: {},
      },
    })
  }

  const lastHistory = await prisma.bodyChartHistory.findFirst({
    where: { consultationNoteId: note.id },
    orderBy: { createdAt: "desc" },
  })

  const hasChanges =
    !lastHistory ||
    JSON.stringify([...lastHistory.selectedParts].sort()) !==
      JSON.stringify([...selectedParts].sort())

  if (hasChanges && selectedParts.length > 0) {
    return prisma.bodyChartHistory.create({
      data: {
        consultationNoteId: note.id,
        selectedParts,
      },
    })
  }

  return lastHistory
}

export async function getBodyChartHistory(appointmentId: string) {
  const userId = await requireSessionUserId()

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

  return appointment?.note?.bodyChartHistory || []
}
