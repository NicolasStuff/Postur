"use server"

import { z } from "zod"

import { requireCoreAppAccess } from "@/lib/core-access"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  duration: z.number().int().min(15).max(480).refine((value) => value % 15 === 0),
  price: z.number().min(0).max(1000),
})

function normalizePrice(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export async function getServices() {
  const userId = await requireCoreAppAccess()

  const services = await prisma.service.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
    },
  })

  return services.map((service) => ({
    ...service,
    price: service.price.toNumber(),
  }))
}

export async function createService(data: { name: string; duration: number; price: number }) {
  const userId = await requireCoreAppAccess()
  const parsedInput = serviceSchema.safeParse(data)

  if (!parsedInput.success) {
    throw new Error(await getErrorMessage("validationError"))
  }

  const service = await prisma.service.create({
    data: {
      userId,
      name: parsedInput.data.name.trim(),
      duration: parsedInput.data.duration,
      price: normalizePrice(parsedInput.data.price),
    },
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
    },
  })

  return { ...service, price: service.price.toNumber() }
}
