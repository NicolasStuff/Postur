import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react"

interface PatientFileProps {
    patient: any // Replace with proper type
}

// Helper function to extract text from TipTap JSON content
function extractTextFromTipTap(content: any): string {
    if (!content) return ""

    // Handle case where content has an 'editor' wrapper
    const doc = content.editor || content

    if (!doc || !doc.content) return ""

    let text = ""

    const extractFromNode = (node: any): void => {
        if (node.text) {
            text += node.text
        }
        if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractFromNode)
        }
    }

    if (Array.isArray(doc.content)) {
        doc.content.forEach(extractFromNode)
    }

    return text.trim()
}

export function PatientFile({ patient }: PatientFileProps) {
    // Calculate age if birthDate exists (we'll need to add this to the schema later)
    // For now, we'll skip age if not available

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Patient Info Header */}
            <div className="px-4 py-3 bg-slate-50 border-b">
                <h3 className="text-lg font-semibold text-slate-900">
                    {patient.firstName} {patient.lastName}
                </h3>
                <div className="mt-3 space-y-2">
                    {patient.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{patient.email}</span>
                        </div>
                    )}
                    {patient.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{patient.phone}</span>
                        </div>
                    )}
                    {patient.address && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{patient.address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Patient Notes */}
            {patient.notes && (
                <div className="px-4 py-3 border-b bg-blue-50/50">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Notes</h4>
                    <p className="text-sm text-slate-600">{patient.notes}</p>
                </div>
            )}

            {/* Appointment History */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 border-b bg-slate-50">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Historique des Consultations</h4>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                        {patient.appointments && patient.appointments.length > 0 ? (
                            patient.appointments.map((appointment: any) => (
                                <div
                                    key={appointment.id}
                                    className="rounded-lg border border-l-4 border-l-blue-500 bg-white p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-600">
                                            {format(new Date(appointment.start), 'dd/MM/yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-700 font-medium">
                                        {appointment.service?.name || 'Consultation'}
                                    </div>
                                    {appointment.note && (
                                        <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                                            {extractTextFromTipTap(appointment.note.content)}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">Aucune consultation antérieure</p>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
