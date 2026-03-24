import { Prisma } from "@prisma/client"

import { normalizeBodyChartPartIds } from "@/lib/bodyChartLabels"

export interface ConsultationTranscriptSegment {
  speaker: string
  text: string
  start: number
  end: number
}

export interface ConsultationTranscript {
  text: string
  segments: ConsultationTranscriptSegment[]
  language: string
  durationMs: number
  model: string
  generatedAt: string
}

export interface ConsultationAudioMeta {
  source: "recorded" | "uploaded"
  fileName: string
  mimeType: string
  durationMs: number
  model: string
  generatedAt: string
}

export interface SoapDraftSection {
  label: string
  content: string
}

export interface SoapDraft {
  sections: SoapDraftSection[]
  summary: string
  generatedAt: string
  model: string
}

export interface SmartNoteSuggestion {
  id: string
  text: string
  reason: string
  confidence: "low" | "medium" | "high"
  inputMode: "chart-only" | "notes-only" | "combined" | "conflict"
}

export interface PatientRecap {
  summary: string
  advice: string[]
  exercises: string[]
  precautions: string[]
  followUp: string
  generatedAt: string
  model: string
}

export interface ConsultationAIState {
  transcript: ConsultationTranscript | null
  audioMeta: ConsultationAudioMeta | null
  soapDraft: SoapDraft | null
  smartNotes: SmartNoteSuggestion[]
  patientRecap: PatientRecap | null
}

export interface ConsultationNoteContent {
  editor: unknown | null
  bodyChart: string[]
  ai: ConsultationAIState
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function normalizeTranscriptSegments(value: unknown): ConsultationTranscriptSegment[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isPlainObject)
    .map((segment) => ({
      speaker: normalizeString(segment.speaker),
      text: normalizeString(segment.text),
      start: normalizeNumber(segment.start),
      end: normalizeNumber(segment.end),
    }))
    .filter((segment) => segment.text.length > 0)
}

function normalizeTranscript(value: unknown): ConsultationTranscript | null {
  if (!isPlainObject(value)) {
    return null
  }

  const text = normalizeString(value.text)
  if (!text) {
    return null
  }

  return {
    text,
    segments: normalizeTranscriptSegments(value.segments),
    language: normalizeString(value.language) || "fr",
    durationMs: normalizeNumber(value.durationMs),
    model: normalizeString(value.model),
    generatedAt: normalizeString(value.generatedAt),
  }
}

function normalizeAudioMeta(value: unknown): ConsultationAudioMeta | null {
  if (!isPlainObject(value)) {
    return null
  }

  const source = value.source === "recorded" ? "recorded" : value.source === "uploaded" ? "uploaded" : null
  if (!source) {
    return null
  }

  return {
    source,
    fileName: normalizeString(value.fileName),
    mimeType: normalizeString(value.mimeType),
    durationMs: normalizeNumber(value.durationMs),
    model: normalizeString(value.model),
    generatedAt: normalizeString(value.generatedAt),
  }
}

function normalizeSoapDraft(value: unknown): SoapDraft | null {
  if (!isPlainObject(value) || !Array.isArray(value.sections)) {
    return null
  }

  const sections = value.sections
    .filter(isPlainObject)
    .map((section) => ({
      label: normalizeString(section.label),
      content: normalizeString(section.content),
    }))
    .filter((section) => section.label && section.content)

  if (sections.length === 0) {
    return null
  }

  return {
    sections,
    summary: normalizeString(value.summary),
    generatedAt: normalizeString(value.generatedAt),
    model: normalizeString(value.model),
  }
}

function normalizeSmartNotes(value: unknown): SmartNoteSuggestion[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isPlainObject)
    .map((item, index) => {
      const confidence: SmartNoteSuggestion["confidence"] =
        item.confidence === "low" || item.confidence === "medium" || item.confidence === "high"
          ? item.confidence
          : "medium"

      const inputMode: SmartNoteSuggestion["inputMode"] =
        item.inputMode === "chart-only" ||
        item.inputMode === "notes-only" ||
        item.inputMode === "combined" ||
        item.inputMode === "conflict"
          ? item.inputMode
          : "combined"

      return {
        id: normalizeString(item.id) || `smart-note-${index + 1}`,
        text: normalizeString(item.text),
        reason: normalizeString(item.reason),
        confidence,
        inputMode,
      }
    })
    .filter((item) => item.text.length > 0)
}

