"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"

import { calculateInvoiceAmounts, formatDateInputValue } from "@/lib/billing"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface EditableInvoiceDraft {
  id: string
  amount: number
  vatRate: number | null
  user: {
    isVatExempt: boolean
    defaultVatRate?: number | null
  }
  patient: {
    firstName: string
    lastName: string
    address?: string | null
  }
  serviceName?: string | null
  date: Date | string
}

export function InvoiceDraftDialog({
  invoice,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: {
  invoice: EditableInvoiceDraft | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: {
    serviceName: string
    amount: number
    date: string
    patientSnapshot: {
      firstName: string
      lastName: string
      address?: string | null
    }
  }) => Promise<void>
  isSaving: boolean
}) {
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
    if (!invoice) {
      return
    }

    setFormState({
      firstName: invoice.patient.firstName,
      lastName: invoice.patient.lastName,
      address: invoice.patient.address || "",
      serviceName: invoice.serviceName || "",
      amount: invoice.amount,
      date: formatDateInputValue(invoice.date),
    })
  }, [invoice])

  const amountPreview = useMemo(() => {
    if (!invoice) return null

    return calculateInvoiceAmounts(formState.amount, {
      isVatExempt: invoice.user.isVatExempt,
      vatRate: invoice.user.defaultVatRate ?? invoice.vatRate ?? null,
    })
  }, [formState.amount, invoice])

  const canSave =
    formState.firstName.trim().length > 0 &&
    formState.lastName.trim().length > 0 &&
    formState.serviceName.trim().length > 0 &&
    formState.amount > 0 &&
    formState.date.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("draftEditor.title")}</DialogTitle>
        </DialogHeader>

        {!invoice ? null : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-3xl border bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{t("consultationBilling.patient")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>{t("consultationBilling.firstName")}</Label>
                    <Input value={formState.firstName} onChange={(event) => setFormState({...formState, firstName: event.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("consultationBilling.lastName")}</Label>
                    <Input value={formState.lastName} onChange={(event) => setFormState({...formState, lastName: event.target.value})} />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>{t("consultationBilling.address")}</Label>
                    <Input value={formState.address} onChange={(event) => setFormState({...formState, address: event.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border bg-slate-50/70 p-5">
                <h3 className="text-sm font-semibold text-slate-900">{t("consultationBilling.session")}</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>{t("consultationBilling.serviceName")}</Label>
                    <Input value={formState.serviceName} onChange={(event) => setFormState({...formState, serviceName: event.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("consultationBilling.date")}</Label>
                    <Input type="date" value={formState.date} onChange={(event) => setFormState({...formState, date: event.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("consultationBilling.amount")}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formState.amount}
                      onChange={(event) => setFormState({...formState, amount: Number.parseFloat(event.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {amountPreview && (
              <div className="rounded-3xl border bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>{t("subtotalHt")}</span>
                  <span>{amountPreview.subtotalAmount.toFixed(2)}€</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                  <span>
                    {amountPreview.vatRate
                      ? t("vatWithRate", { rate: amountPreview.vatRate.toFixed(2) })
                      : t("vat")}
                  </span>
                  <span>{amountPreview.vatAmount.toFixed(2)}€</span>
                </div>
                <Separator className="my-4 bg-white/10" />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>{t("total")}</span>
                  <span>{amountPreview.amount.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("consultationBilling.cancel")}
              </Button>
              <Button
                onClick={() =>
                  onSave({
                    serviceName: formState.serviceName,
                    amount: formState.amount,
                    date: formState.date,
                    patientSnapshot: {
                      firstName: formState.firstName,
                      lastName: formState.lastName,
                      address: formState.address || null,
                    },
                  })
                }
                disabled={!canSave || isSaving}
              >
                {isSaving ? t("draftEditor.saving") : t("draftEditor.save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
