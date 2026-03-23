import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Phone, MapPin, Calendar } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

interface PatientData {
    id: string
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
    address?: string | null
    notes?: string
    appointments?: Array<{
        id: string
        start: Date | string
        service?: { name: string }
        note?: { content: unknown }
    }>
}

interface PatientFileProps {
    patient: unknown
}

// Helper function to extract text from TipTap JSON content
function extractTextFromTipTap(content: unknown): string {
    if (!content) return ""

    // Handle case where content has an 'editor' wrapper
    let doc: unknown = content
    if (content && typeof content === 'object' && content !== null && 'editor' in content) {
        doc = (content as { editor?: unknown }).editor || content
    }

    if (!doc || typeof doc !== 'object' || doc === null || !('content' in doc)) return ""

    let text = ""

    const extractFromNode = (node: Record<string, unknown>): void => {
        if (node.text) {
            text += node.text
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractFromNode)
        }
    }

    const docContent = (doc as Record<string, unknown>).content
    if (Array.isArray(docContent)) {
        docContent.forEach(extractFromNode)
    }

    return text.trim()
}

export function PatientFile({ patient }: PatientFileProps) {
    const t = useTranslations('consultation.shared')
    const locale = useLocale()
    const dateLocale = locale === 'fr' ? fr : enUS

    // Type assertion for patient data
    const patientData = patient as PatientData

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Patient Info Header */}
            <div className="px-4 py-3 bg-slate-50 border-b">
                <h3 className="text-lg font-semibold text-slate-900">
                    {patientData.firstName} {patientData.lastName}
                </h3>
                <div className="mt-3 space-y-2">
                    {patientData.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{patientData.email}</span>
                        </div>
                    )}
                    {patientData.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{patientData.phone}</span>
                        </div>
                    )}
                    {patientData.address && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{patientData.address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Patient Notes */}
            {patientData.notes && (
                <div className="px-4 py-3 border-b bg-blue-50/50">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">{t('notes')}</h4>
                    <p className="text-sm text-slate-600">{patientData.notes}</p>
                </div>
            )}

            {/* Appointment History */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 border-b bg-slate-50">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('consultationHistory')}</h4>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                        {patientData.appointments && patientData.appointments.length > 0 ? (
                            patientData.appointments.map((appointment) => (
                                <Link
                                    key={appointment.id}
                                    href={`/dashboard/consultation/${appointment.id}?from=patient`}
                                    className="rounded-lg border border-l-4 border-l-blue-500 bg-white p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-600">
                                            {format(new Date(appointment.start), 'dd/MM/yyyy', { locale: dateLocale })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-700 font-medium">
                                        {appointment.service?.name || t('consultation')}
                                    </div>
                                    {appointment.note && (
                                        <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                                            {extractTextFromTipTap(appointment.note.content)}
                                        </div>
                                    )}
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">{t('noConsultations')}</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
