"use client"

import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import {
  FileAudio2,
  FileUp,
  Loader2,
  Mic,
  Square,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  ConsultationAIState,
  SoapDraftSection,
} from "@/lib/consultation-note"
import { ConsultationEditor } from "../shared/Editor"
import { useModalEditorSync } from "../shared/useModalEditorSync"

/** Visual starting point for the progress bar before real progress kicks in */
const INITIAL_PROGRESS = 12

type AIErrorCode =
  | "UNAUTHORIZED"
  | "AI_FEATURE_UNAVAILABLE"
  | "AI_AUDIO_FILE_REQUIRED"
  | "AI_AUDIO_EMPTY"
  | "AI_AUDIO_TOO_LARGE"
  | "AI_AUDIO_INVALID_TYPE"
  | "APPOINTMENT_NOT_FOUND"
  | "TOO_MANY_REQUESTS"
  | "AI_AUDIO_PROCESSING_FAILED"

interface AudioSoapModalProps {
  appointmentId: string
  noteText: string
  bodyChartParts: string[]
  aiState: ConsultationAIState
  audioSoapEnabled: boolean
  editorContent: unknown
  onEditorContentSync: (content: unknown) => void
  onUpdateAI: (patch: Partial<ConsultationAIState>) => void
}

export function AudioSoapModal({
  appointmentId,
  noteText,
  bodyChartParts,
  aiState,
  audioSoapEnabled,
  editorContent,
  onEditorContentSync,
  onUpdateAI,
}: AudioSoapModalProps) {
  const t = useTranslations("consultation.osteopath.ai")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const isUnmountingRef = useRef(false)
  const transcribeRequestRef = useRef(0)
  const audioChunksRef = useRef<Blob[]>([])
  const [open, setOpen] = useState(false)
  const { modalEditorRef, handleModalEditorChange, syncAndClose } = useModalEditorSync(
    open,
    editorContent,
    onEditorContentSync
  )
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDurationMs, setRecordingDurationMs] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(INITIAL_PROGRESS)
  const [editedSections, setEditedSections] = useState<SoapDraftSection[]>([])

  useEffect(() => {
    if (aiState.soapDraft) {
      setEditedSections(aiState.soapDraft.sections.map((s) => ({ ...s })))
    }
  }, [aiState.soapDraft])

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
    if (!isRecording) return
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setRecordingDurationMs(Date.now() - startedAt)
    }, 250)
    return () => window.clearInterval(interval)
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

  const handleTranscribeAudio = async (file: File, source: "recorded" | "uploaded") => {
    const requestId = transcribeRequestRef.current + 1
    transcribeRequestRef.current = requestId

    try {
      setIsTranscribing(true)
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

      if (isUnmountingRef.current || transcribeRequestRef.current !== requestId) return

      setTranscriptionProgress(66)

      const payload = (await response.json()) as {
        errorCode?: AIErrorCode
        error?: string
        transcript?: ConsultationAIState["transcript"]
        audioMeta?: ConsultationAIState["audioMeta"]
        soapDraft?: ConsultationAIState["soapDraft"]
      }

      if (isUnmountingRef.current || transcribeRequestRef.current !== requestId) return

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
      toast.success(t("toasts.transcriptionReady"))
    } catch (error) {
      if (isUnmountingRef.current || transcribeRequestRef.current !== requestId) return
      console.error("Transcription failed:", error)
      toast.error(error instanceof Error ? error.message : t("toasts.transcriptionFailed"))
    } finally {
      if (!isUnmountingRef.current && transcribeRequestRef.current === requestId) {
        window.setTimeout(() => setTranscriptionProgress(INITIAL_PROGRESS), 500)
        setIsTranscribing(false)
      }
    }
  }

  const handleAudioUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        })
        mediaRecorderRef.current = null
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null

        if (isUnmountingRef.current) {
          audioChunksRef.current = []
          return
        }

        setIsRecording(false)

        if (blob.size === 0) {
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

  const handleClose = () => {
    syncAndClose()
    setOpen(false)
  }

  const handleInsertSection = (section: SoapDraftSection) => {
    modalEditorRef.current?.insertText(`${section.label}\n${section.content}`)
  }

  const handleInsertAll = () => {
    const text = editedSections
      .map((s) => `${s.label}\n${s.content}`)
      .join("\n\n")
    modalEditorRef.current?.insertText(text)
    handleClose()
  }

  const handleSectionContentChange = (index: number, content: string) => {
    setEditedSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, content } : s))
    )
  }

  if (!audioSoapEnabled) {
    return null
  }

  const hasSoapResults = Boolean(aiState.soapDraft)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        syncAndClose()
      }
      setOpen(nextOpen)
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <FileAudio2 className="h-3.5 w-3.5" />
          {t("tabs.audio")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{t("tabs.audio")}</DialogTitle>
          <DialogDescription>{t("audio.transcriptDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 px-6 pb-2">
          {/* Left: Audio controls + SOAP sections */}
          <div className="overflow-y-auto space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isTranscribing}
                className={isRecording ? "bg-red-600 hover:bg-red-700" : ""}
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
                  {t("audio.recordingTime", { seconds: Math.floor(recordingDurationMs / 1000) })}
                </Badge>
              )}

              {aiState.audioMeta && (
                <Badge variant="outline">{aiState.audioMeta.source === "recorded" ? t("audio.recorded") : t("audio.uploaded")}</Badge>
              )}
            </div>

            {isTranscribing && (
              <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("audio.processing")}
                </div>
                <Progress value={transcriptionProgress} className="h-2" />
              </div>
            )}

            {aiState.transcript && (
              <div className="space-y-3 rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{t("audio.transcriptTitle")}</p>
                  <Badge variant="outline">{t("audio.secureBadge")}</Badge>
                </div>
                <ScrollArea className="h-24 rounded-lg border bg-muted/50 px-3 py-2">
                  <div className="space-y-2 text-sm">
                    {aiState.transcript.segments.length > 0 ? (
                      aiState.transcript.segments.map((segment, index) => (
                        <div key={`${segment.start}-${index}`}>
                          <span className="font-medium">{segment.speaker}</span>
                          <span className="text-muted-foreground/60"> · </span>
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

            {hasSoapResults && (
              <>
                <p className="text-sm font-semibold text-emerald-800">{t("audio.soapReady")}</p>
                <p className="text-xs text-muted-foreground">{aiState.soapDraft?.summary}</p>
                {editedSections.map((section, index) => (
                  <div key={section.label} className="space-y-2 rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold">{section.label}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleInsertSection(section)}
                      >
                        {t("audio.insertSection")}
                      </Button>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={(e) => handleSectionContentChange(index, e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right: Editable notes - full height */}
          <div className="overflow-hidden rounded-xl border flex flex-col">
            <div className="shrink-0 border-b bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Notes actuelles</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConsultationEditor
                ref={modalEditorRef}
                key={open ? "modal-audio-editor" : ""}
                initialContent={editorContent}
                onChange={handleModalEditorChange}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            {t("audio.close")}
          </Button>
          {hasSoapResults && (
            <Button onClick={handleInsertAll}>
              {t("audio.insertAll")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
