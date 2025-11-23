"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns"
import { getErrorMessage } from "@/lib/i18n/errors"

export async function getDashboardData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error(await getErrorMessage("unauthorized"))
  }

  const userId = session.user.id
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  // Get today's appointments
  const todayAppointments = await prisma.appointment.count({
    where: {
      userId,
      start: {
        gte: todayStart,
        lte: todayEnd,
      },
      status: {
        not: "CANCELED",
      },
    },
  })

  // Get this week's appointments
  const weekAppointments = await prisma.appointment.count({
    where: {
      userId,
      start: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: {
        not: "CANCELED",
      },
    },
  })

  // Get total patients
  const totalPatients = await prisma.patient.count({
    where: {
      userId,
    },
  })

  // Get upcoming appointments (next 5)
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      userId,
      start: {
        gte: now,
      },
      status: {
        not: "CANCELED",
      },
    },
    include: {
      patient: true,
      service: true,
    },
    orderBy: {
      start: "asc",
    },
    take: 5,
  })

  return {
    todayAppointments,
    weekAppointments,
    totalPatients,
    upcomingAppointments,
  }
}
