"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { getErrorMessage } from "@/lib/i18n/errors"

export async function getAppointments(start: Date, end: Date) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) return []

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: session.user.id,
      start: { gte: start },
      end: { lte: end },
      status: { not: "CANCELED" },
    },
    include: {
      patient: true,
      service: true,
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
  end: Date
  notes?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error(await getErrorMessage("unauthorized"))
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: data.patientId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!patient) {
    throw new Error(await getErrorMessage("patientNotFound"))
  }

  const service = await prisma.service.findFirst({
    where: {
      id: data.serviceId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  })

  if (!service) {
    throw new Error(await getErrorMessage("serviceNotFound"))
  }

  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      userId: session.user.id,
      status: {
        not: "CANCELED",
      },
      start: {
        lt: data.end,
      },
      end: {
        gt: data.start,
      },
    },
    select: {
      id: true,
    },
  })

  if (conflictingAppointment) {
    throw new Error(await getErrorMessage("slotNotAvailable"))
  }

  return prisma.appointment.create({
    data: {
      ...data,
      notes: data.notes?.trim() || undefined,
      userId: session.user.id,
    },
  })
}
