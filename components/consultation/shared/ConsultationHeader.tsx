"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface ConsultationHeaderProps {
    practitionerName: string
    practitionerType: string
    onSave: () => void
    onFinishAndBill: () => void
    isSaving?: boolean
}

export function ConsultationHeader({ practitionerName, practitionerType, onSave, onFinishAndBill, isSaving }: ConsultationHeaderProps) {
    const t = useTranslations('consultation.shared')

    const handleSave = async () => {
        try {
            await onSave()
            toast.success(t('consultationSaved'))
        } catch (error) {
            toast.error(t('consultationSaveError'))
        }
    }

    const handleFinishAndBill = async () => {
        try {
            await onFinishAndBill()
            toast.success(t('consultationBilled'))
        } catch (error) {
            toast.error(t('consultationBillError'))
        }
    }

    const getPractitionerLabel = () => {
        const typeMap: Record<string, string> = {
            'OSTEOPATH': t('practitionerTypes.osteopath'),
            'NATUROPATH': t('practitionerTypes.naturopath'),
            'SOPHROLOGIST': t('practitionerTypes.sophrologist'),
        }
        return typeMap[practitionerType] || practitionerType
    }

    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/calendar" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h2 className="text-base font-semibold text-slate-900">{getPractitionerLabel()}: {practitionerName}</h2>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    onClick={handleSave}
                    variant="outline"
                    disabled={isSaving}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm px-4 h-8 text-sm"
                >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    {t('save')}
                </Button>
                <Button
                    onClick={handleFinishAndBill}
                    disabled={isSaving}
                    className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm px-4 h-8 text-sm"
                >
                    {t('finishAndBill')}
                </Button>
            </div>
        </div>
    )
}
