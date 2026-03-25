import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Calendar, StickyNote, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations, useLocale } from "next-intl"
import { extractTextFromTipTap } from "@/lib/consultation-note"

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
    onNavigate?: () => void
}

export function PatientFile({ patient, onNavigate }: PatientFileProps) {
    const t = useTranslations('consultation.shared')
    const locale = useLocale()
    const dateLocale = locale === 'fr' ? fr : enUS

    const patientData = patient as PatientData
    const initials = `${patientData.firstName?.[0] ?? ''}${patientData.lastName?.[0] ?? ''}`.toUpperCase()

    return (
        <div className="space-y-5">
            {/* Patient Info Header */}
            <section className="rounded-2xl border bg-slate-50/70 p-5">
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-slate-200 text-slate-700 text-lg font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {patientData.firstName} {patientData.lastName}
                        </h3>
                        <div className="mt-2.5 space-y-1.5">
                            {patientData.email && (
                                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="truncate">{patientData.email}</span>
                                </div>
                            )}
                            {patientData.phone && (
                                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span>{patientData.phone}</span>
                                </div>
                            )}
                            {patientData.address && (
                                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span>{patientData.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Patient Notes */}
            {patientData.notes && (
                <section className="rounded-2xl border bg-amber-50/50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <StickyNote className="h-4 w-4 text-amber-600" />
                        <h4 className="text-sm font-semibold text-slate-900">{t('notes')}</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{patientData.notes}</p>
                </section>
            )}

            {/* Full Profile Link */}
            <div className="flex justify-center">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/patients/${patientData.id}`}>
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        {t('viewFullProfile')}
                    </Link>
                </Button>
            </div>

            {/* Consultation History */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">{t('consultationHistory')}</h4>
                    {patientData.appointments && patientData.appointments.length > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {patientData.appointments.length}
                        </Badge>
                    )}
                </div>
                <ScrollArea className="max-h-[320px]">
                    <div className="space-y-2">
                        {patientData.appointments && patientData.appointments.length > 0 ? (
                            patientData.appointments.map((appointment) => (
                                <Link
                                    key={appointment.id}
                                    href={`/dashboard/consultation/${appointment.id}/detail?from=patient`}
                                    onClick={onNavigate}
                                    className="block rounded-xl border bg-white p-3.5 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-medium text-slate-900">
                                            {format(new Date(appointment.start), 'dd MMMM yyyy', { locale: dateLocale })}
                                        </span>
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {appointment.service?.name || t('consultation')}
                                        </Badge>
                                    </div>
                                    {appointment.note && (
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                            {extractTextFromTipTap(appointment.note.content)}
                                        </p>
                                    )}
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-6">{t('noConsultations')}</p>
                        )}
                    </div>
                </ScrollArea>
            </section>
        </div>
    )
}
