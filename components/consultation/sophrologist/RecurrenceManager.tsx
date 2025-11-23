import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function RecurrenceManager() {
    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-4">
                <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-sm font-bold text-slate-900">Planifier une série</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Fréquence</Label>
                            <Select defaultValue="weekly">
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                    <SelectItem value="biweekly">Bi-mensuel</SelectItem>
                                    <SelectItem value="monthly">Mensuel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre de séances</Label>
                            <Select defaultValue="8">
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4">4 séances</SelectItem>
                                    <SelectItem value="8">8 séances</SelectItem>
                                    <SelectItem value="12">12 séances</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full">Générer les RDV</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="col-span-8">
                <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="text-sm font-bold text-slate-900">Calendrier Prévisionnel</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 flex items-center justify-center bg-slate-50">
                        <p className="text-slate-500">Aperçu du calendrier ici</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
