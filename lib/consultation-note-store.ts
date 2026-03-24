import { Prisma } from "@prisma/client"

import {
  mergeConsultationContent,
  normalizeConsultationContent,
  serializeConsultationContent,
} from "@/lib/consultation-note"
import { prisma } from "@/lib/prisma"

interface LockedConsultationNoteRow {
  id: string
  content: Prisma.JsonValue | null
}

const MAX_SERIALIZABLE_RETRIES = 3

function isSerializationFailure(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2034"
  }

  return error instanceof Error && /serialize|serialization/i.test(error.message)
}

export async function applyConsultationContentPatchInTransaction(
  tx: Prisma.TransactionClient,
  appointmentId: string,
  patch: Prisma.InputJsonValue
) {
  await tx.consultationNote.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      content: serializeConsultationContent(normalizeConsultationContent(null)),
    },
    update: {
      updatedAt: new Date(),
    },
  })

  const lockedRows = await tx.$queryRaw<LockedConsultationNoteRow[]>`
    SELECT "id", "content"
    FROM "ConsultationNote"
    WHERE "appointmentId" = ${appointmentId}
    FOR UPDATE
  `

  const lockedRow = lockedRows[0]

  if (!lockedRow) {
    throw new Error("Failed to lock consultation note")
  }

  const mergedContent = mergeConsultationContent(lockedRow.content, patch)

  return tx.consultationNote.update({
    where: { id: lockedRow.id },
    data: {
      content: serializeConsultationContent(mergedContent),
    },
  })
}

export async function applyConsultationContentPatch(
  appointmentId: string,
  patch: Prisma.InputJsonValue
) {
  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => applyConsultationContentPatchInTransaction(tx, appointmentId, patch),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      )
    } catch (error) {
      if (attempt === MAX_SERIALIZABLE_RETRIES || !isSerializationFailure(error)) {
        throw error
      }
    }
  }

  throw new Error("Failed to apply consultation content patch")
}
