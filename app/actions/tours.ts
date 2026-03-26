"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import type { TourId } from "@/lib/product-tour/types"

export async function markTourCompleted(tourId: TourId) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) return

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { completedTours: true },
  })

  const currentTours = Array.isArray(user?.completedTours)
    ? (user.completedTours as string[])
    : []

  if (currentTours.includes(tourId)) return

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      completedTours: [...currentTours, tourId],
    },
  })
}

export async function getUserCompletedTours(): Promise<string[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) return []

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { completedTours: true },
  })

  return Array.isArray(user?.completedTours)
    ? (user.completedTours as string[])
    : []
}
