"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { BodyChart } from "@/components/consultation/BodyChart"
import { ConsultationEditor } from "@/components/consultation/Editor"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, FileText, Loader2 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getConsultation, saveConsultationNote } from "@/app/actions/consultation"
import { useEffect, useState, use } from "react"
import { useDebounce } from "@/lib/hooks" // Need to create this or just inline debounce

export default function ConsultationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params)

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation', appointmentId],
    queryFn: () => getConsultation(appointmentId)
  })

  const [editorContent, setEditorContent] = useState<any>(null)
  const [bodyChartParts, setBodyChartParts] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Load initial state
  useEffect(() => {
    if (consultation?.note?.content) {
        const content = consultation.note.content as any
        if (content.editor) setEditorContent(content.editor)
        if (content.bodyChart) setBodyChartParts(content.bodyChart)
    }
  }, [consultation])

  const saveMutation = useMutation({
      mutationFn: async () => {
          setIsSaving(true)
          await saveConsultationNote(appointmentId, {
              editor: editorContent,
              bodyChart: bodyChartParts
          })
          setIsSaving(false)
      }
  })

  // Auto-save logic (simplified)
  useEffect(() => {
      const timer = setTimeout(() => {
          if (editorContent || bodyChartParts.length > 0) {
              saveMutation.mutate()
          }
      }, 2000)
      return () => clearTimeout(timer)
  }, [editorContent, bodyChartParts])

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!consultation) return <div>Consultation not found</div>

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
       {/* Header */}
       <header className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/calendar">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold">Consultation with {consultation.patient.firstName} {consultation.patient.lastName}</h1>
                    <p className="text-sm text-muted-foreground">{new Date(consultation.start).toLocaleString()}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
                <Button className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="mr-2 h-4 w-4" /> Terminer & Facturer</Button>
            </div>
       </header>

       <ResizablePanelGroup direction="horizontal" className="flex-1 border rounded-lg shadow-sm bg-background">
          {/* Left Panel: Patient Context */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-semibold mb-2">Patient Profile</h3>
                    <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Email:</span> {consultation.patient.email}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {consultation.patient.phone}</p>
                    </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <h4 className="text-sm font-semibold mb-4 flex items-center"><FileText className="mr-2 h-4 w-4"/> History</h4>
                    <div className="space-y-4">
                         {consultation.patient.appointments.map((appt) => (
                             <Card key={appt.id}>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm">{new Date(appt.start).toLocaleDateString()}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                                    {/* Just showing raw date for now, ideally extract text from json */}
                                    Appointment details...
                                </CardContent>
                             </Card>
                         ))}
                    </div>
                </ScrollArea>
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Right Panel: Active Work */}
          <ResizablePanel defaultSize={65}>
             <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>
                    <div className="h-full p-4 flex flex-col">
                        <h3 className="font-semibold mb-2">Clinical Notes</h3>
                        {/* Key to force re-render when loading content initially */}
                        <ConsultationEditor 
                            key={consultation.id} 
                            initialContent={editorContent} 
                            onChange={setEditorContent} 
                        />
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>
                     <div className="h-full p-4 flex flex-col">
                        <h3 className="font-semibold mb-2">Body Chart</h3>
                        <BodyChart 
                            value={bodyChartParts} 
                            onChange={setBodyChartParts} 
                        />
                    </div>
                </ResizablePanel>
             </ResizablePanelGroup>
          </ResizablePanel>
       </ResizablePanelGroup>
    </div>
  )
}