"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Loader2, ReceiptText, UserRound } from "lucide-react"
import { useTranslations } from "next-intl"

import { calculateInvoiceAmounts } from "@/lib/billing"
import { BillingProfileGate } from "@/components/billing/BillingProfileGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export interface ConsultationBillingDraft {
  ready: boolean
  missingFields: string[]
  isAlreadyBilled: boolean
  isBillable: boolean
  invoiceNumber: string | null
  issuerProfile: {
    name: string | null
    practitionerType: string | null
    companyName: string | null
    companyAddress: string | null
    siret: string | null
    isVatExempt: boolean
    defaultVatRate: number | null
  }
  patientSnapshot: {
    firstName: string
    lastName: string
    address?: string | null
  }
  sessionDraft: {
    serviceName: string
    amount: number
    date: string
  }
}

export interface BillingPayload {
  patientSnapshot: {
    firstName: string
    lastName: string
    address?: string | null
  }
  serviceName: string
  amount: number
  date: string
}

interface ConsultationBillingFormProps {
  draft: ConsultationBillingDraft | null
  isLoading: boolean
  onConfirm: (payload: BillingPayload) => Promise<void>
  isSubmitting: boolean
  onCancel?: () => void
}

export function ConsultationBillingForm({
  draft,
  isLoading,
  onConfirm,
  isSubmitting,
  onCancel,
}: ConsultationBillingFormProps) {
  const t = useTranslations("dashboard.billing")
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    address: "",
    serviceName: "",
    amount: 0,
    date: "",
  })

  useEffect(() => {
    if (!draft) {
      return
    }

    setFormState({
      firstName: draft.patientSnapshot.firstName,
      lastName: draft.patientSnapshot.lastName,
      address: draft.patientSnapshot.address || "",
      serviceName: draft.sessionDraft.serviceName,
      amount: draft.sessionDraft.amount,
      date: draft.sessionDraft.date,
    })
  }, [draft])

  const amountPreview = useMemo(() => {
    if (!draft) return null

    return calculateInvoiceAmounts(formState.amount, {
      isVatExempt: draft.issuerProfile.isVatExempt,
      vatRate: draft.issuerProfile.defaultVatRate,
    })
  }, [draft, formState.amount])

  const canConfirm =
    Boolean(draft?.ready) &&
    Boolean(draft?.isBillable) &&
    formState.firstName.trim().length > 0 &&
    formState.lastName.trim().length > 0 &&
    formState.serviceName.trim().length > 0 &&
    formState.amount > 0 &&
    formState.date.length > 0

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!draft) {
    return null
  }

  if (!draft.ready) {
    return <BillingProfileGate missingFields={draft.missingFields} compact />
  }

  if (!draft.isBillable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h3 className="text-lg font-semibold">{t("consultationBilling.notBillableTitle")}</h3>
        <p className="mt-2 text-sm text-amber-900">{t("consultationBilling.notBillableDescription")}</p>
        {draft.invoiceNumber && (
          <p className="mt-3 text-sm font-medium">{t("consultationBilling.alreadyBilled", { number: draft.invoiceNumber })}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-muted/50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
          {t("consultationBilling.issuer")}
        </div>
        <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            {draft.issuerProfile.companyName || draft.issuerProfile.name}
          </p>
          {draft.issuerProfile.name && draft.issuerProfile.companyName && (
            <p>{draft.issuerProfile.name}</p>
          )}
          {draft.issuerProfile.companyAddress && <p>{draft.issuerProfile.companyAddress}</p>}
          {draft.issuerProfile.siret && <p>{t("siret")}: {draft.issuerProfile.siret}</p>}
          <p>
            {draft.issuerProfile.isVatExempt
              ? t("consultationBilling.vatExempt")
              : t("consultationBilling.vatRate", { rate: draft.issuerProfile.defaultVatRate?.toFixed(2) || "0.00" })}
          </p>
        </div>
      </section>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          {t("consultationBilling.patient")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("consultationBilling.firstName")}</Label>
            <Input value={formState.firstName} onChange={(event) => setFormState({...formState, firstName: event.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>{t("consultationBilling.lastName")}</Label>
            <Input value={formState.lastName} onChange={(event) => setFormState({...formState, lastName: event.target.value})} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("consultationBilling.address")}</Label>
            <Input value={formState.address} onChange={(event) => setFormState({...formState, address: event.target.value})} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {t("consultationBilling.session")}
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>{t("consultationBilling.serviceName")}</Label>
            <Input value={formState.serviceName} onChange={(event) => setFormState({...formState, serviceName: event.target.value})} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("consultationBilling.date")}</Label>
              <Input type="date" value={formState.date} onChange={(event) => setFormState({...formState, date: event.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t("consultationBilling.amount")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    amount: Number.parseFloat(event.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {amountPreview && (
        <section className="rounded-xl border bg-muted/50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("consultationBilling.summary")}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("subtotalHt")}</span>
              <span>{amountPreview.subtotalAmount.toFixed(2)}&nbsp;€</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>
                {amountPreview.vatRate
                  ? t("vatWithRate", { rate: amountPreview.vatRate.toFixed(2) })
                  : t("vat")}
              </span>
              <span>{amountPreview.vatAmount.toFixed(2)}&nbsp;€</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>{t("total")}</span>
              <span>{amountPreview.amount.toFixed(2)}&nbsp;€</span>
            </div>
          </div>
        </section>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {t("consultationBilling.cancel")}
          </Button>
        )}
        <Button
          onClick={() =>
            onConfirm({
              patientSnapshot: {
                firstName: formState.firstName,
                lastName: formState.lastName,
                address: formState.address || null,
              },
              serviceName: formState.serviceName,
              amount: formState.amount,
              date: formState.date,
            })
          }
          disabled={!canConfirm || isSubmitting}
        >
          {isSubmitting ? t("consultationBilling.confirming") : t("consultationBilling.confirm")}
        </Button>
      </div>
    </div>
  )
}
