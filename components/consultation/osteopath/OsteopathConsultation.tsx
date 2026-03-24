"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { useQuery } from "@tanstack/react-query"
import { Prisma } from "@prisma/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Clock, FileText, History, Loader2, User } from "lucide-react"

import {
  getBodyChartHistory,
  getConsultationAIAccess,
  grantAIFeaturesConsent,
  saveBodyChartHistory,
} from "@/app/actions/consultation"
import { bodyPartLabels } from "@/lib/bodyChartLabels"
import {
  ConsultationAIState,
  createEmptyConsultationAIState,
  extractTextFromTipTap,
  normalizeConsultationContent,
  serializeConsultationContent,
} from "@/lib/consultation-note"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { AudioSoapModal } from "./AudioSoapModal"
import { SuggestionsModal } from "./SuggestionsModal"
import { BodyChart } from "./BodyChart"
import { BodyChartHistoryViewer } from "./BodyChartHistoryViewer"
import { QuickNotes } from "./QuickNotes"
import { TraumaTimeline } from "./TraumaTimeline"
import { ConsultationEditor, ConsultationEditorRef } from "../shared/Editor"
import { PatientFile } from "../shared/PatientFile"

interface BodyChartHistoryItem {
  id: string
  createdAt: Date
  selectedParts: string[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  medicalHistory?: unknown
  appointments?: Array<{
    id: string
    start: Date | string
    service?: { name: string | null } | null
    note?: { content: unknown } | null
  }>
}

interface Consultation {
  id: string
  patient: Patient
  user?: {
    name?: string | null
  } | null
  note?: {
    content?: Prisma.JsonValue | Prisma.InputJsonValue
  } | null
}

interface OsteopathConsultationProps {
  consultation: Consultation
  onSave: (data: Prisma.InputJsonValue) => Promise<unknown>
}

export interface OsteopathConsultationRef {
  getDraft: () => Prisma.InputJsonValue
  saveNow: () => Promise<void>
  getAIState: () => ConsultationAIState
  getNoteText: () => string
  getBodyChartParts: () => string[]
  getEditorContent: () => unknown
}

function getConsultationContent(consultation: Consultation) {
  return normalizeConsultationContent(consultation.note?.content)
}

function aiValuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function buildAIStatePatch(
  previousAIState: ConsultationAIState,
  nextAIState: ConsultationAIState
): Prisma.InputJsonValue | null {
  const aiPatch: Record<string, Prisma.InputJsonValue> = {}

  if (!aiValuesEqual(previousAIState.transcript, nextAIState.transcript)) {
    aiPatch.transcript = nextAIState.transcript as unknown as Prisma.InputJsonValue
  }

  if (!aiValuesEqual(previousAIState.audioMeta, nextAIState.audioMeta)) {
    aiPatch.audioMeta = nextAIState.audioMeta as unknown as Prisma.InputJsonValue
  }

  if (!aiValuesEqual(previousAIState.soapDraft, nextAIState.soapDraft)) {
    aiPatch.soapDraft = nextAIState.soapDraft as unknown as Prisma.InputJsonValue
  }

  if (!aiValuesEqual(previousAIState.smartNotes, nextAIState.smartNotes)) {
    aiPatch.smartNotes = nextAIState.smartNotes as unknown as Prisma.InputJsonValue
  }

  if (!aiValuesEqual(previousAIState.patientRecap, nextAIState.patientRecap)) {
    aiPatch.patientRecap = nextAIState.patientRecap as unknown as Prisma.InputJsonValue
  }

  if (Object.keys(aiPatch).length === 0) {
    return null
  }

  return {
    ai: aiPatch as unknown as Prisma.InputJsonValue,
  }
}

export const OsteopathConsultation = forwardRef<
  OsteopathConsultationRef,
  OsteopathConsultationProps
>(function OsteopathConsultation({ consultation, onSave }, ref) {
  const t = useTranslations("consultation.osteopath")
  const { data: aiAccess } = useQuery({
    queryKey: ["consultation-ai-access"],
    queryFn: () => getConsultationAIAccess(),
  })
  const [editorContent, setEditorContent] = useState<unknown>(() => {
    return getConsultationContent(consultation).editor || null
  })
  const [bodyChartParts, setBodyChartParts] = useState<string[]>(() => {
    return getConsultationContent(consultation).bodyChart || []
  })
  const [aiState, setAIState] = useState<ConsultationAIState>(() => {
    return getConsultationContent(consultation).ai || createEmptyConsultationAIState()
  })
  const [showTimeline, setShowTimeline] = useState(false)
  const [showPatientFile, setShowPatientFile] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [hasConsentOverride, setHasConsentOverride] = useState(aiAccess?.hasConsent ?? false)
  const [history, setHistory] = useState<BodyChartHistoryItem[]>([])
  const [bodyChartRetryNonce, setBodyChartRetryNonce] = useState(0)
  const hasConsent = aiAccess?.hasConsent || hasConsentOverride
  const noteText = useMemo(() => extractTextFromTipTap(editorContent), [editorContent])
  const editorRef = useRef<ConsultationEditorRef>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bodyChartRetryTimeoutRef = useRef<number | null>(null)
  const latestAIStateRef = useRef<ConsultationAIState>(
    getConsultationContent(consultation).ai || createEmptyConsultationAIState()
  )
  const aiSaveInFlightRef = useRef(false)
  const lastSavedBodyChartPartsRef = useRef<string[]>(
    getConsultationContent(consultation).bodyChart || []
  )
  const lastLoadedConsultationIdRef = useRef(consultation.id)
  const lastPersistedAIStateRef = useRef<ConsultationAIState>(
    getConsultationContent(consultation).ai || createEmptyConsultationAIState()
  )
  const lastPersistedAISnapshotRef = useRef(
    JSON.stringify(getConsultationContent(consultation).ai || createEmptyConsultationAIState())
  )

  const loadHistory = useCallback(async () => {
    try {
      const historyData = await getBodyChartHistory(consultation.id)
      setHistory(historyData)
    } catch (error) {
      console.error("Failed to load history:", error)
    }
  }, [consultation.id])

  const buildDraft = useCallback((): Prisma.InputJsonValue => (
    serializeConsultationContent({
      editor: editorContent ?? null,
      bodyChart: bodyChartParts,
      ai: aiState,
    })
  ), [aiState, bodyChartParts, editorContent])
  const buildEditorPatch = useCallback((): Prisma.InputJsonValue => ({
    editor: (editorContent ?? null) as Prisma.InputJsonValue,
    bodyChart: bodyChartParts,
  }), [bodyChartParts, editorContent])
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const persistDraft = useCallback(async () => {
    await onSave(buildDraft())
  }, [buildDraft, onSave])

  useImperativeHandle(
    ref,
    () => ({
      getDraft: buildDraft,
      saveNow: persistDraft,
      getAIState: () => aiState,
      getNoteText: () => noteText,
      getBodyChartParts: () => bodyChartParts,
      getEditorContent: () => editorContent,
    }),
    [aiState, bodyChartParts, buildDraft, editorContent, noteText, persistDraft]
  )

  useEffect(() => {
    if (lastLoadedConsultationIdRef.current === consultation.id) {
      return
    }

    lastLoadedConsultationIdRef.current = consultation.id
    const content = getConsultationContent(consultation)
    setEditorContent(content.editor || null)
    setBodyChartParts(content.bodyChart || [])
    setAIState(content.ai || createEmptyConsultationAIState())
    latestAIStateRef.current = content.ai || createEmptyConsultationAIState()
    lastSavedBodyChartPartsRef.current = content.bodyChart || []
    lastPersistedAIStateRef.current = content.ai || createEmptyConsultationAIState()
    lastPersistedAISnapshotRef.current = JSON.stringify(
      content.ai || createEmptyConsultationAIState()
    )
  }, [consultation])

  useEffect(() => {
    latestAIStateRef.current = aiState
  }, [aiState])

  useEffect(() => {
    if (consultation?.id) {
      void loadHistory()
    }
  }, [consultation?.id, loadHistory])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorContent || bodyChartParts.length > 0) {
        void onSaveRef.current(buildEditorPatch())
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [bodyChartParts, buildEditorPatch, editorContent])

  useEffect(() => {
    const persistLatestAIState = async () => {
      if (aiSaveInFlightRef.current) {
        return
      }

      const currentAIState = latestAIStateRef.current
      const nextSnapshot = JSON.stringify(currentAIState)

      if (nextSnapshot === lastPersistedAISnapshotRef.current) {
        return
      }

      const patch = buildAIStatePatch(lastPersistedAIStateRef.current, currentAIState)

      if (!patch) {
        lastPersistedAIStateRef.current = currentAIState
        lastPersistedAISnapshotRef.current = nextSnapshot
        return
      }

      aiSaveInFlightRef.current = true

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          await onSaveRef.current(patch)
          lastPersistedAIStateRef.current = currentAIState
          lastPersistedAISnapshotRef.current = nextSnapshot
          aiSaveInFlightRef.current = false

          if (JSON.stringify(latestAIStateRef.current) !== nextSnapshot) {
            void persistLatestAIState()
          }

          return
        } catch (error) {
          console.error("Failed to save AI state:", error)

          if (attempt === 0) {
            await new Promise<void>((resolve) => {
              window.setTimeout(() => resolve(), 1500)
            })
            continue
          }

          aiSaveInFlightRef.current = false
          if (JSON.stringify(latestAIStateRef.current) !== nextSnapshot) {
            window.setTimeout(() => {
              void persistLatestAIState()
            }, 0)
          }
          toast.error(t("errors.aiSaveFailed"))
          return
        }
      }
    }

    const nextSnapshot = JSON.stringify(aiState)
    if (nextSnapshot === lastPersistedAISnapshotRef.current) {
      return
    }

    const timer = window.setTimeout(() => {
      void persistLatestAIState()
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [aiState, t])

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const previousBodyChartParts = lastSavedBodyChartPartsRef.current

      if ((bodyChartParts.length > 0 || previousBodyChartParts.length > 0) && consultation?.id) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            await saveBodyChartHistory(consultation.id, bodyChartParts)
            lastSavedBodyChartPartsRef.current = bodyChartParts
            await loadHistory()
            return
          } catch (error) {
            console.error("Failed to save body chart history:", error)

            if (attempt === 0) {
              await new Promise<void>((resolve) => {
                window.setTimeout(() => resolve(), 1500)
              })
              continue
            }

            toast.error(t("errors.historySaveFailed"))

            if (
              bodyChartRetryTimeoutRef.current === null &&
              JSON.stringify(lastSavedBodyChartPartsRef.current) !== JSON.stringify(bodyChartParts)
            ) {
              bodyChartRetryTimeoutRef.current = window.setTimeout(() => {
                bodyChartRetryTimeoutRef.current = null
                setBodyChartRetryNonce((currentValue) => currentValue + 1)
              }, 5000)
            }
          }
        }
      }
    }, 5000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      if (bodyChartRetryTimeoutRef.current !== null) {
        window.clearTimeout(bodyChartRetryTimeoutRef.current)
        bodyChartRetryTimeoutRef.current = null
      }
    }
  }, [bodyChartParts, bodyChartRetryNonce, consultation?.id, loadHistory, t])

  useEffect(() => {
    setHasConsentOverride(aiAccess?.hasConsent ?? false)
  }, [aiAccess?.hasConsent])

  useEffect(() => {
    if (aiAccess?.anyAI && !hasConsent) {
      setConsentOpen(true)
    }
  }, [aiAccess?.anyAI, hasConsent])

  const handleQuickNote = (text: string) => {
    editorRef.current?.insertText(text)
  }

  const handleUpdateAI = useCallback((patch: Partial<ConsultationAIState>) => {
    setAIState((currentState) => ({
      ...currentState,
      ...patch,
    }))
  }, [])

  const handleEditorContentSync = useCallback((content: unknown) => {
    setEditorContent(content)
    editorRef.current?.setContent(content)
  }, [])

  const handleGrantConsent = async () => {
    try {
      setConsentLoading(true)
      await grantAIFeaturesConsent()
      setHasConsentOverride(true)
      setConsentOpen(false)
      toast.success(t("ai.toasts.consentGranted"))
    } catch (error) {
      console.error("AI consent failed:", error)
      toast.error(error instanceof Error ? error.message : t("ai.errors.consentRequired"))
    } finally {
      setConsentLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-y bg-muted/50 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sheet open={showTimeline} onOpenChange={setShowTimeline}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {t("toolbar.timeline")}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[600px] sm:max-w-[600px]">
                <SheetHeader>
                  <SheetTitle>{t("toolbar.traumaticTimeline")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <TraumaTimeline history={consultation.patient.medicalHistory} />
                </div>
              </SheetContent>
            </Sheet>

            <Dialog open={showPatientFile} onOpenChange={setShowPatientFile}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  {t("toolbar.patientFile")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t("toolbar.patientFile")}</DialogTitle>
                </DialogHeader>
                <PatientFile patient={consultation.patient} onNavigate={() => setShowPatientFile(false)} />
              </DialogContent>
            </Dialog>

            <Sheet open={showHistory} onOpenChange={setShowHistory}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <History className="mr-1.5 h-3.5 w-3.5" />
                  {t("toolbar.historyChart")}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[500px] sm:max-w-[500px]">
                <SheetHeader>
                  <SheetTitle>{t("toolbar.historySelections")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-[calc(100vh-8rem)] overflow-auto">
                  <BodyChartHistoryViewer history={history} muscleLabels={bodyPartLabels} />
                </div>
              </SheetContent>
            </Sheet>

          </div>

          <QuickNotes onAddNote={handleQuickNote} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-[60%] items-center justify-center overflow-auto border-r bg-muted/30 p-4">
          <BodyChart
            value={bodyChartParts}
            onChange={setBodyChartParts}
            className="border-0 shadow-none"
          />
        </div>

        <div className="flex w-[40%] flex-col overflow-hidden bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b bg-muted/50 px-3 py-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{t("editor.title")}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <AudioSoapModal
                appointmentId={consultation.id}
                noteText={noteText}
                bodyChartParts={bodyChartParts}
                aiState={aiState}
                hasConsent={hasConsent ?? false}
                audioSoapEnabled={aiAccess?.audioSoap ?? false}
                editorContent={editorContent}
                onEditorContentSync={handleEditorContentSync}
                onUpdateAI={handleUpdateAI}
              />
              <SuggestionsModal
                appointmentId={consultation.id}
                noteText={noteText}
                bodyChartParts={bodyChartParts}
                aiState={aiState}
                hasConsent={hasConsent ?? false}
                smartNotesEnabled={aiAccess?.smartNotesLive ?? false}
                editorContent={editorContent}
                onEditorContentSync={handleEditorContentSync}
                onUpdateAI={handleUpdateAI}
              />
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConsultationEditor
              ref={editorRef}
              key={consultation.id}
              initialContent={editorContent}
              onChange={setEditorContent}
            />
          </div>
        </div>
      </div>

      <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ai.consent.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("ai.consent.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("ai.consent.points.minimization")}</p>
            <p>{t("ai.consent.points.vendors")}</p>
            <p>{t("ai.consent.points.revocation")}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              {t("ai.consent.cancel")}
            </Button>
            <Button onClick={handleGrantConsent} disabled={consentLoading}>
              {consentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("ai.consent.accept")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
})
