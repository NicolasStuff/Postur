import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ConsultationHeaderProps {
    practitionerName: string
    practitionerType: string
    onFinish: () => void
}

export function ConsultationHeader({ practitionerName, practitionerType, onFinish }: ConsultationHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/calendar" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h2 className="text-xl font-bold text-slate-900">{practitionerType}: {practitionerName}</h2>
            </div>
            <Button onClick={onFinish} className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm px-5 h-10">
                Terminer & Facturer
            </Button>
        </div>
    )
}
