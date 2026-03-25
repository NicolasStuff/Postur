"use server"

import { requireCoreAppAccess } from "@/lib/core-access"
import { prisma } from "@/lib/prisma"

export async function createScheduleException(data: {
  date: string
  type: "ADDED" | "BLOCKED"
  startTime?: string
  endTime?: string
  reason?: string
}) {
  const userId = await requireCoreAppAccess()

  return prisma.scheduleException.create({
    data: {
      userId,
      date: new Date(data.date + "T00:00:00Z"),
      type: data.type,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      reason: data.reason ?? null,
    },
  })
}

export async function updateScheduleException(data: {
  id: string
  date: string
  startTime: string
  endTime: string
}) {
  const userId = await requireCoreAppAccess()

  const existing = await prisma.scheduleException.findFirst({
    where: { id: data.id, userId },
  })

  if (!existing) {
    throw new Error("Schedule exception not found")
  }

  return prisma.scheduleException.update({
    where: { id: data.id },
    data: {
      date: new Date(data.date + "T00:00:00Z"),
      startTime: data.startTime,
      endTime: data.endTime,
    },
  })
}

export async function deleteScheduleException(data: { id: string }) {
  const userId = await requireCoreAppAccess()

  const existing = await prisma.scheduleException.findFirst({
    where: { id: data.id, userId },
  })

  if (!existing) {
    throw new Error("Schedule exception not found")
  }

  return prisma.scheduleException.delete({
    where: { id: data.id },
  })
}