function normalizePatientRecap(value: unknown): PatientRecap | null {
  if (!isPlainObject(value)) {
    return null
  }

  const summary = normalizeString(value.summary)
  if (!summary) {
    return null
  }

  return {
    summary,
    advice: normalizeStringArray(value.advice),
    exercises: normalizeStringArray(value.exercises),
    precautions: normalizeStringArray(value.precautions),
    followUp: normalizeString(value.followUp),
    generatedAt: normalizeString(value.generatedAt),
    model: normalizeString(value.model),
  }
}

export function createEmptyConsultationAIState(): ConsultationAIState {
  return {
    transcript: null,
    audioMeta: null,
    soapDraft: null,
    smartNotes: [],
    patientRecap: null,
  }
}

export function hasConsultationAIData(aiState: ConsultationAIState) {
  return Boolean(
    aiState.transcript ||
      aiState.audioMeta ||
      aiState.soapDraft ||
      aiState.patientRecap ||
      aiState.smartNotes.length > 0
  )
}

export function normalizeConsultationAIState(value: unknown): ConsultationAIState {
  if (!isPlainObject(value)) {
    return createEmptyConsultationAIState()
  }

  return {
    transcript: normalizeTranscript(value.transcript),
    audioMeta: normalizeAudioMeta(value.audioMeta),
    soapDraft: normalizeSoapDraft(value.soapDraft),
    smartNotes: normalizeSmartNotes(value.smartNotes),
    patientRecap: normalizePatientRecap(value.patientRecap),
  }
}

function isTipTapDocument(value: unknown) {
  return isPlainObject(value) && value.type === "doc"
}

export function normalizeConsultationContent(value: unknown): ConsultationNoteContent {
  if (isTipTapDocument(value)) {
    return {
      editor: value,
      bodyChart: [],
      ai: createEmptyConsultationAIState(),
    }
  }

  if (!isPlainObject(value)) {
    return {
      editor: null,
      bodyChart: [],
      ai: createEmptyConsultationAIState(),
    }
  }

  return {
    editor: value.editor ?? null,
    bodyChart: normalizeBodyChartPartIds(normalizeStringArray(value.bodyChart)),
    ai: normalizeConsultationAIState(value.ai),
  }
}

function deepMergeRecords(
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...current }

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue
    }

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMergeRecords(result[key] as Record<string, unknown>, value)
      continue
    }

    result[key] = value
  }

  return result
}

export function mergeConsultationContent(current: unknown, patch: unknown): ConsultationNoteContent {
  const normalizedCurrent = normalizeConsultationContent(current)

  if (!isPlainObject(patch)) {
    return normalizedCurrent
  }

  const merged = deepMergeRecords(
    normalizedCurrent as unknown as Record<string, unknown>,
    patch
  )

  return normalizeConsultationContent(merged)
}

export function serializeConsultationContent(content: ConsultationNoteContent) {
  return content as unknown as Prisma.InputJsonValue
}

export function extractTextFromTipTap(content: unknown): string {
  if (!content) {
    return ""
  }

  let document = content

  if (isPlainObject(content) && "editor" in content) {
    document = content.editor ?? content
  }

  if (!isPlainObject(document) || !Array.isArray(document.content)) {
    return ""
  }

  let text = ""

  const walkNode = (node: unknown) => {
    if (!isPlainObject(node)) {
      return
    }

    if (typeof node.text === "string") {
      text += node.text
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walkNode)
      text += "\n"
    }
  }

  document.content.forEach(walkNode)

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
}

export function formatSoapDraftAsText(soapDraft: SoapDraft) {
  return soapDraft.sections
    .map((section) => `${section.label}\n${section.content}`)
    .join("\n\n")
}
