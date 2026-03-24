"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    isBilled?: boolean
    invoiceNumber?: string | null
    canFinishAndBill?: boolean
    finishAndBillDisabledReason?: string
    backHref?: string
}

export function ConsultationHeader({
    practitionerName,
    practitionerType,
    onSave,
    onFinishAndBill,
    isSaving,
    isBilled = false,
    invoiceNumber,
    canFinishAndBill = true,
    finishAndBillDisabledReason,
    backHref = "/dashboard/calendar"
}: ConsultationHeaderProps) {
    const t = useTranslations('consultation.shared')

    const handleSave = async () => {
        try {
            await onSave()
            toast.success(t('consultationSaved'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('consultationSaveError'))
        }
    }

    const handleFinishAndBill = async () => {
        try {
            await onFinishAndBill()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('consultationBillError'))
        }
    }

    const getPractitionerLabel = () => {
        const typeMap: Record<string, string> = {
            'OSTEOPATH': t('practitionerTypes.osteopath'),
        }
        return typeMap[practitionerType] || practitionerType
    }

    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b">
            <div className="flex items-center gap-3">
                <Link href={backHref} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{getPractitionerLabel()}: {practitionerName}</h2>
                    {isBilled && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {invoiceNumber ? t('billedWithNumber', { number: invoiceNumber }) : t('alreadyBilled')}
                        </Badge>
                    )}
                    {!isBilled && !canFinishAndBill && finishAndBillDisabledReason && (
                        <Badge variant="secondary" className="border border-amber-200 bg-amber-50 text-amber-700">
                            {finishAndBillDisabledReason}
                        </Badge>
                    )}
                </div>
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
                    disabled={isSaving || isBilled || !canFinishAndBill}
                    className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm px-4 h-8 text-sm"
                >
                    {isBilled ? t('alreadyBilled') : !canFinishAndBill ? t('notBillableYet') : t('finishAndBill')}
                </Button>
            </div>
        </div>
    )
}
