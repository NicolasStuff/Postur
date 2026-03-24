"use client"

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import {
  BrainCircuit,
  FileAudio2,
  FileUp,
  Loader2,
  Mic,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Square,
  WandSparkles,
} from "lucide-react"
import { toast } from "sonner"

import {
  generatePatientRecap,
  generateSmartNoteSuggestions,
  grantAIFeaturesConsent,
} from "@/app/actions/consultation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { bodyPartLabels } from "@/lib/bodyChartLabels"
import {
  ConsultationAIState,
  extractTextFromTipTap,
  formatSoapDraftAsText,
  PatientRecap,
  SmartNoteSuggestion,
} from "@/lib/consultation-note"

interface ConsultationAIAccess {
  audioSoap: boolean
  smartNotesLive: boolean
  patientRecap: boolean
  anyAI: boolean
  hasConsent: boolean
}

type AIErrorCode =
  | "UNAUTHORIZED"
  | "AI_FEATURE_UNAVAILABLE"
  | "AI_AUDIO_FILE_REQUIRED"
  | "AI_AUDIO_EMPTY"
  | "AI_AUDIO_TOO_LARGE"
  | "AI_AUDIO_INVALID_TYPE"
  | "AI_CONSENT_REQUIRED"
  | "APPOINTMENT_NOT_FOUND"
  | "TOO_MANY_REQUESTS"
  | "AI_AUDIO_PROCESSING_FAILED"

interface ConsultationAIPanelProps {
  appointmentId: string
  editorContent: unknown
  bodyChartParts: string[]
  aiState: ConsultationAIState
  access: ConsultationAIAccess | null
  onInsertText: (text: string) => void
  onUpdateAI: (patch: Partial<ConsultationAIState>) => void
}

function suggestionsAreEqual(
  currentSuggestions: SmartNoteSuggestion[],
  nextSuggestions: SmartNoteSuggestion[]
) {
  return JSON.stringify(currentSuggestions) === JSON.stringify(nextSuggestions)
}

function buildRecapText(recap: PatientRecap) {
  const sections = [
    `Résumé\n${recap.summary}`,
    recap.advice.length > 0 ? `Conseils\n- ${recap.advice.join("\n- ")}` : "",
    recap.exercises.length > 0 ? `Exercices\n- ${recap.exercises.join("\n- ")}` : "",
    recap.precautions.length > 0 ? `Précautions\n- ${recap.precautions.join("\n- ")}` : "",
    `Suite conseillée\n${recap.followUp}`,
  ].filter(Boolean)

  return sections.join("\n\n")
}

