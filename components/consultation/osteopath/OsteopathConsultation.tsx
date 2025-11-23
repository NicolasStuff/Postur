import { BodyChart } from "./BodyChart"
import { ConsultationEditor } from "../shared/Editor"
import { TraumaTimeline } from "./TraumaTimeline"
import { QuickNotes } from "./QuickNotes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface OsteopathConsultationProps {
    consultation: any
    onSave: (data: any) => void
}

export function OsteopathConsultation({ consultation, onSave }: OsteopathConsultationProps) {
    const [editorContent, setEditorContent] = useState<any>(null)
    const [bodyChartParts, setBodyChartParts] = useState<string[]>([])

    // Load initial state
    useEffect(() => {
        if (consultation?.note?.content) {
            const content = consultation.note.content as any
            if (content.editor) setEditorContent(content.editor)
            if (content.bodyChart) setBodyChartParts(content.bodyChart)
        }
    }, [consultation])

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

    const handleQuickNote = (text: string) => {
        // This is a bit tricky with the current Editor component as it might not expose a way to append text easily from outside.
        // For now, we will just log it or maybe we need to pass a ref to the editor?
        // Or we can update the editorContent state if we know the structure.
        console.log("Quick note added:", text)
        // Ideally, we would append this to the editor content.
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Top Row: Trauma Timeline */}
            <div className="h-44 shrink-0">
                <TraumaTimeline history={consultation.patient.medicalHistory} />
            </div>

            {/* Bottom Row: Main Work Area */}
            <div className="flex-1 min-h-0">
                <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                    <CardHeader className="pb-4 pt-5 border-b flex flex-row items-center justify-between shrink-0">
                        <CardTitle className="text-base font-bold text-slate-900">Note de Consultation (Ostéopathie)</CardTitle>
                        <QuickNotes onAddNote={handleQuickNote} />
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 p-0 flex overflow-hidden">
                        {/* Body Chart */}
                        <div className="w-1/2 border-r overflow-auto flex items-center justify-center bg-white py-6 px-4">
                            <BodyChart
                                value={bodyChartParts}
                                onChange={setBodyChartParts}
                                className="border-0 shadow-none"
                            />
                        </div>
                        {/* Editor */}
                        <div className="w-1/2 overflow-hidden flex flex-col bg-white">
                            <ConsultationEditor
                                key={consultation.id}
                                initialContent={editorContent}
                                onChange={setEditorContent}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
