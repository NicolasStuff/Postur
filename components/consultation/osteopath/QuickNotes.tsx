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
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Notes rapides:</span>
            <div className="flex gap-1.5">
                {quickOptions.map((option) => (
                    <Button
                        key={option}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs hover:bg-slate-100 border-slate-200 text-slate-600 px-2"
                        onClick={() => onAddNote(option)}
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        {option}
                    </Button>
                ))}
            </div>
        </div>
    )
}
