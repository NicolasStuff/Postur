"use server"

import { Prisma } from "@prisma/client"

import {
  INTERNAL_BOOKING_SLOT_MINUTES,
  internalAppointmentSchema,
  isValidTimeStep,
  parseOpeningHours,
} from "@/lib/booking"
import { requireCoreAppAccess } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"
import { computeWeekSchedule } from "@/lib/schedule-windows"

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

export async function updateAppointmentDateTime(data: {
  appointmentId: string
  start: Date
}) {
  const userId = await requireCoreAppAccess()

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: data.appointmentId,
      userId,
    },
    include: {
      service: {
        select: {
          duration: true,
        },
      },
    },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  const appointmentStart = new Date(data.start)
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

  const end = new Date(appointmentStart.getTime() + appointment.service.duration * 60_000)

  try {
    return await prisma.$transaction(
      async (tx) => {
        const conflictingAppointment = await tx.appointment.findFirst({
          where: {
            userId,
            id: { not: data.appointmentId },
            status: { not: "CANCELED" },
            start: { lt: end },
            end: { gt: appointmentStart },
          },
          select: { id: true },
        })

        if (conflictingAppointment) {
          throw new Error(await getErrorMessage("slotNotAvailable"))
        }

        return tx.appointment.update({
          where: { id: data.appointmentId },
          data: {
            start: appointmentStart,
            end,
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

export async function updateAppointment(data: {
  id: string
  startTime?: string
  durationMinutes?: number
  forceOverlap?: boolean
}) {
  const userId = await requireCoreAppAccess()

  const appointment = await prisma.appointment.findFirst({
    where: { id: data.id, userId },
    include: {
      service: {
        select: { duration: true },
      },
    },
  })

  if (!appointment) {
    throw new Error(await getErrorMessage("appointmentNotFound"))
  }

  let newStart = appointment.start
  let newEnd = appointment.end

  if (data.startTime) {
    newStart = new Date(data.startTime)
    const currentDuration = appointment.end.getTime() - appointment.start.getTime()
    newEnd = new Date(newStart.getTime() + currentDuration)
  }

  if (data.durationMinutes) {
    newEnd = new Date(newStart.getTime() + data.durationMinutes * 60_000)
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        if (!data.forceOverlap) {
          const conflictingAppointment = await tx.appointment.findFirst({
            where: {
              userId,
              id: { not: data.id },
              status: { not: "CANCELED" },
              start: { lt: newEnd },
              end: { gt: newStart },
            },
            select: { id: true },
          })

          if (conflictingAppointment) {
            throw new Error("CONFLICT: " + await getErrorMessage("slotNotAvailable"))
          }
        }

        return tx.appointment.update({
          where: { id: data.id },
          data: {
            start: newStart,
            end: newEnd,
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
      throw new Error("CONFLICT: " + await getErrorMessage("slotNotAvailable"))
    }

    throw error
  }
}

export async function getWeekCalendarData(startDate: string, endDate: string) {
  const userId = await requireCoreAppAccess()

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { openingHours: true },
  })

  const openingHours = parseOpeningHours(user.openingHours)

  const exceptions = await prisma.scheduleException.findMany({
    where: {
      userId,
      date: {
        gte: new Date(startDate + "T00:00:00Z"),
        lte: new Date(endDate + "T23:59:59Z"),
      },
    },
    select: {
      id: true,
      date: true,
      type: true,
      startTime: true,
      endTime: true,
    },
  })

  const scheduleWindows = computeWeekSchedule({
    openingHours,
    exceptions,
    startDate,
    endDate,
  })

  return { scheduleWindows }
}
