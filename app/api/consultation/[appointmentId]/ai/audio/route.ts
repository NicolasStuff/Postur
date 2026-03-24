import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { fileTypeFromBuffer } from "file-type"
import { auth } from "@/lib/auth"
import { deepgramTranscriptionProvider } from "@/lib/ai/deepgram"
import { assertAiBetaEnabled } from "@/lib/ai-beta"
import { openAIClinicalGenerationProvider } from "@/lib/ai/openai"
import { recordAuditEventSafe } from "@/lib/audit"
import { bodyPartLabels, normalizeBodyChartPartIds } from "@/lib/bodyChartLabels"
import { getErrorMessage } from "@/lib/i18n/errors"
import {
  extractTextFromTipTap,
  normalizeConsultationContent,
} from "@/lib/consultation-note"
import { applyConsultationContentPatch } from "@/lib/consultation-note-store"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit, RateLimitExceededError } from "@/lib/rate-limit"
import { canSubscriptionAccessFeature } from "@/lib/subscription-access"
import { headers } from "next/headers"

async function createErrorResponse(
  errorCode:
    | "UNAUTHORIZED"
    | "AI_FEATURE_UNAVAILABLE"
    | "AI_AUDIO_FILE_REQUIRED"
    | "AI_AUDIO_EMPTY"
    | "AI_AUDIO_TOO_LARGE"
    | "AI_AUDIO_INVALID_TYPE"
    | "AI_CONSENT_REQUIRED"
    | "APPOINTMENT_NOT_FOUND"
    | "AI_AUDIO_PROCESSING_FAILED"
    | "TOO_MANY_REQUESTS",
  status: number,
  messageKey: string
) {
  return NextResponse.json(
    {
      errorCode,
      error: await getErrorMessage(messageKey),
    },
    { status }
  )
}

function buildKeyterms(input: {
  serviceName: string
}) {
  return [
    input.serviceName,
    "ostéopathie",
    "ostéopathe",
    "cervical",
    "lombaire",
    "thoracique",
    "sacrum",
    "iliaque",
    "diaphragme",
    "viscéral",
    "crânien",
  ].filter((term, index, allTerms) => term && allTerms.indexOf(term) === index)
}

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
])

