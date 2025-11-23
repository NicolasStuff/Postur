import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function ProtocolTracker() {
    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-bold text-slate-900">Suivi du Protocole: Gestion du Stress</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-8">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Progression Globale</span>
                        <span>3/8 Séances</span>
                    </div>
                    <Progress value={37.5} className="h-2" />
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                        <div key={step} className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 ${
                            step <= 3 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                step <= 3 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {step}
                            </div>
                            <span className={`text-xs font-medium ${
                                step <= 3 ? 'text-green-700' : 'text-slate-500'
                            }`}>Séance {step}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
