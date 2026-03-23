"use client"

import { use, useMemo, useRef } from "react"
import { Prisma } from "@prisma/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

import {
  finishConsultationAndCreateInvoice,
  getConsultation,
  saveConsultationNote,
} from "@/app/actions/consultation"
import {
  OsteopathConsultation,
  OsteopathConsultationRef,
} from "@/components/consultation/osteopath/OsteopathConsultation"
import { ConsultationHeader } from "@/components/consultation/shared/ConsultationHeader"

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = use(params)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const consultationRef = useRef<OsteopathConsultationRef>(null)

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", appointmentId],
    queryFn: () => getConsultation(appointmentId),
  })

  const saveMutation = useMutation({
    mutationFn: async (data: Prisma.InputJsonValue) => {
      await saveConsultationNote(appointmentId, data)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["consultation", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["consultations"] }),
      ])
    },
  })

  const finishAndBillMutation = useMutation({
    mutationFn: async (data: Prisma.InputJsonValue) =>
      finishConsultationAndCreateInvoice(appointmentId, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["consultation", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["consultations"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      ])
    },
  })

  const backHref = useMemo(() => {
    const from = searchParams.get("from")
    const patientId = searchParams.get("patient")

    if (from === "consultations") {
      return patientId ? `/dashboard/consultations?patient=${patientId}` : "/dashboard/consultations"
    }

    if (from === "patient" && consultation?.patient.id) {
      return `/dashboard/consultations?patient=${consultation.patient.id}`
    }

    return "/dashboard/calendar"
  }, [consultation?.patient.id, searchParams])

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>
  }

  if (!consultation) {
    return <div>Consultation not found</div>
  }

  const practitionerName = consultation.user?.name || "Praticien"
  const practitionerType = consultation.user?.practitionerType || "OSTEOPATH"
  const isSaving = saveMutation.isPending || finishAndBillMutation.isPending

  const getDraft = () =>
    consultationRef.current?.getDraft() ?? {
      editor: null,
      bodyChart: [],
    }

  const handleSave = async () => {
    await saveMutation.mutateAsync(getDraft())
  }

  const handleFinishAndBill = async () => {
    await finishAndBillMutation.mutateAsync(getDraft())
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50/50">
      <div className="shrink-0">
        <ConsultationHeader
          practitionerName={practitionerName}
          practitionerType={practitionerType}
          onSave={handleSave}
          onFinishAndBill={handleFinishAndBill}
          isSaving={isSaving}
          isBilled={Boolean(consultation.invoice)}
          invoiceNumber={consultation.invoice?.number}
          backHref={backHref}
        />
      </div>

      <div className="min-h-0 flex-1">
        <OsteopathConsultation
          ref={consultationRef}
          consultation={consultation}
          onSave={(data) => saveMutation.mutateAsync(data)}
        />
      </div>
    </div>
  )
}
