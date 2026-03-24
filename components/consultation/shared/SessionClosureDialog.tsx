"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  BrainCircuit,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  generatePatientRecap,
  saveValidatedRecap,
} from "@/app/actions/consultation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ConsultationAIState, PatientRecap } from "@/lib/consultation-note"
import {
  ConsultationBillingDraft,
  ConsultationBillingForm,
  BillingPayload,
} from "./ConsultationBillingForm"

type ClosureStep = "recap-proposal" | "recap-edit" | "billing"

interface SessionClosureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  noteText: string
  bodyChartParts: string[]
  aiState: ConsultationAIState
  hasConsent: boolean
  recapEnabled: boolean
  billingDraft: ConsultationBillingDraft | null
  isBillingDraftLoading: boolean
  onConfirmBilling: (payload: BillingPayload) => Promise<void>
  isBillingSubmitting: boolean
  onUpdateAI: (patch: Partial<ConsultationAIState>) => void
}

interface RecapFormState {
  summary: string
  advice: string[]
  exercises: string[]
  precautions: string[]
  followUp: string
  generatedAt: string
  model: string
}

function recapToFormState(recap: PatientRecap): RecapFormState {
  return {
    summary: recap.summary,
    advice: [...recap.advice],
    exercises: [...recap.exercises],
    precautions: [...recap.precautions],
    followUp: recap.followUp,
    generatedAt: recap.generatedAt,
    model: recap.model,
  }
}

export function SessionClosureDialog({
  open,
  onOpenChange,
  appointmentId,
  noteText,
  bodyChartParts,
  aiState,
  hasConsent,
  recapEnabled,
  billingDraft,
  isBillingDraftLoading,
  onConfirmBilling,
  isBillingSubmitting,
  onUpdateAI,
}: SessionClosureDialogProps) {
  const t = useTranslations("consultation.shared.closure")
  const [step, setStep] = useState<ClosureStep>("recap-proposal")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingRecap, setIsSavingRecap] = useState(false)
  const [recapForm, setRecapForm] = useState<RecapFormState | null>(null)

  const canGenerateRecap = recapEnabled && hasConsent && (Boolean(noteText) || Boolean(aiState.soapDraft?.summary))

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("recap-proposal")
      setRecapForm(null)
    }
    onOpenChange(nextOpen)
  }

  const handleGenerateRecap = async () => {
    try {
      setIsGenerating(true)
      const recap = await generatePatientRecap(appointmentId, {
        bodyChart: bodyChartParts,
        noteText,
        soapSummary: aiState.soapDraft?.summary || "",
      })
      onUpdateAI({ patientRecap: recap })
      setRecapForm(recapToFormState(recap))
      setStep("recap-edit")
    } catch (error) {
      console.error("Patient recap failed:", error)
      toast.error(error instanceof Error ? error.message : t("recapGenerationFailed"))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSkipRecap = () => {
    setStep("billing")
  }

  const handleValidateRecap = async () => {
    if (!recapForm) return

    try {
      setIsSavingRecap(true)
      await saveValidatedRecap(appointmentId, recapForm)
      onUpdateAI({
        patientRecap: {
          ...recapForm,
          validatedAt: new Date().toISOString(),
          editedByPractitioner: true,
        },
      })
      toast.success(t("recapValidated"))
      setStep("billing")
    } catch (error) {
      console.error("Save recap failed:", error)
      toast.error(error instanceof Error ? error.message : t("recapSaveFailed"))
    } finally {
      setIsSavingRecap(false)
    }
  }

  const handleRegenerateRecap = async () => {
    await handleGenerateRecap()
  }

  const updateListItem = (
    field: "advice" | "exercises" | "precautions",
    index: number,
    value: string
  ) => {
    setRecapForm((prev) => {
      if (!prev) return prev
      const list = [...prev[field]]
      list[index] = value
      return { ...prev, [field]: list }
    })
  }

  const addListItem = (field: "advice" | "exercises" | "precautions") => {
    setRecapForm((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: [...prev[field], ""] }
    })
  }

  const removeListItem = (field: "advice" | "exercises" | "precautions", index: number) => {
    setRecapForm((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: prev[field].filter((_, i) => i !== index) }
    })
  }

  const stepIndicator = (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={step === "recap-proposal" || step === "recap-edit" ? "font-semibold text-foreground" : ""}>
        {t("stepRecap")}
      </span>
      <ChevronRight className="h-3 w-3" />
      <span className={step === "billing" ? "font-semibold text-foreground" : ""}>
        {t("stepBilling")}
      </span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl">{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
          <div className="pt-2">{stepIndicator}</div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Recap Proposal */}
          {step === "recap-proposal" && (
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="rounded-full bg-muted p-4">
                <BrainCircuit className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{t("recapProposalTitle")}</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t("recapProposalDescription")}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateRecap}
                  disabled={isGenerating || !canGenerateRecap}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {t("generateRecap")}
                </Button>
                <Button variant="outline" onClick={handleSkipRecap}>
                  {t("skipToBilling")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {!canGenerateRecap && recapEnabled && (
                <p className="text-xs text-muted-foreground">{t("recapRequiresNotes")}</p>
              )}
            </div>
          )}

          {/* Step 2: Recap Edit */}
          {step === "recap-edit" && recapForm && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">{t("recapSummary")}</label>
                <Textarea
                  value={recapForm.summary}
                  onChange={(e) => setRecapForm({ ...recapForm, summary: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              {/* Advice */}
              <EditableList
                label={t("recapAdvice")}
                items={recapForm.advice}
                onChange={(index, value) => updateListItem("advice", index, value)}
                onAdd={() => addListItem("advice")}
                onRemove={(index) => removeListItem("advice", index)}
              />

              {/* Exercises */}
              <EditableList
                label={t("recapExercises")}
                items={recapForm.exercises}
                onChange={(index, value) => updateListItem("exercises", index, value)}
                onAdd={() => addListItem("exercises")}
                onRemove={(index) => removeListItem("exercises", index)}
              />

              {/* Precautions */}
              <EditableList
                label={t("recapPrecautions")}
                items={recapForm.precautions}
                onChange={(index, value) => updateListItem("precautions", index, value)}
                onAdd={() => addListItem("precautions")}
                onRemove={(index) => removeListItem("precautions", index)}
              />

              {/* Follow-up */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">{t("recapFollowUp")}</label>
                <Textarea
                  value={recapForm.followUp}
                  onChange={(e) => setRecapForm({ ...recapForm, followUp: e.target.value })}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Billing */}
          {step === "billing" && (
            <ConsultationBillingForm
              draft={billingDraft}
              isLoading={isBillingDraftLoading}
              onConfirm={onConfirmBilling}
              isSubmitting={isBillingSubmitting}
              onCancel={() => handleOpenChange(false)}
            />
          )}
        </div>

        {/* Footer for recap-edit step */}
        {step === "recap-edit" && (
          <DialogFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={handleRegenerateRecap}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t("regenerateRecap")}
            </Button>
            <Button
              onClick={handleValidateRecap}
              disabled={isSavingRecap || !recapForm?.summary.trim()}
            >
              {isSavingRecap && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("validateRecap")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditableList({
  label,
  items,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string
  items: string[]
  onChange: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => onChange(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="text-xs"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {label}
      </Button>
    </div>
  )
}
