import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function AnamnesisForm() {
    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-bold text-slate-900">Questionnaire d'Anamnèse</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-6">
                    <div className="space-y-8 max-w-2xl mx-auto">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Alimentation</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Nombre de repas par jour</Label>
                                    <Input placeholder="Ex: 3 repas + 1 collation" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Intolérances connues</Label>
                                    <Textarea placeholder="Gluten, lactose..." />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Sommeil</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>Heures de sommeil</Label>
                                    <Input type="number" placeholder="Ex: 7" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Qualité du réveil</Label>
                                    <Input placeholder="Fatigué, en forme..." />
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
