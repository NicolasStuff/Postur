"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FileText,
  Loader2,
  Search,
  WalletCards,
} from "lucide-react"

import {
  deleteInvoice,
  getBillingProfileStatus,
  getInvoiceDetails,
  getInvoices,
  updateDraftInvoice,
  updateInvoiceStatus,
} from "@/app/actions/billing"
import { BillingProfileGate } from "@/components/billing/BillingProfileGate"
import { InvoiceDraftDialog } from "@/components/billing/InvoiceDraftDialog"
import { InvoicePreview } from "@/components/billing/InvoicePreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type BillingFilter = "all" | "draft" | "sent" | "paid"

export default function BillingPage() {
  const t = useTranslations("dashboard.billing")
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<BillingFilter>("all")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [draftEditorOpen, setDraftEditorOpen] = useState(false)

  const { data: billingProfileStatus, isLoading: isBillingProfileLoading } = useQuery({
    queryKey: ["billingProfileStatus"],
    queryFn: () => getBillingProfileStatus(),
  })

  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
    enabled: Boolean(billingProfileStatus?.ready),
  })

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return (invoices ?? []).filter((invoice) => {
      const matchesFilter =
        filter === "all" ? true : invoice.status.toLowerCase() === filter

      if (!matchesFilter) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        invoice.number,
        invoice.patient.firstName,
        invoice.patient.lastName,
        invoice.serviceName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    })
  }, [filter, invoices, search])

  useEffect(() => {
    if (filteredInvoices.length === 0) {
      setSelectedInvoiceId(null)
      return
    }

    if (!selectedInvoiceId || !filteredInvoices.some((invoice) => invoice.id === selectedInvoiceId)) {
      setSelectedInvoiceId(filteredInvoices[0].id)
    }
  }, [filteredInvoices, selectedInvoiceId])

  const { data: selectedInvoice, isLoading: isPreviewLoading } = useQuery({
    queryKey: ["invoiceDetails", selectedInvoiceId],
    queryFn: () => getInvoiceDetails(selectedInvoiceId!),
    enabled: Boolean(selectedInvoiceId && billingProfileStatus?.ready),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "DRAFT" | "SENT" | "PAID" }) =>
      updateInvoiceStatus(id, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoiceDetails", variables.id] }),
      ])
      toast.success(t("toasts.statusUpdated"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.statusUpdateError"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: async (_, invoiceId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoiceDetails", invoiceId] }),
      ])
      toast.success(t("toasts.invoiceDeleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.invoiceDeleteError"))
    },
  })

  const updateDraftMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateDraftInvoice>[0]) => updateDraftInvoice(payload),
    onSuccess: async (updatedInvoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoiceDetails", updatedInvoice.id] }),
      ])
      setDraftEditorOpen(false)
      toast.success(t("toasts.invoiceUpdated"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.invoiceUpdateError"))
    },
  })

  if (isBillingProfileLoading || (billingProfileStatus?.ready && isInvoicesLoading)) {
    return (
      <div className="p-8">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (!billingProfileStatus?.ready) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <BillingProfileGate missingFields={billingProfileStatus?.missingFields ?? []} />
      </div>
    )
  }

  const totalAmount = invoices?.reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0
  const sentAmount =
    invoices?.filter((invoice) => invoice.status === "SENT").reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0
  const draftCount = invoices?.filter((invoice) => invoice.status === "DRAFT").length ?? 0

  const filters: Array<{ key: BillingFilter; label: string }> = [
    { key: "all", label: t("filters.all") },
    { key: "draft", label: t("filters.draft") },
    { key: "sent", label: t("filters.sent") },
    { key: "paid", label: t("filters.paid") },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            <WalletCards className="h-3.5 w-3.5" />
            {t("workspaceLabel")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full px-4 py-1.5">
          {t("results", { count: filteredInvoices.length })}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[24px] border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.totalRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalAmount.toFixed(2)}€</div>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.pendingPayment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{sentAmount.toFixed(2)}€</div>
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.drafts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{draftCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.95fr)]">
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={filter === item.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-muted-foreground">
                {t("table.noInvoices")}
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className={cn(
                    "w-full rounded-[24px] border px-4 py-4 text-left transition-all",
                    selectedInvoiceId === invoice.id
                      ? "border-slate-900 bg-slate-950 text-white shadow-lg"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-semibold">{invoice.number}</span>
                      </div>
                      <p className="text-sm">
                        {invoice.patient.firstName} {invoice.patient.lastName}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          selectedInvoiceId === invoice.id ? "text-slate-300" : "text-muted-foreground"
                        )}
                      >
                        {new Date(invoice.date).toLocaleDateString()}
                        {invoice.serviceName ? ` • ${invoice.serviceName}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{invoice.amount.toFixed(2)}€</p>
                      <p
                        className={cn(
                          "mt-2 text-xs font-medium uppercase tracking-[0.2em]",
                          selectedInvoiceId === invoice.id ? "text-slate-300" : "text-slate-500"
                        )}
                      >
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          {selectedInvoiceId && isPreviewLoading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <InvoicePreview
              invoice={selectedInvoice ?? null}
              onEdit={() => setDraftEditorOpen(true)}
              onSend={() =>
                selectedInvoice && updateStatusMutation.mutate({ id: selectedInvoice.id, status: "SENT" })
              }
              onMarkPaid={() =>
                selectedInvoice && updateStatusMutation.mutate({ id: selectedInvoice.id, status: "PAID" })
              }
              onDelete={() => selectedInvoice && deleteMutation.mutate(selectedInvoice.id)}
              isUpdating={updateStatusMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          )}
        </div>
      </div>

      <InvoiceDraftDialog
        invoice={selectedInvoice ?? null}
        open={draftEditorOpen}
        onOpenChange={setDraftEditorOpen}
        isSaving={updateDraftMutation.isPending}
        onSave={async (payload) => {
          if (!selectedInvoice) return
          await updateDraftMutation.mutateAsync({
            invoiceId: selectedInvoice.id,
            ...payload,
          })
        }}
      />
    </div>
  )
}
