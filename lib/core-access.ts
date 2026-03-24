import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { getErrorMessage } from "@/lib/i18n/errors"
import { prisma } from "@/lib/prisma"
import { hasCoreAppAccess } from "@/lib/subscription-access"

export async function requireSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user.id) {
    throw new Error(await getErrorMessage("unauthorized"))
  }

  return session.user.id
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
