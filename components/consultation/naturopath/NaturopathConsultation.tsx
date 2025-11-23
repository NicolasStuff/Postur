"use client"

import { ConsultationEditor, ConsultationEditorRef } from "../shared/Editor"
import { PatientFile } from "../shared/PatientFile"
import { AnamnesisForm } from "./AnamnesisForm"
import { PHVBuilder } from "./PHVBuilder"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { User, ClipboardList, FileText } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface NaturopathConsultationProps {
    consultation: any
    onSave: (data: any) => void
}

export function NaturopathConsultation({ consultation, onSave }: NaturopathConsultationProps) {
    const [editorContent, setEditorContent] = useState<any>(null)
    const [phvProgram, setPhvProgram] = useState<any[]>([])
    const [anamnesisData, setAnamnesisData] = useState<any>({})
    const [showPatientFile, setShowPatientFile] = useState(false)
    const [showAnamnesis, setShowAnamnesis] = useState(false)
    const editorRef = useRef<ConsultationEditorRef>(null)

    // Load initial state
    useEffect(() => {
        if (consultation?.note?.content) {
            const content = consultation.note.content as any
            if (content.editor) setEditorContent(content.editor)
            if (content.phvProgram) setPhvProgram(content.phvProgram)
            if (content.anamnesis) setAnamnesisData(content.anamnesis)
        }
    }, [consultation])

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editorContent || phvProgram.length > 0 || Object.keys(anamnesisData).length > 0) {
                onSave({
                    editor: editorContent,
                    phvProgram,
                    anamnesis: anamnesisData
                })
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [editorContent, phvProgram, anamnesisData, onSave])

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Compact Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-t bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2">
                    <Sheet open={showPatientFile} onOpenChange={setShowPatientFile}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <User className="h-3.5 w-3.5 mr-1.5" />
                                Dossier Patient
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[400px] sm:max-w-[400px]">
                            <SheetHeader>
                                <SheetTitle>Dossier Patient</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4">
                                <PatientFile patient={consultation.patient} />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Sheet open={showAnamnesis} onOpenChange={setShowAnamnesis}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                                Anamnèse
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[500px] sm:max-w-[500px]">
                            <SheetHeader>
                                <SheetTitle>Questionnaire d'Anamnèse</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 h-[calc(100vh-100px)]">
                                <AnamnesisForm
                                    data={anamnesisData}
                                    onChange={setAnamnesisData}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Main Work Area: PHV Builder + Notes */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* PHV Builder - Left Side (60%) */}
                <div className="w-[60%] border-r overflow-auto bg-slate-50/30">
                    <PHVBuilder
                        program={phvProgram}
                        onChange={setPhvProgram}
                    />
                </div>

                {/* Editor - Right Side (40%) */}
                <div className="w-[40%] overflow-hidden flex flex-col bg-white">
                    <div className="px-3 py-2 border-b bg-slate-50/30 flex items-center gap-2 shrink-0">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Notes de Consultation</span>
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
