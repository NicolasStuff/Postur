"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ConsultationHeaderProps {
    practitionerName: string
    practitionerType: string
    onSave: () => void
    onFinishAndBill: () => void
    isSaving?: boolean
}

export function ConsultationHeader({ practitionerName, practitionerType, onSave, onFinishAndBill, isSaving }: ConsultationHeaderProps) {
    const handleSave = async () => {
        try {
            await onSave()
            toast.success("Consultation sauvegardée avec succès")
        } catch (error) {
            toast.error("Erreur lors de la sauvegarde")
        }
    }

    const handleFinishAndBill = async () => {
        try {
            await onFinishAndBill()
            toast.success("Consultation terminée et facturée")
        } catch (error) {
            toast.error("Erreur lors de la facturation")
        }
    }

    const practitionerLabel = practitionerType === 'OSTEOPATH' ? 'Ostéopathe' : practitionerType

    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/calendar" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h2 className="text-base font-semibold text-slate-900">{practitionerLabel}: {practitionerName}</h2>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    onClick={handleSave}
                    variant="outline"
                    disabled={isSaving}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm px-4 h-8 text-sm"
                >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Sauvegarder
                </Button>
                <Button
                    onClick={handleFinishAndBill}
                    disabled={isSaving}
                    className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm px-4 h-8 text-sm"
                >
                    Terminer & Facturer
                </Button>
            </div>
        </div>
    )
}
