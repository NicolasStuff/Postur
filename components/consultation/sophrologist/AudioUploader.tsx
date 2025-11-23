import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Mic } from "lucide-react"

export function AudioUploader() {
    return (
        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
            <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">Enregistrements & Partage</CardTitle>
                <Button size="sm" variant="outline">
                    <Mic className="mr-2 h-4 w-4" />
                    Nouvel Enregistrement
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 m-4 rounded-lg bg-slate-50/50">
                <Upload className="h-10 w-10 text-slate-400 mb-4" />
                <p className="text-slate-900 font-medium mb-1">Glisser-déposer des fichiers audio</p>
                <p className="text-slate-500 text-sm mb-4">MP3, WAV jusqu'à 50MB</p>
                <Button>Sélectionner un fichier</Button>
            </CardContent>
        </Card>
    )
}
