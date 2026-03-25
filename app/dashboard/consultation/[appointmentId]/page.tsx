"use client"

import { use, useMemo, useRef, useState } from "react"
import { Prisma } from "@prisma/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  confirmConsultationBilling,
  getConsultation,
  getConsultationAIAccess,
  prepareConsultationBillingDraft,
  saveConsultationNote,
} from "@/app/actions/consultation"
import {
  createEmptyConsultationAIState,
  type ConsultationAIState,
} from "@/lib/consultation-note"
import {
  OsteopathConsultation,
  OsteopathConsultationRef,
} from "@/components/consultation/osteopath/OsteopathConsultation"
import { SessionClosureDialog } from "@/components/consultation/shared/SessionClosureDialog"
import { ConsultationHeader } from "@/components/consultation/shared/ConsultationHeader"
import { toast } from "sonner"

export default function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = use(params)
  const t = useTranslations("consultation.shared")
  const tDetails = useTranslations("dashboard.consultationDetails")
  const tErrors = useTranslations("errors")
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const consultationRef = useRef<OsteopathConsultationRef>(null)
  const [closureDialogOpen, setClosureDialogOpen] = useState(false)
  const [closureAIState, setClosureAIState] = useState<ConsultationAIState>(createEmptyConsultationAIState())
  const [closureNoteText, setClosureNoteText] = useState("")
  const [closureBodyChartParts, setClosureBodyChartParts] = useState<string[]>([])

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", appointmentId],
    queryFn: () => getConsultation(appointmentId),
  })

  const { data: aiAccess } = useQuery({
    queryKey: ["consultation-ai-access"],
    queryFn: () => getConsultationAIAccess(),
  })

  const saveMutation = useMutation({
    mutationFn: async (data: Prisma.InputJsonValue) => {
      await saveConsultationNote(appointmentId, data)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["consultations"] }),
        queryClient.invalidateQueries({ queryKey: ["consultation", appointmentId] }),
      ])
    },
  })

  const { data: billingDraft, isLoading: isBillingDraftLoading } = useQuery({
    queryKey: ["consultationBillingDraft", appointmentId],
    queryFn: () => prepareConsultationBillingDraft(appointmentId),
    enabled: closureDialogOpen,
  })

  const finishAndBillMutation = useMutation({
    mutationFn: async (payload: {
      patientSnapshot: {
        firstName: string
        lastName: string
        address?: string | null
      }
      serviceName: string
      amount: number
      date: string
    }) =>
      confirmConsultationBilling({
        appointmentId,
        consultationContent: consultationRef.current?.getDraft() ?? { editor: null, bodyChart: [] },
        ...payload,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["consultation", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["consultations"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["consultationBillingDraft", appointmentId] }),
      ])
      setClosureDialogOpen(false)
      toast.success(t("consultationBilled"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("consultationBillError"))
    },
  })

  const backHref = useMemo(() => {
    const from = searchParams.get("from")
    const patientId = searchParams.get("patient")

    if (from === "detail") {
      return `/dashboard/consultation/${appointmentId}/detail`
    }

    if (from === "patientDetail" && patientId) {
      return `/dashboard/patients/${patientId}`
    }

    if (from === "consultations") {
      return patientId ? `/dashboard/consultations?patient=${patientId}` : "/dashboard/consultations"
    }

    if (from === "patient" && consultation?.patient.id) {
      return `/dashboard/consultations?patient=${consultation.patient.id}`
    }

    return "/dashboard/calendar"
  }, [consultation?.patient.id, searchParams])

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">{tDetails("loading")}</div>
  }

  if (!consultation) {
    return <div>{tDetails("notFound")}</div>
  }

  const practitionerName = consultation.user?.name || tDetails("practitioner")
  const practitionerType = consultation.user?.practitionerType || "OSTEOPATH"
  const isSaving = saveMutation.isPending || finishAndBillMutation.isPending
  const finishAndBillDisabledReason =
    consultation.invoice
      ? undefined
      : consultation.status === "CANCELED" || consultation.status === "NOSHOW"
        ? tErrors("consultationCannotBeBilled")
        : undefined

  const handleSave = async () => {
    const draft = consultationRef.current?.getDraft() ?? { editor: null, bodyChart: [] }
    await saveMutation.mutateAsync(draft)
  }

  const handleFinishSession = async () => {
    if (consultationRef.current) {
      setClosureAIState(consultationRef.current.getAIState())
      setClosureNoteText(consultationRef.current.getNoteText())
      setClosureBodyChartParts(consultationRef.current.getBodyChartParts())
    }
    setClosureDialogOpen(true)
  }

  const handleAutosave = async (data: Prisma.InputJsonValue) => {
    await saveMutation.mutateAsync(data)
  }

  return (
    <div className="-m-6 h-[calc(100%+3rem)] flex h-screen flex-col bg-slate-50/50">
      <div className="shrink-0">
        <ConsultationHeader
          practitionerName={practitionerName}
          practitionerType={practitionerType}
          onSave={handleSave}
          onFinishAndBill={handleFinishSession}
          isSaving={isSaving}
          isBilled={Boolean(consultation.invoice)}
          invoiceNumber={consultation.invoice?.number}
          canFinishAndBill={true}
          finishAndBillDisabledReason={finishAndBillDisabledReason}
          backHref={backHref}
        />
      </div>

      <div className="min-h-0 flex-1">
        <OsteopathConsultation
          ref={consultationRef}
          consultation={consultation}
          onSave={handleAutosave}
          aiAccess={aiAccess}
        />
      </div>

      <SessionClosureDialog
        open={closureDialogOpen}
        onOpenChange={setClosureDialogOpen}
        appointmentId={appointmentId}
        noteText={closureNoteText}
        bodyChartParts={closureBodyChartParts}
        aiState={closureAIState}
        hasConsent={aiAccess?.hasConsent ?? false}
        recapEnabled={aiAccess?.patientRecap ?? false}
        billingDraft={billingDraft ?? null}
        isBillingDraftLoading={isBillingDraftLoading}
        onConfirmBilling={async (payload) => {
          try {
            await finishAndBillMutation.mutateAsync(payload)
          } catch {
            // Errors surfaced via mutation onError toast.
          }
        }}
        isBillingSubmitting={finishAndBillMutation.isPending}
        onUpdateAI={(patch) => {
          setClosureAIState((prev) => ({ ...prev, ...patch }))
        }}
      />
    </div>
  )
}
