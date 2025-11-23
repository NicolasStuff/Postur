"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

interface QuickNotesProps {
    onAddNote: (text: string) => void
}

export function QuickNotes({ onAddNote }: QuickNotesProps) {
    const t = useTranslations('consultation.osteopath.quickNotes')

    const quickOptions = [
        { key: 'cervicalBlock', labelKey: 'cervicalBlock' },
        { key: 'twistedPelvis', labelKey: 'twistedPelvis' },
        { key: 'diaphragmTension', labelKey: 'diaphragmTension' },
        { key: 'visceral', labelKey: 'visceral' },
        { key: 'cranial', labelKey: 'cranial' }
    ]

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{t('label')}</span>
            <div className="flex gap-1.5">
                {quickOptions.map((option) => (
                    <Button
                        key={option.key}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs hover:bg-slate-100 border-slate-200 text-slate-600 px-2"
                        onClick={() => onAddNote(t(option.labelKey))}
                    >
                        <Plus className="mr-1 h-3 w-3" />
                        {t(option.labelKey)}
                    </Button>
                ))}
            </div>
        </div>
    )
}
