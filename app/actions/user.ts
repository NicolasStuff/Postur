"use server"

import { auth } from "@/lib/auth";
import { AI_BETA_COMPLIANCE_VERSION } from "@/lib/ai-beta";
import { recordAuditEventSafe } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getErrorMessage } from "@/lib/i18n/errors";
import {
  getMissingOnboardingFields,
  getSiretValidationError,
  getSlugValidationError,
  normalizeOptionalText,
  normalizeOnboardingProfile,
  normalizeSiret,
  normalizeSlug,
} from "@/lib/onboarding";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateUserProfileSchema = z.object({
  name: z.string().max(120).optional(),
  companyName: z.string().max(120).optional(),
  companyAddress: z.string().max(200).optional(),
  siret: z.string().max(32).optional(),
  isVatExempt: z.boolean().optional(),
  defaultVatRate: z.number().min(0).max(100).nullable().optional(),
  slug: z.string().max(120).optional(),
  practitionerType: z.enum(["OSTEOPATH"]).optional(),
  openingHours: z.custom<Prisma.InputJsonValue>().optional(),
  language: z.string().trim().min(2).max(10).optional(),
});

export async function getUserProfile() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) return null;

    return await prisma.user.findUnique({
        where: { id: session.user.id }
    })
}

export async function setAiBetaParticipation(enabled: boolean) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: enabled
            ? {
                aiFeaturesConsentAt: new Date(),
                aiBetaEnabled: true,
                aiComplianceAcceptedAt: new Date(),
                aiComplianceVersion: AI_BETA_COMPLIANCE_VERSION,
            }
            : {
                aiFeaturesConsentAt: null,
                aiBetaEnabled: false,
            },
    })

    await recordAuditEventSafe(prisma, {
        actorUserId: session.user.id,
        targetUserId: session.user.id,
        domain: "AI",
        action: enabled ? "AI_BETA_ENABLED" : "AI_BETA_DISABLED",
        entityType: "User",
        entityId: session.user.id,
        metadata: {
            aiComplianceVersion: AI_BETA_COMPLIANCE_VERSION,
        },
    })

    return updatedUser
}

export async function updateUserProfile(data: {
    name?: string,
    companyName?: string,
    companyAddress?: string,
    siret?: string,
    isVatExempt?: boolean,
    defaultVatRate?: number | null,
    slug?: string,
    practitionerType?: "OSTEOPATH",
    openingHours?: Prisma.InputJsonValue,
    language?: string
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        throw new Error(await getErrorMessage("unauthorized"));
    }

    const parsedData = updateUserProfileSchema.safeParse(data)
    if (!parsedData.success) {
        throw new Error(await getErrorMessage("validationError"));
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            practitionerType: true,
            slug: true,
            companyName: true,
            companyAddress: true,
            siret: true,
            isVatExempt: true,
            defaultVatRate: true,
        }
    })

    if (!currentUser) {
        throw new Error(await getErrorMessage("notFound"));
    }

    const normalizedData = {
        name: normalizeOptionalText(parsedData.data.name),
        companyName: normalizeOptionalText(parsedData.data.companyName),
        companyAddress: normalizeOptionalText(parsedData.data.companyAddress),
        siret: normalizeSiret(parsedData.data.siret),
        isVatExempt: parsedData.data.isVatExempt,
        defaultVatRate:
            parsedData.data.defaultVatRate === null || parsedData.data.defaultVatRate === undefined
                ? parsedData.data.defaultVatRate
                : Math.round((parsedData.data.defaultVatRate + Number.EPSILON) * 100) / 100,
        slug: normalizeSlug(parsedData.data.slug),
        practitionerType: parsedData.data.practitionerType,
        openingHours: parsedData.data.openingHours,
        language: parsedData.data.language,
    }
    const normalizedCurrentProfile = normalizeOnboardingProfile(currentUser)

    const nextProfile = {
        name: normalizedData.name === undefined ? currentUser.name : normalizedData.name,
        practitionerType: normalizedData.practitionerType === undefined ? normalizedCurrentProfile.practitionerType : normalizedData.practitionerType,
        slug: normalizedData.slug === undefined ? normalizedCurrentProfile.slug : normalizedData.slug,
        companyName: normalizedData.companyName === undefined ? normalizedCurrentProfile.companyName : normalizedData.companyName,
        companyAddress: normalizedData.companyAddress === undefined ? normalizedCurrentProfile.companyAddress : normalizedData.companyAddress,
        siret: normalizedData.siret === undefined ? normalizedCurrentProfile.siret : normalizedData.siret,
        isVatExempt: normalizedData.isVatExempt === undefined ? currentUser.isVatExempt : normalizedData.isVatExempt,
        defaultVatRate: normalizedData.defaultVatRate === undefined ? currentUser.defaultVatRate : normalizedData.defaultVatRate,
    }

    const onboardingStarted = Boolean(currentUser.practitionerType || normalizedData.practitionerType)
    if (onboardingStarted) {
        const missingFields = getMissingOnboardingFields(nextProfile)
        if (missingFields.length > 0) {
            throw new Error(await getErrorMessage("profileIncomplete"));
        }
    }

    const slugValidationError = getSlugValidationError(nextProfile.slug)
    if (slugValidationError === "invalid") {
        throw new Error(await getErrorMessage("invalidSlug"));
    }
    if (slugValidationError === "reserved") {
            throw new Error(await getErrorMessage("reservedSlug"));
    }

    const siretValidationError = getSiretValidationError(nextProfile.siret)
    if (siretValidationError === "invalid") {
        throw new Error(await getErrorMessage("invalidSiret"));
    }

    if (nextProfile.isVatExempt === false && (!nextProfile.defaultVatRate || Number(nextProfile.defaultVatRate) <= 0)) {
        throw new Error(await getErrorMessage("defaultVatRateRequired"));
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: normalizedData,
        })

        await recordAuditEventSafe(prisma, {
            actorUserId: session.user.id,
            targetUserId: session.user.id,
            domain: "AUTH",
            action: "PROFILE_UPDATED",
            entityType: "User",
            entityId: session.user.id,
            metadata: {
                updatedFields: Object.entries(normalizedData)
                    .filter(([, value]) => value !== undefined)
                    .map(([key]) => key),
            },
        })

        return updatedUser
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : ""

            if (target.includes("slug")) {
                throw new Error(await getErrorMessage("slugAlreadyExists"));
            }

            throw new Error(await getErrorMessage("duplicateEntry"));
        }

        throw error;
    }
}
