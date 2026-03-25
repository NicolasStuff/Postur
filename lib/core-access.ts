import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"
import { hasCoreAppAccess } from "@/lib/subscription-access"

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export async function requireSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user.id) {
    throw new UnauthorizedError(await getErrorMessage("unauthorized"))
  }

  return session.user
}

export async function requireSessionUserId() {
  const user = await requireSessionUser()
  return user.id
}

export async function requireAdminAccess() {
  const user = await requireSessionUser()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      email: true,
      name: true,
    },
  })

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new UnauthorizedError(await getErrorMessage("unauthorized"))
  }

  return dbUser
}

export async function requireCoreAppAccess() {
  const userId = await requireSessionUserId()
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      status: true,
    },
  })

  if (!hasCoreAppAccess(subscription)) {
    throw new Error(await getErrorMessage("subscriptionRequired"))
  }

  return userId
}
