import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface QuickNotesProps {
    onAddNote: (text: string) => void
}

export function QuickNotes({ onAddNote }: QuickNotesProps) {
    const quickOptions = [
        "Blocage Cervical",
        "Bassin Vrillé",
        "Tension Diaphragme",
        "Viscéral",
        "Crânien"
    ]

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Note Rapide:</span>
            <div className="flex gap-2 flex-wrap">
                {quickOptions.map((option) => (
                    <Button
                        key={option}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 px-3"
                        onClick={() => onAddNote(option)}
                    >
                        <Plus className="mr-1.5 h-3 w-3" />
                        {option}
                    </Button>
                ))}
            </div>
        </div>
    )
}
