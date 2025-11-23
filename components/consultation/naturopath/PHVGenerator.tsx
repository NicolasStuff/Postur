import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical } from "lucide-react"

export function PHVGenerator() {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            {/* Library Sidebar */}
            <div className="col-span-4 h-full flex flex-col gap-4">
                <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-sm font-bold text-slate-900">Bibliothèque de Conseils</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4 space-y-2">
                        {['Alimentation Anti-inflammatoire', 'Gestion du Stress', 'Sommeil Réparateur', 'Détox Foie'].map((item) => (
                            <div key={item} className="p-3 border rounded-md bg-slate-50 hover:bg-slate-100 cursor-grab active:cursor-grabbing flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">{item}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Builder Area */}
            <div className="col-span-8 h-full flex flex-col gap-4">
                <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                    <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-900">Programme d'Hygiène Vitale</CardTitle>
                        <Button size="sm">Générer PDF</Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-8 bg-slate-50/50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 m-4 rounded-lg">
                        <p className="text-slate-500 text-sm">Glissez-déposez des conseils ici pour construire le programme</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
