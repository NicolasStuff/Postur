import { ConsultationAudioMeta, ConsultationTranscript } from "@/lib/consultation-note"

interface DeepgramWord {
  word?: string
  punctuated_word?: string
  start?: number
  end?: number
  speaker?: number
}

interface DeepgramParagraphSentence {
  text?: string
  start?: number
  end?: number
  speaker?: number
}

interface DeepgramParagraph {
  sentences?: DeepgramParagraphSentence[]
  speaker?: number
  start?: number
  end?: number
}

interface DeepgramAlternative {
  transcript?: string
  words?: DeepgramWord[]
  paragraphs?: {
    transcript?: string
    paragraphs?: DeepgramParagraph[]
  }
}

interface DeepgramListenResponse {
  metadata?: {
    duration?: number
    models?: string[]
    model_info?: Record<string, { name?: string }>
  }
  results?: {
    channels?: Array<{
      alternatives?: DeepgramAlternative[]
    }>
  }
}

export interface DeepgramTranscriptionInput {
  audioBody: ReadableStream<Uint8Array>
  fileName: string
  mimeType: string
  source: "recorded" | "uploaded"
  language?: string
  keyterms?: string[]
}

export interface DeepgramTranscriptionResult {
  transcript: ConsultationTranscript
  audioMeta: ConsultationAudioMeta
}

function getDeepgramApiKey() {
  const apiKey = process.env.DEEPGRAM_API_KEY

  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not set")
  }

  return apiKey
}

function formatSpeakerLabel(speaker: number | undefined) {
  if (typeof speaker !== "number" || Number.isNaN(speaker)) {
    return "Intervenant"
  }

  return `Speaker ${speaker + 1}`
}

function buildSegments(alternative: DeepgramAlternative) {
  const paragraphSegments =
    alternative.paragraphs?.paragraphs
      ?.map((paragraph) => {
        const sentenceText = paragraph.sentences
          ?.map((sentence) => sentence.text?.trim())
          .filter(Boolean)
          .join(" ")
          .trim()

        if (!sentenceText) {
          return null
        }

        const firstSentence = paragraph.sentences?.[0]
        const lastSentence = paragraph.sentences?.[paragraph.sentences.length - 1]
        const speaker =
          typeof paragraph.speaker === "number" ? paragraph.speaker : firstSentence?.speaker

        return {
          speaker: formatSpeakerLabel(speaker),
          text: sentenceText,
          start: Math.round(((paragraph.start ?? firstSentence?.start) ?? 0) * 1000),
          end: Math.round(((paragraph.end ?? lastSentence?.end) ?? 0) * 1000),
        }
      })
      .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment)) ?? []

  if (paragraphSegments.length > 0) {
    return paragraphSegments
  }

  const words = alternative.words ?? []

  if (words.length === 0) {
    return []
  }

  const groupedSegments: Array<{
    speaker: string
    text: string
    start: number
    end: number
  }> = []

  for (const word of words) {
    const token = word.punctuated_word ?? word.word ?? ""
    if (!token) {
      continue
    }

    const speaker = formatSpeakerLabel(word.speaker)
    const start = Math.round((word.start ?? 0) * 1000)
    const end = Math.round((word.end ?? word.start ?? 0) * 1000)
    const lastSegment = groupedSegments[groupedSegments.length - 1]

    if (lastSegment && lastSegment.speaker === speaker) {
      lastSegment.text = `${lastSegment.text} ${token}`.trim()
      lastSegment.end = end
      continue
    }

    groupedSegments.push({
      speaker,
      text: token,
      start,
      end,
    })
  }

  return groupedSegments
}

function getAlternative(data: DeepgramListenResponse) {
  return data.results?.channels?.[0]?.alternatives?.[0]
}

function getDetectedModel(data: DeepgramListenResponse) {
  if (Array.isArray(data.metadata?.models) && data.metadata.models.length > 0) {
    return data.metadata.models[0]
  }

  const modelInfo = data.metadata?.model_info

  if (!modelInfo) {
    return "nova-3"
  }

  const firstModel = Object.values(modelInfo)[0]
  return firstModel?.name ?? "nova-3"
}

export class DeepgramTranscriptionProvider {
  async transcribe(input: DeepgramTranscriptionInput): Promise<DeepgramTranscriptionResult> {
    const apiKey = getDeepgramApiKey()
    const searchParams = new URLSearchParams({
      model: "nova-3",
      language: input.language ?? "fr",
      diarize: "true",
      smart_format: "true",
      paragraphs: "true",
    })

    for (const keyterm of input.keyterms ?? []) {
      if (keyterm.trim()) {
        searchParams.append("keyterm", keyterm.trim())
      }
    }

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${searchParams.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": input.mimeType || "audio/webm",
        },
        body: input.audioBody,
        cache: "no-store",
        // Workaround: duplex "half" is required for streaming a ReadableStream body with fetch in Node.js
        duplex: "half",
      } as RequestInit & { duplex: "half" }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Deepgram transcription failed: ${errorText}`)
    }

    const data = (await response.json()) as DeepgramListenResponse
    const alternative = getAlternative(data)
    const transcriptText =
      alternative?.paragraphs?.transcript?.trim() ?? alternative?.transcript?.trim() ?? ""

    if (!transcriptText) {
      throw new Error("Deepgram returned an empty transcript")
    }

    const generatedAt = new Date().toISOString()
    const model = getDetectedModel(data)
    const durationMs = Math.round((data.metadata?.duration ?? 0) * 1000)

    return {
      transcript: {
        text: transcriptText,
        segments: buildSegments(alternative ?? {}),
        language: input.language ?? "fr",
        durationMs,
        model,
        generatedAt,
      },
      audioMeta: {
        source: input.source,
        fileName: input.fileName,
        mimeType: input.mimeType,
        durationMs,
        model,
        generatedAt,
      },
    }
  }
}

export const deepgramTranscriptionProvider = new DeepgramTranscriptionProvider()
