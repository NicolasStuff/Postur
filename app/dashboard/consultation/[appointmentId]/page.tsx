"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { getConsultation, saveConsultationNote } from "@/app/actions/consultation"
import { use } from "react"

// Components
import { ConsultationHeader } from "@/components/consultation/shared/ConsultationHeader"
import { PatientFile } from "@/components/consultation/shared/PatientFile"
import { OsteopathConsultation } from "@/components/consultation/osteopath/OsteopathConsultation"

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

  const practitionerName = consultation.user?.name || 'Praticien'

  const handleSave = async () => {
      // Manual save without billing
      console.log("Saving consultation...")
  }

  const handleFinishAndBill = async () => {
      // Logic to finish consultation and bill
      console.log("Finishing and billing consultation...")
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50/50">
       {/* Header */}
       <div className="shrink-0">
           <ConsultationHeader
                practitionerName={practitionerName}
                practitionerType="OSTEOPATH"
                onSave={handleSave}
                onFinishAndBill={handleFinishAndBill}
                isSaving={saveMutation.isPending}
           />
       </div>

       {/* Main Content */}
       <div className="flex-1 min-h-0">
            <OsteopathConsultation
                consultation={consultation}
                onSave={(data) => saveMutation.mutate(data)}
            />
       </div>
    </div>
  )
}