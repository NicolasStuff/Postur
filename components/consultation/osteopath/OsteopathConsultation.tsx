"use client"

import { BodyChart } from "./BodyChart"
import { ConsultationEditor, ConsultationEditorRef } from "../shared/Editor"
import { TraumaTimeline } from "./TraumaTimeline"
import { QuickNotes } from "./QuickNotes"
import { PatientFile } from "../shared/PatientFile"
import { BodyChartHistoryViewer } from "./BodyChartHistoryViewer"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Clock, User, FileText, History } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { saveBodyChartHistory, getBodyChartHistory } from "@/app/actions/consultation"
import { bodyPartLabels } from "@/lib/bodyChartLabels"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface BodyChartHistoryItem {
    id: string
    createdAt: Date
    bodyParts: string[]
}

interface Patient {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    medicalHistory?: unknown
}

interface Consultation {
    id: string
    patient: Patient
    note?: {
        content?: {
            editor?: unknown
            bodyChart?: string[]
        }
    }
}

interface OsteopathConsultationProps {
    consultation: Consultation
    onSave: (data: { editor: unknown; bodyChart: string[] }) => void
}

export function OsteopathConsultation({ consultation, onSave }: OsteopathConsultationProps) {
    const t = useTranslations('consultation.osteopath')

    // Initialize state with existing consultation data
    const [editorContent, setEditorContent] = useState<unknown>(() => {
        return consultation?.note?.content?.editor || null
    })
    const [bodyChartParts, setBodyChartParts] = useState<string[]>(() => {
        return consultation?.note?.content?.bodyChart || []
    })
    const [showTimeline, setShowTimeline] = useState(false)
    const [showPatientFile, setShowPatientFile] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [history, setHistory] = useState<BodyChartHistoryItem[]>([])
    const editorRef = useRef<ConsultationEditorRef>(null)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const loadHistory = async () => {
        try {
            const historyData = await getBodyChartHistory(consultation.id)
            setHistory(historyData)
        } catch (error) {
            console.error("Failed to load history:", error)
        }
    }

    // Load history when consultation changes
    useEffect(() => {
        if (consultation?.id) {
            loadHistory()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadHistory is defined inside component but doesn't need to be a dependency
    }, [consultation?.id])

    // Auto-save logic (simplified wrapper)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editorContent || bodyChartParts.length > 0) {
                onSave({
                    editor: editorContent,
                    bodyChart: bodyChartParts
                })
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [editorContent, bodyChartParts, onSave])

    // Save body chart history with debounce
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(async () => {
            if (bodyChartParts.length > 0 && consultation?.id) {
                try {
                    await saveBodyChartHistory(consultation.id, bodyChartParts)
                    await loadHistory() // Reload history after save
                } catch (error) {
                    console.error("Failed to save body chart history:", error)
                    toast.error(t('errors.historySaveFailed'))
                }
            }
        }, 5000) // Wait 5 seconds before saving to history

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadHistory and t are stable, only need to react to bodyChartParts and consultation.id changes
    }, [bodyChartParts, consultation?.id])

    const handleQuickNote = (text: string) => {
        editorRef.current?.insertText(text)
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Compact Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-t bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                    <Sheet open={showTimeline} onOpenChange={setShowTimeline}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                {t('toolbar.timeline')}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[600px] sm:max-w-[600px]">
                            <SheetHeader>
                                <SheetTitle>{t('toolbar.traumaticTimeline')}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                                <TraumaTimeline history={consultation.patient.medicalHistory} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Sheet open={showPatientFile} onOpenChange={setShowPatientFile}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <User className="h-3.5 w-3.5 mr-1.5" />
                                {t('toolbar.patientFile')}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[400px] sm:max-w-[400px]">
                            <SheetHeader>
                                <SheetTitle>{t('toolbar.patientFile')}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                                <PatientFile patient={consultation.patient} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Sheet open={showHistory} onOpenChange={setShowHistory}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <History className="h-3.5 w-3.5 mr-1.5" />
                                {t('toolbar.historyChart')}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[500px] sm:max-w-[500px]">
                            <SheetHeader>
                                <SheetTitle>{t('toolbar.historySelections')}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 overflow-auto h-[calc(100vh-8rem)]">
                                <BodyChartHistoryViewer
                                    history={history}
                                    muscleLabels={bodyPartLabels}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <QuickNotes onAddNote={handleQuickNote} />
            </div>

            {/* Main Work Area: Body Map + Notes */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Body Chart - Left Side (60%) */}
                <div className="w-[60%] border-r overflow-auto flex items-center justify-center bg-slate-50/30 p-4">
                    <BodyChart
                        value={bodyChartParts}
                        onChange={setBodyChartParts}
                        className="border-0 shadow-none"
                    />
                </div>

                {/* Editor - Right Side (40%) */}
                <div className="w-[40%] overflow-hidden flex flex-col bg-white">
                    <div className="px-3 py-2 border-b bg-slate-50/30 flex items-center gap-2 shrink-0">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">{t('editor.title')}</span>
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
}
