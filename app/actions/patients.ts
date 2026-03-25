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

const updatePatientSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
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

export async function getPatient(patientId: string) {
  const userId = await requireCoreAppAccess()

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, userId },
    include: {
      appointments: {
        orderBy: { start: "desc" },
        select: {
          id: true,
          start: true,
          end: true,
          status: true,
          completedAt: true,
          billedAt: true,
          service: {
            select: { name: true, price: true, duration: true },
          },
          note: {
            select: { id: true },
          },
          invoice: {
            select: { id: true, number: true, status: true },
          },
        },
      },
      invoices: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          number: true,
          date: true,
          amount: true,
          vatAmount: true,
          status: true,
          serviceName: true,
          appointmentId: true,
        },
      },
    },
  })

  if (!patient) return null

  return {
    ...patient,
    appointments: patient.appointments.map((a) => ({
      ...a,
      service: {
        ...a.service,
        price: a.service.price.toNumber(),
      },
    })),
    invoices: patient.invoices.map((inv) => ({
      ...inv,
      amount: inv.amount.toNumber(),
      vatAmount: inv.vatAmount?.toNumber() ?? 0,
    })),
  }
}

export async function updatePatient(
  patientId: string,
  data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }
) {
  const userId = await requireCoreAppAccess()
  const parsedInput = updatePatientSchema.safeParse(data)

  if (!parsedInput.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const patient = await prisma.patient.update({
    where: { id_userId: { id: patientId, userId } },
    data: {
      firstName: parsedInput.data.firstName.trim(),
      lastName: parsedInput.data.lastName.trim(),
      email: parsedInput.data.email?.trim().toLowerCase() || null,
      phone: parsedInput.data.phone?.trim() || null,
      address: parsedInput.data.address?.trim() || null,
      notes: parsedInput.data.notes?.trim() || null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      notes: true,
      createdAt: true,
    },
  })

  await recordAuditEventSafe(prisma, {
    actorUserId: userId,
    targetUserId: userId,
    domain: "PATIENT",
    action: "PATIENT_UPDATED",
    entityType: "Patient",
    entityId: patient.id,
    metadata: {
      firstName: patient.firstName,
      lastName: patient.lastName,
    },
  })

  return patient
}
