"use client"

import { ConsultationEditor, ConsultationEditorRef } from "../shared/Editor"
import { PatientFile } from "../shared/PatientFile"
import { ProtocolProgress } from "./ProtocolProgress"
import { EmotionalStateTracker } from "./EmotionalStateTracker"
import { ExerciseList } from "./ExerciseList"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { User, FileText, Activity, Brain } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

interface SophrologistConsultationProps {
    consultation: any
    onSave: (data: any) => void
}

interface ProtocolData {
    name: string
    currentSession: number
    totalSessions: number
    sessions: Array<{
        number: number
        date?: string
        completed: boolean
        exercises?: string[]
        notes?: string
    }>
}

interface EmotionalStateData {
    stress: number
    anxiety: number
    wellbeing: number
    notes?: string
}

interface ExerciseData {
    name: string
    duration: number
    completed: boolean
}

export function SophrologistConsultation({ consultation, onSave }: SophrologistConsultationProps) {
    const [editorContent, setEditorContent] = useState<any>(null)
    const [protocolData, setProtocolData] = useState<ProtocolData>({
        name: "Gestion du Stress",
        currentSession: 1,
        totalSessions: 8,
        sessions: Array.from({ length: 8 }, (_, i) => ({
            number: i + 1,
            completed: false
        }))
    })
    const [emotionalState, setEmotionalState] = useState<EmotionalStateData>({
        stress: 5,
        anxiety: 5,
        wellbeing: 5,
        notes: ""
    })
    const [exercises, setExercises] = useState<ExerciseData[]>([])
    const [showPatientFile, setShowPatientFile] = useState(false)
    const [showProtocolHistory, setShowProtocolHistory] = useState(false)
    const editorRef = useRef<ConsultationEditorRef>(null)

    // Load initial state from consultation
    useEffect(() => {
        if (consultation?.note?.content) {
            const content = consultation.note.content as any
            if (content.editor) setEditorContent(content.editor)
            if (content.protocol) setProtocolData(content.protocol)
            if (content.emotionalState) setEmotionalState(content.emotionalState)
            if (content.exercises) setExercises(content.exercises)
        }
    }, [consultation])

    // Auto-save with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editorContent || protocolData || emotionalState || exercises.length > 0) {
                onSave({
                    editor: editorContent,
                    protocol: protocolData,
                    emotionalState: emotionalState,
                    exercises: exercises
                })
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [editorContent, protocolData, emotionalState, exercises, onSave])

    const handleQuickNote = (text: string) => {
        editorRef.current?.insertText(text)
    }

    const handleAddExercise = (exercise: ExerciseData) => {
        setExercises([...exercises, exercise])
    }

    const handleUpdateExercise = (index: number, exercise: ExerciseData) => {
        const newExercises = [...exercises]
        newExercises[index] = exercise
        setExercises(newExercises)
    }

    const handleRemoveExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index))
    }

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

                    <Sheet open={showProtocolHistory} onOpenChange={setShowProtocolHistory}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                <Activity className="h-3.5 w-3.5 mr-1.5" />
                                Historique Protocole
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[500px] sm:max-w-[500px]">
                            <SheetHeader>
                                <SheetTitle>Historique du Protocole</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 overflow-auto h-[calc(100vh-8rem)]">
                                <div className="space-y-4">
                                    {protocolData.sessions
                                        .filter(s => s.completed)
                                        .map(session => (
                                            <div key={session.number} className="p-4 border rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold">Séance {session.number}</h4>
                                                    <span className="text-sm text-slate-500">{session.date}</span>
                                                </div>
                                                {session.notes && (
                                                    <p className="text-sm text-slate-600">{session.notes}</p>
                                                )}
                                                {session.exercises && session.exercises.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium text-slate-500">Exercices :</p>
                                                        <ul className="list-disc list-inside text-sm text-slate-600">
                                                            {session.exercises.map((ex, i) => (
                                                                <li key={i}>{ex}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleQuickNote("Bonne réceptivité aux exercices. ")}
                    >
                        <Brain className="h-3.5 w-3.5 mr-1.5" />
                        Bonne réceptivité
                    </Button>
                </div>
            </div>

            {/* Main Work Area: Protocol Tracking + Notes */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Protocol Zone - Left Side (60%) */}
                <div className="w-[60%] border-r overflow-auto bg-slate-50/30 p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Protocol Progress */}
                        <ProtocolProgress
                            protocol={protocolData}
                            onChange={setProtocolData}
                        />

                        {/* Emotional State Tracker */}
                        <EmotionalStateTracker
                            emotionalState={emotionalState}
                            onChange={setEmotionalState}
                        />

                        {/* Exercise List */}
                        <ExerciseList
                            exercises={exercises}
                            onAdd={handleAddExercise}
                            onUpdate={handleUpdateExercise}
                            onRemove={handleRemoveExercise}
                        />
                    </div>
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
