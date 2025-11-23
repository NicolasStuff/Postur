import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecurrenceManager } from "./RecurrenceManager"
import { AudioUploader } from "./AudioUploader"
import { ProtocolTracker } from "./ProtocolTracker"
import { ConsultationEditor } from "../shared/Editor"
import { useState } from "react"

interface SophrologistConsultationProps {
    consultation: any
    onSave: (data: any) => void
}

export function SophrologistConsultation({ consultation, onSave }: SophrologistConsultationProps) {
    const [activeTab, setActiveTab] = useState("protocol")
    const [editorContent, setEditorContent] = useState<any>(null)

    return (
        <div className="h-full flex flex-col gap-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="protocol">Protocole & Suivi</TabsTrigger>
                        <TabsTrigger value="audio">Audio & Partage</TabsTrigger>
                        <TabsTrigger value="planning">Planification</TabsTrigger>
                        <TabsTrigger value="notes">Notes de Séance</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                    <TabsContent value="protocol" className="h-full m-0">
                        <ProtocolTracker />
                    </TabsContent>
                    <TabsContent value="audio" className="h-full m-0">
                        <AudioUploader />
                    </TabsContent>
                    <TabsContent value="planning" className="h-full m-0">
                        <RecurrenceManager />
                    </TabsContent>
                    <TabsContent value="notes" className="h-full m-0">
                        <Card className="h-full border-slate-200 shadow-sm flex flex-col overflow-hidden bg-white">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-base font-bold text-slate-900">Notes de Séance</CardTitle>
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