export function ConsultationAIPanel({
  appointmentId,
  editorContent,
  bodyChartParts,
  aiState,
  access,
  onInsertText,
  onUpdateAI,
}: ConsultationAIPanelProps) {
  const t = useTranslations("consultation.osteopath.ai")
  const queryClient = useQueryClient()
  const noteText = useMemo(() => extractTextFromTipTap(editorContent), [editorContent])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const isUnmountingRef = useRef(false)
  const audioChunksRef = useRef<Blob[]>([])
  const smartNotesRef = useRef(aiState.smartNotes)
  const suggestionRequestRef = useRef(0)
  const [activeTab, setActiveTab] = useState("audio")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDurationMs, setRecordingDurationMs] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(12)
  const [smartNotesLoading, setSmartNotesLoading] = useState(false)
  const [smartNotesError, setSmartNotesError] = useState<string | null>(null)
  const [patientRecapLoading, setPatientRecapLoading] = useState(false)
  const [soapDialogOpen, setSoapDialogOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [hasConsentOverride, setHasConsentOverride] = useState(access?.hasConsent ?? false)
  const hasConsent = access?.hasConsent || hasConsentOverride

  const resolveAudioErrorMessage = (errorCode?: AIErrorCode, fallback?: string) => {
    switch (errorCode) {
      case "UNAUTHORIZED":
        return t("errors.unauthorized")
      case "AI_FEATURE_UNAVAILABLE":
        return t("errors.featureUnavailable")
      case "AI_AUDIO_FILE_REQUIRED":
        return t("errors.audioFileRequired")
      case "AI_AUDIO_EMPTY":
        return t("errors.audioEmpty")
      case "AI_AUDIO_TOO_LARGE":
        return t("errors.audioTooLarge")
      case "AI_AUDIO_INVALID_TYPE":
        return t("errors.audioInvalidType")
      case "AI_CONSENT_REQUIRED":
        return t("errors.consentRequired")
      case "APPOINTMENT_NOT_FOUND":
        return t("errors.appointmentNotFound")
      case "TOO_MANY_REQUESTS":
        return t("errors.tooManyRequests")
      case "AI_AUDIO_PROCESSING_FAILED":
        return t("errors.audioProcessingFailed")
      default:
        return fallback || t("toasts.transcriptionFailed")
    }
  }

  useEffect(() => {
    setHasConsentOverride(access?.hasConsent ?? false)
  }, [access?.hasConsent])

  useEffect(() => {
    if (access?.anyAI && !hasConsent) {
      setConsentOpen(true)
    }
  }, [access?.anyAI, hasConsent])

  useEffect(() => {
    if (!isRecording) {
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setRecordingDurationMs(Date.now() - startedAt)
    }, 250)

    return () => {
      window.clearInterval(interval)
    }
  }, [isRecording])

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true
      const recorder = mediaRecorderRef.current

      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.stop()
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
      audioChunksRef.current = []
    }
  }, [])

  useEffect(() => {
    smartNotesRef.current = aiState.smartNotes
  }, [aiState.smartNotes])

  const handleGenerateSmartNotes = async () => {
    if (!access?.smartNotesLive || !hasConsent) {
      return
    }

    const normalizedNoteText = noteText.trim()
    if (bodyChartParts.length === 0 && !normalizedNoteText) {
      setSmartNotesError(null)
      return
    }

    const requestId = suggestionRequestRef.current + 1
    suggestionRequestRef.current = requestId
    setSmartNotesError(null)
    setSmartNotesLoading(true)

    try {
      const suggestions = await generateSmartNoteSuggestions(appointmentId, {
        bodyChart: bodyChartParts,
        noteText: normalizedNoteText,
      })

      if (suggestionRequestRef.current !== requestId) {
        return
      }

      const dedupedSuggestions = suggestions.filter(
        (suggestion) => !normalizedNoteText.toLowerCase().includes(suggestion.text.toLowerCase())
      )

      if (!suggestionsAreEqual(smartNotesRef.current, dedupedSuggestions)) {
        onUpdateAI({ smartNotes: dedupedSuggestions })
      }

      setSmartNotesError(null)
    } catch (error) {
      if (suggestionRequestRef.current === requestId) {
        console.error("Smart note suggestions failed:", error)
        setSmartNotesError(t("errors.suggestionsFailed"))
      }
    } finally {
      if (suggestionRequestRef.current === requestId) {
        setSmartNotesLoading(false)
      }
    }
  }

  const handleGrantConsent = async () => {
    try {
      setConsentLoading(true)
      await grantAIFeaturesConsent()
      setHasConsentOverride(true)
      setConsentOpen(false)
      await queryClient.invalidateQueries({ queryKey: ["consultation-ai-access"] })
      toast.success(t("toasts.consentGranted"))
    } catch (error) {
      console.error("AI consent failed:", error)
      toast.error(error instanceof Error ? error.message : t("errors.consentRequired"))
    } finally {
      setConsentLoading(false)
    }
  }

  const handleTranscribeAudio = async (file: File, source: "recorded" | "uploaded") => {
    try {
      setIsTranscribing(true)
      setActiveTab("audio")
      setTranscriptionProgress(18)
      onUpdateAI({
        transcript: null,
        audioMeta: null,
        soapDraft: null,
        patientRecap: null,
      })

      const formData = new FormData()
      formData.append("file", file)
      formData.append("source", source)
      formData.append("noteText", noteText)
      formData.append("bodyChart", JSON.stringify(bodyChartParts))

      const response = await fetch(`/api/consultation/${appointmentId}/ai/audio`, {
        method: "POST",
        body: formData,
      })

      setTranscriptionProgress(66)

      const payload = (await response.json()) as {
        errorCode?: AIErrorCode
        error?: string
        transcript?: ConsultationAIState["transcript"]
        audioMeta?: ConsultationAIState["audioMeta"]
        soapDraft?: ConsultationAIState["soapDraft"]
      }

      if (!response.ok || !payload.transcript || !payload.audioMeta || !payload.soapDraft) {
        throw new Error(resolveAudioErrorMessage(payload.errorCode, payload.error))
      }

      onUpdateAI({
        transcript: payload.transcript,
        audioMeta: payload.audioMeta,
        soapDraft: payload.soapDraft,
        patientRecap: null,
      })

      setTranscriptionProgress(100)
      setSoapDialogOpen(true)
      toast.success(t("toasts.transcriptionReady"))
    } catch (error) {
      console.error("Transcription failed:", error)
      toast.error(error instanceof Error ? error.message : t("toasts.transcriptionFailed"))
    } finally {
      window.setTimeout(() => setTranscriptionProgress(12), 500)
      setIsTranscribing(false)
    }
  }

  const handleAudioUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    await handleTranscribeAudio(selectedFile, "uploaded")
    event.target.value = ""
  }

  const handleStartRecording = async () => {
    let stream: MediaStream | null = null

    try {
      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : ""

      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      audioChunksRef.current = []
      mediaRecorderRef.current = recorder
      mediaStreamRef.current = stream
      isUnmountingRef.current = false
      setRecordingDurationMs(0)
      setIsRecording(true)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        })

        mediaRecorderRef.current = null
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        setIsRecording(false)

        if (isUnmountingRef.current || blob.size === 0) {
          audioChunksRef.current = []
          return
        }

        const extension = blob.type.includes("mp4") ? "m4a" : "webm"
        const file = new File(
          [blob],
          `consultation-${appointmentId}-${Date.now()}.${extension}`,
          { type: blob.type || "audio/webm" }
        )

        await handleTranscribeAudio(file, "recorded")
      }

      recorder.start()
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
      audioChunksRef.current = []
      console.error("Recording failed:", error)
      toast.error(t("toasts.microphoneDenied"))
      setIsRecording(false)
    }
  }

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const handleGeneratePatientRecap = async () => {
    try {
      setPatientRecapLoading(true)
      const recap = await generatePatientRecap(appointmentId, {
        bodyChart: bodyChartParts,
        noteText,
        soapSummary: aiState.soapDraft?.summary || "",
      })

      onUpdateAI({ patientRecap: recap })
      setRecapOpen(true)
      toast.success(t("toasts.patientRecapReady"))
    } catch (error) {
      console.error("Patient recap failed:", error)
      toast.error(error instanceof Error ? error.message : t("toasts.patientRecapFailed"))
    } finally {
      setPatientRecapLoading(false)
    }
  }

  const handleCopyRecap = async () => {
    if (!aiState.patientRecap) {
      return
    }

    try {
      await navigator.clipboard.writeText(buildRecapText(aiState.patientRecap))
      toast.success(t("toasts.recapCopied"))
    } catch (error) {
      console.error("Clipboard copy failed:", error)
      toast.error(t("toasts.recapCopyFailed"))
    }
  }

  if (!access) {
    return (
      <Card className="border-slate-200 shadow-none">
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          <p className="text-sm text-slate-600">{t("loading")}</p>
        </CardContent>
      </Card>
    )
  }

  if (!access.anyAI) {
    return (
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <Sparkles className="h-4 w-4 text-amber-600" />
            {t("locked.title")}
          </CardTitle>
          <CardDescription className="text-slate-700">{t("locked.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-amber-200 bg-white/80 text-amber-800">
              {t("locked.audioFeature")}
            </Badge>
            <Badge variant="outline" className="border-amber-200 bg-white/80 text-amber-800">
              {t("locked.smartNotesFeature")}
            </Badge>
            <Badge variant="outline" className="border-amber-200 bg-white/80 text-amber-800">
              {t("locked.patientRecapFeature")}
            </Badge>
          </div>

          <Button asChild className="bg-slate-900 hover:bg-slate-800">
            <Link href="/dashboard/settings">{t("locked.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!hasConsent) {
    return (
      <>
        <Card className="border-sky-200 bg-sky-50/60 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-900">
              <ShieldAlert className="h-4 w-4 text-sky-700" />
              {t("consent.title")}
            </CardTitle>
            <CardDescription className="text-slate-700">
              {t("consent.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => setConsentOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              {t("consent.cta")}
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings?tab=profile">{t("consent.settingsCta")}</Link>
            </Button>
          </CardContent>
        </Card>

        <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("consent.dialogTitle")}</DialogTitle>
              <DialogDescription>{t("consent.dialogDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-700">
              <p>{t("consent.points.minimization")}</p>
              <p>{t("consent.points.vendors")}</p>
              <p>{t("consent.points.revocation")}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConsentOpen(false)}>
                {t("consent.cancel")}
              </Button>
              <Button onClick={handleGrantConsent} disabled={consentLoading}>
                {consentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("consent.accept")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
            <div className="flex items-center justify-between border-b bg-slate-50/70 px-3 py-2">
              <TabsList className="h-auto bg-slate-100">
                <TabsTrigger value="audio" className="gap-2 px-3 py-1.5">
                  <FileAudio2 className="h-4 w-4" />
                  {t("tabs.audio")}
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="gap-2 px-3 py-1.5">
                  <WandSparkles className="h-4 w-4" />
                  {t("tabs.suggestions")}
                </TabsTrigger>
                <TabsTrigger value="recap" className="gap-2 px-3 py-1.5">
                  <BrainCircuit className="h-4 w-4" />
                  {t("tabs.recap")}
                </TabsTrigger>
              </TabsList>
              <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">Pro + IA</Badge>
            </div>

            <TabsContent value="audio" className="m-0">
              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={isTranscribing}
                    className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"}
                  >
                    {isRecording ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        {t("audio.stop")}
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        {t("audio.record")}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording || isTranscribing}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {t("audio.upload")}
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAudioUpload}
                  />

                  {isRecording && (
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                      {t("audio.recordingTime", {
                        seconds: Math.floor(recordingDurationMs / 1000),
                      })}
                    </Badge>
                  )}
                </div>

                {isTranscribing && (
                  <div className="space-y-2 rounded-lg border border-sky-100 bg-sky-50/70 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-sky-900">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("audio.processing")}
                    </div>
                    <Progress value={transcriptionProgress} className="h-2" />
                  </div>
                )}

                {aiState.audioMeta && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <Badge variant="outline">{aiState.audioMeta.model}</Badge>
                    <Badge variant="outline">{aiState.audioMeta.source === "recorded" ? t("audio.recorded") : t("audio.uploaded")}</Badge>
                    <span>{aiState.audioMeta.fileName}</span>
                  </div>
                )}

                {aiState.transcript && (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{t("audio.transcriptTitle")}</p>
                        <p className="text-xs text-slate-500">{t("audio.transcriptDescription")}</p>
                      </div>
                      <Badge variant="outline">{t("audio.secureBadge")}</Badge>
                    </div>

                    <ScrollArea className="h-28 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <div className="space-y-2 text-sm text-slate-700">
                        {aiState.transcript.segments.length > 0 ? (
                          aiState.transcript.segments.map((segment, index) => (
                            <div key={`${segment.start}-${index}`}>
                              <span className="font-medium text-slate-900">{segment.speaker}</span>
                              <span className="text-slate-400"> · </span>
                              <span>{segment.text}</span>
                            </div>
                          ))
                        ) : (
                          <p>{aiState.transcript.text}</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {aiState.soapDraft && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-emerald-900">{t("audio.soapReady")}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{aiState.soapDraft.summary}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setSoapDialogOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800"
                      >
                        {t("audio.viewDraft")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (aiState.soapDraft) {
                            onInsertText(formatSoapDraftAsText(aiState.soapDraft))
                          }
                        }}
                      >
                        {t("audio.insertAll")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="m-0">
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t("suggestions.title")}</p>
                    <p className="text-xs text-slate-500">{t("suggestions.description")}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateSmartNotes}
                    disabled={smartNotesLoading || !access?.smartNotesLive || !hasConsent || (bodyChartParts.length === 0 && !noteText.trim())}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {smartNotesLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : aiState.smartNotes.length > 0 ? (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {aiState.smartNotes.length > 0 ? t("suggestions.regenerate") : t("suggestions.generate")}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {bodyChartParts.length > 0 ? (
                    bodyChartParts.map((part) => (
                      <Badge key={part} variant="outline" className="bg-slate-50">
                        {bodyPartLabels[part] ?? part}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">{t("suggestions.noBodyChart")}</Badge>
                  )}
                  <Badge variant="outline">
                    {noteText ? t("suggestions.noteDetected") : t("suggestions.noNote")}
                  </Badge>
                </div>

                {smartNotesError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                    {smartNotesError}
                  </div>
                )}

                {aiState.smartNotes.length === 0 ? (
                  <div
                    className={
                      smartNotesError
                        ? "rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500"
                        : "rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500"
                    }
                  >
                    {smartNotesLoading
                      ? t("suggestions.generating")
                      : smartNotesError || t("suggestions.empty")}
                  </div>
                ) : (
                  <ScrollArea className="max-h-60">
                    <div className="space-y-3">
                      {aiState.smartNotes.map((suggestion) => (
                        <div key={suggestion.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{t(`suggestions.modes.${suggestion.inputMode}`)}</Badge>
                            <Badge variant="outline">{t(`suggestions.confidence.${suggestion.confidence}`)}</Badge>
                            {suggestion.inputMode === "conflict" && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                <ShieldAlert className="h-3 w-3" />
                                {t("suggestions.verify")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-slate-800">{suggestion.text}</p>
                          <p className="mt-2 text-xs text-slate-500">{suggestion.reason}</p>
                          <div className="mt-3 flex justify-end">
                            <Button type="button" size="sm" variant="outline" onClick={() => onInsertText(suggestion.text)}>
                              {t("suggestions.insert")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recap" className="m-0">
              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{t("recap.title")}</p>
                    <p className="text-xs text-slate-500">{t("recap.description")}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGeneratePatientRecap}
                    disabled={patientRecapLoading || (!noteText && !aiState.soapDraft?.summary)}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {patientRecapLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : aiState.patientRecap ? (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {aiState.patientRecap ? t("recap.regenerate") : t("recap.generate")}
                  </Button>
                </div>

                {aiState.patientRecap ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-sm leading-6 text-slate-800">{aiState.patientRecap.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setRecapOpen(true)}>
                        {t("recap.open")}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={handleCopyRecap}>
                        {t("recap.copy")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                    {t("recap.empty")}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
      </div>

      <Dialog open={recapOpen} onOpenChange={setRecapOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("recap.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("recap.dialogDescription")}</DialogDescription>
          </DialogHeader>

          {aiState.patientRecap && (
            <ScrollArea className="h-[420px] pr-4">
              <div className="space-y-5 text-sm text-slate-700">
                <section>
                  <h4 className="mb-2 font-semibold text-slate-900">{t("recap.sections.summary")}</h4>
                  <p className="leading-6">{aiState.patientRecap.summary}</p>
                </section>

                {aiState.patientRecap.advice.length > 0 && (
                  <section>
                    <h4 className="mb-2 font-semibold text-slate-900">{t("recap.sections.advice")}</h4>
                    <ul className="space-y-1">
                      {aiState.patientRecap.advice.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {aiState.patientRecap.exercises.length > 0 && (
                  <section>
                    <h4 className="mb-2 font-semibold text-slate-900">{t("recap.sections.exercises")}</h4>
                    <ul className="space-y-1">
                      {aiState.patientRecap.exercises.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {aiState.patientRecap.precautions.length > 0 && (
                  <section>
                    <h4 className="mb-2 font-semibold text-slate-900">{t("recap.sections.precautions")}</h4>
                    <ul className="space-y-1">
                      {aiState.patientRecap.precautions.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h4 className="mb-2 font-semibold text-slate-900">{t("recap.sections.followUp")}</h4>
                  <p className="leading-6">{aiState.patientRecap.followUp}</p>
                </section>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={soapDialogOpen} onOpenChange={setSoapDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("audio.soapDialogTitle")}</DialogTitle>
            <DialogDescription>
              {aiState.soapDraft?.summary || t("audio.soapDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          {aiState.soapDraft && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                {aiState.soapDraft.sections.map((section) => (
                  <div
                    key={section.label}
                    className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900">{section.label}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onInsertText(`${section.label}\n${section.content}`)}
                      >
                        {t("audio.insertSection")}
                      </Button>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{section.content}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setSoapDialogOpen(false)}>
              {t("audio.close")}
            </Button>
            <Button
              onClick={() => {
                if (aiState.soapDraft) {
                  onInsertText(formatSoapDraftAsText(aiState.soapDraft))
                  setSoapDialogOpen(false)
                }
              }}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {t("audio.insertAll")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("consent.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("consent.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-700">
            <p>{t("consent.points.minimization")}</p>
            <p>{t("consent.points.vendors")}</p>
            <p>{t("consent.points.revocation")}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              {t("consent.cancel")}
            </Button>
            <Button onClick={handleGrantConsent} disabled={consentLoading}>
              {consentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("consent.accept")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
