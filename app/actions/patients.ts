"use server"

import { z } from "zod"

import { recordAuditEventSafe } from "@/lib/audit"
import { requireCoreAppAccess } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"

const patientSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(32).optional(),
})

export async function getPatients() {
  const userId = await requireCoreAppAccess()

  return prisma.patient.findMany({
    where: { userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function createPatient(data: {
  firstName: string
  lastName: string
  email?: string
  phone?: string
}) {
  const userId = await requireCoreAppAccess()
  const parsedInput = patientSchema.safeParse(data)

  if (!parsedInput.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const patient = await prisma.patient.create({
    data: {
      userId,
      firstName: parsedInput.data.firstName.trim(),
      lastName: parsedInput.data.lastName.trim(),
      email: parsedInput.data.email?.trim().toLowerCase() || undefined,
      phone: parsedInput.data.phone?.trim() || undefined,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "PATIENT",
    action: "PATIENT_CREATED",
    entityType: "Patient",
    entityId: patient.id,
    metadata: {
      firstName: patient.firstName,
      lastName: patient.lastName,
    },
  })

  return patient
}
