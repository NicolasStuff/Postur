import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PatientFileProps {
    patient: any // Replace with proper type
}

export function PatientFile({ patient }: PatientFileProps) {
    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
            <CardHeader className="pb-4 pt-5 border-b shrink-0">
                <CardTitle className="text-base font-bold text-slate-900">Dossier Patient: {patient.lastName}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-auto p-5 space-y-6">
                <div className="space-y-2 pb-4 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">Age: <span className="font-normal text-slate-600">45</span></p>
                    <p className="text-sm font-medium text-slate-900">Profession: <span className="font-normal text-slate-600">Informaticien</span></p>
                </div>

                <div className="space-y-3">
                    {[1, 2, 3, 4].map((_, i) => (
                        <div key={i} className="rounded-lg border border-l-4 border-l-slate-500 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="mb-1.5 text-xs font-semibold text-slate-500">20/10/2025: Douleur lombaire basse</div>
                            <div className="text-sm text-slate-700">Douleur lombaire basse</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