async function sniffAudioUpload(file: File) {
  const reader = file.stream().getReader()
  const firstChunk = await reader.read()

  if (firstChunk.done || !firstChunk.value || firstChunk.value.length === 0) {
    await reader.cancel()
    throw new Error("EMPTY_AUDIO_STREAM")
  }

  const detectedType = await fileTypeFromBuffer(Buffer.from(firstChunk.value))
  if (!detectedType || !ALLOWED_AUDIO_MIME_TYPES.has(detectedType.mime)) {
    await reader.cancel()
    throw new Error("INVALID_AUDIO_TYPE")
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(firstChunk.value)

      const pump = (): void => {
        void reader.read().then(({ done, value }) => {
          if (done) {
            controller.close()
            return
          }

          if (value) {
            controller.enqueue(value)
          }

          pump()
        }).catch((error) => {
          controller.error(error)
        })
      }

      pump()
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })

  return {
    mimeType: detectedType.mime,
    stream,
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return createErrorResponse("UNAUTHORIZED", 401, "unauthorized")
    }

    await enforceRateLimit({
      scope: "ai-audio-upload",
      key: session.user.id,
      limit: 10,
      windowMs: 60 * 60 * 1000,
      message: await getErrorMessage("tooManyRequests"),
    })

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        plan: true,
        status: true,
      },
    })

    if (!canSubscriptionAccessFeature(subscription, "ai_audio_soap")) {
      return createErrorResponse("AI_FEATURE_UNAVAILABLE", 403, "aiFeatureUnavailable")
    }

    try {
      await assertAiBetaEnabled(session.user.id)
    } catch {
      return createErrorResponse("AI_CONSENT_REQUIRED", 403, "aiConsentRequired")
    }

    const { appointmentId } = await context.params
    const formData = await request.formData()
    const file = formData.get("file")
    const sourceValue = formData.get("source")
    const source = sourceValue === "recorded" ? "recorded" : "uploaded"
    const hasLocalNoteText = formData.has("noteText")
    const localNoteTextValue = formData.get("noteText")
    const hasLocalBodyChart = formData.has("bodyChart")
    const localBodyChartValue = formData.get("bodyChart")

    if (!(file instanceof File)) {
      return createErrorResponse("AI_AUDIO_FILE_REQUIRED", 400, "aiAudioFileRequired")
    }

    if (file.size === 0) {
      return createErrorResponse("AI_AUDIO_EMPTY", 400, "aiAudioEmpty")
    }

    if (file.size > 30_000_000) {
      return createErrorResponse("AI_AUDIO_TOO_LARGE", 413, "aiAudioTooLarge")
    }

    const sniffedAudio = await sniffAudioUpload(file)

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: session.user.id,
      },
      include: {
        note: true,
        service: true,
      },
    })

    if (!appointment) {
      return createErrorResponse("APPOINTMENT_NOT_FOUND", 404, "appointmentNotFound")
    }

    const transcription = await deepgramTranscriptionProvider.transcribe({
      audioBody: sniffedAudio.stream,
      fileName: file.name,
      mimeType: sniffedAudio.mimeType,
      source,
      language: "fr",
      keyterms: buildKeyterms({
        serviceName: appointment.service.name,
      }),
    })

    const latestNote = await prisma.consultationNote.findUnique({
      where: {
        appointmentId,
      },
      select: {
        content: true,
      },
    })
    const latestContent = normalizeConsultationContent(
      latestNote?.content ?? appointment.note?.content
    )
    const latestPersistedBodyChart = latestContent.bodyChart
    const latestPersistedNoteText = extractTextFromTipTap(latestContent.editor)
    const localNoteText =
      hasLocalNoteText && typeof localNoteTextValue === "string"
        ? localNoteTextValue
        : latestPersistedNoteText
    const localBodyChart = (() => {
      if (!hasLocalBodyChart || typeof localBodyChartValue !== "string") {
        return latestPersistedBodyChart
      }

      try {
        const parsed = JSON.parse(localBodyChartValue)
        return Array.isArray(parsed)
          ? normalizeBodyChartPartIds(
              parsed.filter((part): part is string => typeof part === "string")
            )
          : latestPersistedBodyChart
      } catch {
        return latestPersistedBodyChart
      }
    })()

    const soapDraft = await openAIClinicalGenerationProvider.generateSoapDraft({
      serviceName: appointment.service.name,
      transcript: transcription.transcript.text,
      bodyChartLabels: localBodyChart.map((part) => bodyPartLabels[part] ?? part),
      existingNoteText: localNoteText,
    })

    await applyConsultationContentPatch(
      appointmentId,
      {
        ai: {
          transcript: transcription.transcript,
          audioMeta: transcription.audioMeta,
          soapDraft,
        },
      } as unknown as Prisma.InputJsonValue
    )

    await recordAuditEventSafe(prisma, {
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      domain: "AI",
      action: "AI_AUDIO_TRANSCRIBED",
      entityType: "Appointment",
      entityId: appointmentId,
      metadata: {
        source,
        mimeType: sniffedAudio.mimeType,
        durationMs: transcription.audioMeta.durationMs,
      },
    })

    return NextResponse.json({
      transcript: transcription.transcript,
      audioMeta: transcription.audioMeta,
      soapDraft,
    })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return createErrorResponse("TOO_MANY_REQUESTS", 429, "tooManyRequests")
    }

    if (error instanceof Error && error.message === "INVALID_AUDIO_TYPE") {
      return createErrorResponse("AI_AUDIO_INVALID_TYPE", 400, "validationError")
    }

    if (error instanceof Error && error.message === "EMPTY_AUDIO_STREAM") {
      return createErrorResponse("AI_AUDIO_EMPTY", 400, "aiAudioEmpty")
    }

    console.error("Audio transcription failed:", error)
    return createErrorResponse("AI_AUDIO_PROCESSING_FAILED", 500, "aiAudioProcessingFailed")
  }
}
