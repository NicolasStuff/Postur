"use server"

import { Prisma } from "@prisma/client"

import {
  INTERNAL_BOOKING_SLOT_MINUTES,
  internalAppointmentSchema,
  isValidTimeStep,
} from "@/lib/booking"
import { requireCoreAppAccess } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"

export async function getAppointments(start: Date, end: Date) {
  const userId = await requireCoreAppAccess()

  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
      start: { gte: start },
      end: { lte: end },
      status: { not: "CANCELED" },
    },
    select: {
      id: true,
      start: true,
      end: true,
      status: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
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
    orderBy: {
      start: "asc",
    },
  })

  return appointments.map((appointment) => ({
    ...appointment,
    service: {
      ...appointment.service,
      price: appointment.service.price.toNumber(),
    },
  }))
}

export async function createAppointment(data: {
  patientId: string
  serviceId: string
  start: Date
  notes?: string
}) {
  const userId = await requireCoreAppAccess()
  const parsedInput = internalAppointmentSchema.safeParse(data)

  if (!parsedInput.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const appointmentStart = parsedInput.data.start
  const appointmentTime = appointmentStart
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .slice(0, 5)

  if (!isValidTimeStep(appointmentTime, INTERNAL_BOOKING_SLOT_MINUTES)) {
    throw new Error(await getErrorMessage("validationError"))
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const patient = await tx.patient.findFirst({
          where: {
            id: parsedInput.data.patientId,
            userId,
          },
          select: {
            id: true,
          },
        })

        if (!patient) {
          throw new Error(await getErrorMessage("patientNotFound"))
        }

        const service = await tx.service.findFirst({
          where: {
            id: parsedInput.data.serviceId,
            userId,
          },
          select: {
            id: true,
            duration: true,
          },
        })

        if (!service) {
          throw new Error(await getErrorMessage("serviceNotFound"))
        }

        const end = new Date(appointmentStart.getTime() + service.duration * 60_000)
        const conflictingAppointment = await tx.appointment.findFirst({
          where: {
            userId,
            status: { not: "CANCELED" },
            start: { lt: end },
            end: { gt: appointmentStart },
          },
          select: { id: true },
        })

        if (conflictingAppointment) {
          throw new Error(await getErrorMessage("slotNotAvailable"))
        }

        return tx.appointment.create({
          data: {
            userId,
            patientId: parsedInput.data.patientId,
            serviceId: parsedInput.data.serviceId,
            start: appointmentStart,
            end,
            notes: parsedInput.data.notes?.trim() || undefined,
          },
        })
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2004" ||
        (typeof error.meta?.database_error === "string" &&
          error.meta.database_error.includes("Appointment_no_overlap")))
    ) {
      throw new Error(await getErrorMessage("slotNotAvailable"))
    }

    throw error
  }
}
