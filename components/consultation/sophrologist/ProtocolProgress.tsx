"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, Circle, Edit2, Save, X } from "lucide-react"
import { useState } from "react"

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

interface ProtocolProgressProps {
    protocol: ProtocolData
    onChange: (protocol: ProtocolData) => void
}

export function ProtocolProgress({ protocol, onChange }: ProtocolProgressProps) {
    const [editingProtocol, setEditingProtocol] = useState(false)
    const [protocolName, setProtocolName] = useState(protocol.name)
    const [editingSession, setEditingSession] = useState<number | null>(null)
    const [sessionNotes, setSessionNotes] = useState("")

    const completedSessions = protocol.sessions.filter(s => s.completed).length
    const progressPercentage = (completedSessions / protocol.totalSessions) * 100

    const handleSaveProtocolName = () => {
        onChange({
            ...protocol,
            name: protocolName
        })
        setEditingProtocol(false)
    }

    const handleToggleSession = (sessionNumber: number) => {
        const updatedSessions = protocol.sessions.map(session => {
            if (session.number === sessionNumber) {
                return {
                    ...session,
                    completed: !session.completed,
                    date: !session.completed ? new Date().toISOString().split('T')[0] : session.date
                }
            }
            return session
        })

        onChange({
            ...protocol,
            sessions: updatedSessions,
            currentSession: Math.min(completedSessions + 1, protocol.totalSessions)
        })
    }

    const handleEditSession = (sessionNumber: number) => {
        const session = protocol.sessions.find(s => s.number === sessionNumber)
        if (session) {
            setEditingSession(sessionNumber)
            setSessionNotes(session.notes || "")
        }
    }

    const handleSaveSessionNotes = () => {
        if (editingSession !== null) {
            const updatedSessions = protocol.sessions.map(session => {
                if (session.number === editingSession) {
                    return {
                        ...session,
                        notes: sessionNotes
                    }
                }
                return session
            })

            onChange({
                ...protocol,
                sessions: updatedSessions
            })
            setEditingSession(null)
            setSessionNotes("")
        }
    }

    return (
        <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                    {editingProtocol ? (
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                value={protocolName}
                                onChange={(e) => setProtocolName(e.target.value)}
                                className="max-w-md"
                            />
                            <Button size="sm" onClick={handleSaveProtocolName}>
                                <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingProtocol(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <CardTitle className="text-base font-bold text-slate-900">
                                Suivi du Protocole: {protocol.name}
                            </CardTitle>
                            <Button size="sm" variant="ghost" onClick={() => setEditingProtocol(true)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Progression Globale</span>
                        <span>{completedSessions}/{protocol.totalSessions} Séances</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Session Grid */}
                <div className="grid grid-cols-4 gap-4">
                    {protocol.sessions.map((session) => (
                        <div
                            key={session.number}
                            className={`group relative p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                session.completed
                                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => handleToggleSession(session.number)}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                                session.completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-200 text-slate-500'
                            }`}>
                                {session.completed ? (
                                    <CheckCircle2 className="h-6 w-6" />
                                ) : (
                                    <Circle className="h-6 w-6" />
                                )}
                            </div>
                            <span className={`text-xs font-medium ${
                                session.completed ? 'text-green-700' : 'text-slate-500'
                            }`}>
                                Séance {session.number}
                            </span>
                            {session.date && (
                                <span className="text-xs text-slate-400">{session.date}</span>
                            )}

                            {session.completed && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditSession(session.number)
                                    }}
                                >
                                    <Edit2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Edit Session Modal */}
                {editingSession !== null && (
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium">Notes de la Séance {editingSession}</Label>
                            </div>
                            <Textarea
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                placeholder="Ajoutez vos notes pour cette séance..."
                                className="min-h-[100px]"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveSessionNotes}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Enregistrer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditingSession(null)
                                        setSessionNotes("")
                                    }}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
