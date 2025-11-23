import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnamnesisForm } from "./AnamnesisForm"
import { PHVGenerator } from "./PHVGenerator"
import { ConsultationEditor } from "../shared/Editor"
import { useState } from "react"

interface NaturopathConsultationProps {
    consultation: any
    onSave: (data: any) => void
}

export function NaturopathConsultation({ consultation, onSave }: NaturopathConsultationProps) {
    const [activeTab, setActiveTab] = useState("anamnesis")
    const [editorContent, setEditorContent] = useState<any>(null)

    return (
        <div className="h-full flex flex-col gap-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="anamnesis">Anamnèse</TabsTrigger>
                        <TabsTrigger value="phv">Programme Hygiène Vitale</TabsTrigger>
                        <TabsTrigger value="notes">Notes Libres</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <TabsContent value="anamnesis" className="h-full m-0">
                        <AnamnesisForm />
                    </TabsContent>
                    <TabsContent value="phv" className="h-full m-0">
                        <PHVGenerator />
                    </TabsContent>
                    <TabsContent value="notes" className="h-full m-0">
                        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-base font-bold text-slate-900">Notes de Consultation</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden p-4 flex flex-col bg-white">
                                <ConsultationEditor 
                                    key={consultation.id} 
                                    initialContent={editorContent} 
                                    onChange={setEditorContent} 
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
