"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"

import { calculateInvoiceAmounts, formatDateInputValue } from "@/lib/billing"
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
    if (!invoice) return

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

    // VAT rate source of truth: prefer user profile default, fall back to invoice-level rate
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

  const update = (field: string, value: string | number) =>
    setFormState((prev) => ({ ...prev, [field]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("draftEditor.title")}</DialogTitle>
          <DialogDescription>{t("consultationBilling.patient")}</DialogDescription>
        </DialogHeader>

        {!invoice ? null : (
          <div className="space-y-6 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("consultationBilling.firstName")}</Label>
                <Input
                  value={formState.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("consultationBilling.lastName")}</Label>
                <Input
                  value={formState.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("consultationBilling.address")}</Label>
                <Input
                  value={formState.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("consultationBilling.serviceName")}</Label>
                <Input
                  value={formState.serviceName}
                  onChange={(e) => update("serviceName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("consultationBilling.date")}</Label>
                <Input
                  type="date"
                  value={formState.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("consultationBilling.amount")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.amount}
                  onChange={(e) => update("amount", Number.parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {amountPreview && (
              <div className="rounded-xl border bg-muted/50 px-4 py-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("subtotalHt")}</span>
                  <span>{amountPreview.subtotalAmount.toFixed(2)}&nbsp;€</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {amountPreview.vatRate
                      ? t("vatWithRate", { rate: amountPreview.vatRate.toFixed(2) })
                      : t("vat")}
                  </span>
                  <span>{amountPreview.vatAmount.toFixed(2)}&nbsp;€</span>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between font-semibold">
                  <span>{t("total")}</span>
                  <span>{amountPreview.amount.toFixed(2)}&nbsp;€</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
