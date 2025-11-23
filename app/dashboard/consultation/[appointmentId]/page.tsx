"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getConsultation, saveConsultationNote } from "@/app/actions/consultation"
import { useEffect, useState, use } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Components
import { ConsultationHeader } from "@/components/consultation/shared/ConsultationHeader"
import { PatientFile } from "@/components/consultation/shared/PatientFile"
import { OsteopathConsultation } from "@/components/consultation/osteopath/OsteopathConsultation"
import { NaturopathConsultation } from "@/components/consultation/naturopath/NaturopathConsultation"
import { SophrologistConsultation } from "@/components/consultation/sophrologist/SophrologistConsultation"

export default function ConsultationPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params)

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation', appointmentId],
    queryFn: () => getConsultation(appointmentId)
  })

  const saveMutation = useMutation({
      mutationFn: async (data: any) => {
          await saveConsultationNote(appointmentId, data)
      }
  })

  if (isLoading) return <div className="flex h-full items-center justify-center">Loading...</div>
  if (!consultation) return <div>Consultation not found</div>

  const practitionerType = consultation.user?.practitionerType || 'OSTEOPATH'
  const practitionerName = consultation.user?.name || 'Praticien'

  const handleFinish = () => {
      // Logic to finish consultation
      console.log("Finishing consultation...")
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50/50">
       {/* Top Header */}
       <header className="flex h-16 items-center justify-between border-b bg-white px-6 shrink-0">
            <h1 className="text-lg font-bold text-slate-800">Consultation Mode</h1>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-500">
                    <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3 pl-4 border-l">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 cursor-pointer">
                        <span className="text-sm font-medium text-slate-700">{practitionerName}</span>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                    </div>
                </div>
            </div>
       </header>

       {/* Sub Header */}
       <div className="shrink-0">
           <ConsultationHeader
                practitionerName={practitionerName}
                practitionerType={practitionerType}
                onFinish={handleFinish}
           />
       </div>

       {/* Main Content */}
       <div className="flex-1 min-h-0 px-6 pb-6 pt-4">
            <div className="grid grid-cols-12 gap-6 h-full">
                {/* Left Column: Patient File */}
                <div className="col-span-3 h-full overflow-hidden">
                    <PatientFile patient={consultation.patient} />
                </div>

                {/* Right Column: Dynamic Consultation Note */}
                <div className="col-span-9 h-full overflow-hidden">
                    {practitionerType === 'OSTEOPATH' && (
                        <OsteopathConsultation
                            consultation={consultation}
                            onSave={(data) => saveMutation.mutate(data)}
                        />
                    )}
                    {practitionerType === 'NATUROPATH' && (
                        <NaturopathConsultation
                            consultation={consultation}
                            onSave={(data) => saveMutation.mutate(data)}
                        />
                    )}
                    {practitionerType === 'SOPHROLOGIST' && (
                        <SophrologistConsultation
                            consultation={consultation}
                            onSave={(data) => saveMutation.mutate(data)}
                        />
                    )}
                </div>
            </div>
       </div>
    </div>
  )
}