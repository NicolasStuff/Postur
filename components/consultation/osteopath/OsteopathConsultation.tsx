"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Prisma } from "@prisma/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Clock, FileText, History, User } from "lucide-react"

import { saveBodyChartHistory, getBodyChartHistory } from "@/app/actions/consultation"
import { bodyPartLabels } from "@/lib/bodyChartLabels"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
  note?: {
    content?: Prisma.JsonValue
  } | null
}

interface OsteopathConsultationProps {
  consultation: Consultation
  onSave: (data: Prisma.InputJsonValue) => Promise<unknown>
}

export interface OsteopathConsultationRef {
  getDraft: () => Prisma.InputJsonValue
  saveNow: () => Promise<void>
}

function getConsultationContent(consultation: Consultation) {
  const content = consultation.note?.content
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as { editor?: unknown; bodyChart?: string[] }
  }

  return {}
}

export const OsteopathConsultation = forwardRef<
  OsteopathConsultationRef,
  OsteopathConsultationProps
>(function OsteopathConsultation({ consultation, onSave }, ref) {
  const t = useTranslations("consultation.osteopath")
  const [editorContent, setEditorContent] = useState<unknown>(() => {
    return getConsultationContent(consultation).editor || null
  })
  const [bodyChartParts, setBodyChartParts] = useState<string[]>(() => {
    return getConsultationContent(consultation).bodyChart || []
  })
  const [showTimeline, setShowTimeline] = useState(false)
  const [showPatientFile, setShowPatientFile] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<BodyChartHistoryItem[]>([])
  const editorRef = useRef<ConsultationEditorRef>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadHistory = useCallback(async () => {
    try {
      const historyData = await getBodyChartHistory(consultation.id)
      setHistory(historyData)
    } catch (error) {
      console.error("Failed to load history:", error)
    }
  }, [consultation.id])

  const buildDraft = useCallback((): Prisma.InputJsonValue => ({
    editor: (editorContent ?? null) as Prisma.InputJsonValue,
    bodyChart: bodyChartParts,
  }), [bodyChartParts, editorContent])

  const persistDraft = useCallback(async () => {
    await onSave(buildDraft())
  }, [buildDraft, onSave])

  useImperativeHandle(
    ref,
    () => ({
      getDraft: buildDraft,
      saveNow: persistDraft,
    }),
    [buildDraft, persistDraft]
  )

  useEffect(() => {
    const content = getConsultationContent(consultation)
    setEditorContent(content.editor || null)
    setBodyChartParts(content.bodyChart || [])
  }, [consultation])

  useEffect(() => {
    if (consultation?.id) {
      void loadHistory()
    }
  }, [consultation?.id, loadHistory])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editorContent || bodyChartParts.length > 0) {
        void onSave(buildDraft())
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [bodyChartParts, buildDraft, editorContent, onSave])

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (bodyChartParts.length > 0 && consultation?.id) {
        try {
          await saveBodyChartHistory(consultation.id, bodyChartParts)
          await loadHistory()
        } catch (error) {
          console.error("Failed to save body chart history:", error)
          toast.error(t("errors.historySaveFailed"))
        }
      }
    }, 5000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [bodyChartParts, consultation?.id, loadHistory, t])

  const handleQuickNote = (text: string) => {
    editorRef.current?.insertText(text)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-y bg-slate-50/50 px-4 py-2.5">
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

            <Sheet open={showPatientFile} onOpenChange={setShowPatientFile}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <User className="mr-1.5 h-3.5 w-3.5" />
                  {t("toolbar.patientFile")}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[400px] sm:max-w-[400px]">
                <SheetHeader>
                  <SheetTitle>{t("toolbar.patientFile")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <PatientFile patient={consultation.patient} />
                </div>
              </SheetContent>
            </Sheet>

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
        <div className="flex w-[60%] items-center justify-center overflow-auto border-r bg-slate-50/30 p-4">
          <BodyChart
            value={bodyChartParts}
            onChange={setBodyChartParts}
            className="border-0 shadow-none"
          />
        </div>

        <div className="flex w-[40%] flex-col overflow-hidden bg-white">
          <div className="flex shrink-0 items-center gap-2 border-b bg-slate-50/30 px-3 py-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{t("editor.title")}</span>
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
    </div>
  )
})
