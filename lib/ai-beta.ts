import { prisma } from "@/lib/prisma"
import { getErrorMessage } from "@/lib/i18n/errors"

export const AI_BETA_COMPLIANCE_VERSION = "2026-03-health-beta-v1"

export async function getAiBetaStatus(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      aiFeaturesConsentAt: true,
      aiBetaEnabled: true,
      aiComplianceAcceptedAt: true,
      aiComplianceVersion: true,
    },
  })
}

export async function assertAiBetaEnabled(userId: string) {
  const status = await getAiBetaStatus(userId)

  if (
    !status ||
    (!status.aiFeaturesConsentAt && (!status.aiBetaEnabled || !status.aiComplianceAcceptedAt))
  ) {
    throw new Error(await getErrorMessage("aiConsentRequired"))
  }

  return status
}
