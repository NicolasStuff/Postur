"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { History, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BodyChartHistoryEntry {
    id: string
    selectedParts: string[]
    createdAt: Date
}

interface BodyChartHistoryViewerProps {
    history: BodyChartHistoryEntry[]
    muscleLabels: Record<string, string>
}

export function BodyChartHistoryViewer({ history, muscleLabels }: BodyChartHistoryViewerProps) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

    if (!history || history.length === 0) {
        return (
            <div className="text-sm text-slate-500 text-center py-8">
                Aucun historique de sélection disponible
            </div>
        )
    }

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const getChanges = (current: string[], previous?: string[]) => {
        if (!previous) return { added: current, removed: [] }

        const added = current.filter(part => !previous.includes(part))
        const removed = previous.filter(part => !current.includes(part))

        return { added, removed }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-slate-600" />
                <h3 className="font-medium text-slate-900">Historique des Sélections</h3>
                <Badge variant="secondary" className="ml-auto">
                    {history.length} {history.length > 1 ? 'entrées' : 'entrée'}
                </Badge>
            </div>

            <div className="space-y-2">
                {history.map((entry, index) => {
                    const previousEntry = history[index + 1]
                    const changes = getChanges(entry.selectedParts, previousEntry?.selectedParts)
                    const isExpanded = expandedItems[entry.id]

                    return (
                        <Card key={entry.id} className="p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-slate-900">
                                            {format(new Date(entry.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                        </span>
                                        {index === 0 && (
                                            <Badge variant="default" className="text-xs">
                                                Actuel
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="text-xs text-slate-600 mb-2">
                                        {entry.selectedParts.length} {entry.selectedParts.length > 1 ? 'zones sélectionnées' : 'zone sélectionnée'}
                                    </div>

                                    {/* Changes summary */}
                                    {previousEntry && (changes.added.length > 0 || changes.removed.length > 0) && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {changes.added.length > 0 && (
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    +{changes.added.length}
                                                </Badge>
                                            )}
                                            {changes.removed.length > 0 && (
                                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                    -{changes.removed.length}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="mt-3 space-y-2 pt-2 border-t">
                                            {changes.added.length > 0 && (
                                                <div>
                                                    <div className="text-xs font-medium text-green-700 mb-1">
                                                        Ajouté{changes.added.length > 1 ? 's' : ''} :
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {changes.added.map(part => (
                                                            <Badge key={part} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                {muscleLabels[part] || part}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {changes.removed.length > 0 && (
                                                <div>
                                                    <div className="text-xs font-medium text-red-700 mb-1">
                                                        Retiré{changes.removed.length > 1 ? 's' : ''} :
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {changes.removed.map(part => (
                                                            <Badge key={part} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                                {muscleLabels[part] || part}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {!previousEntry && (
                                                <div>
                                                    <div className="text-xs font-medium text-slate-700 mb-1">
                                                        Zones sélectionnées :
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {entry.selectedParts.map(part => (
                                                            <Badge key={part} variant="outline" className="text-xs">
                                                                {muscleLabels[part] || part}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpand(entry.id)}
                                    className="h-6 w-6 p-0 shrink-0"
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
