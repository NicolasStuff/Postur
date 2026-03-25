"use server"

import { z } from "zod"

import { requireCoreAppAccess } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"

const timeRegex = /^\d{2}:\d{2}$/

const createScheduleExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["ADDED", "BLOCKED"]),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  reason: z.string().max(500).optional(),
})

const updateScheduleExceptionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
})

export async function createScheduleException(data: {
  date: string
  type: "ADDED" | "BLOCKED"
  startTime?: string
  endTime?: string
  reason?: string
}) {
  const userId = await requireCoreAppAccess()

  const parsed = createScheduleExceptionSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  return prisma.scheduleException.create({
    data: {
      userId,
      date: new Date(parsed.data.date + "T00:00:00Z"),
      type: parsed.data.type,
      startTime: parsed.data.startTime ?? null,
      endTime: parsed.data.endTime ?? null,
      reason: parsed.data.reason ?? null,
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

  const parsed = updateScheduleExceptionSchema.safeParse(data)
  if (!parsed.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const existing = await prisma.scheduleException.findFirst({
    where: { id: parsed.data.id, userId },
  })

  if (!existing) {
    throw new Error(await getErrorMessage("notFound"))
  }

  return prisma.scheduleException.update({
    where: { id: parsed.data.id, userId },
    data: {
      date: new Date(parsed.data.date + "T00:00:00Z"),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
    },
  })
}

export async function deleteScheduleException(data: { id: string }) {
  const userId = await requireCoreAppAccess()

  const existing = await prisma.scheduleException.findFirst({
    where: { id: data.id, userId },
  })

  if (!existing) {
    throw new Error(await getErrorMessage("notFound"))
  }

  return prisma.scheduleException.delete({
    where: { id: data.id, userId },
  })
}
