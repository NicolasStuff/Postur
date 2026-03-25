"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  FileText,
  Loader2,
  Search,
} from "lucide-react"

import {
  cancelInvoice,
  deleteInvoice,
  getBillingProfileStatus,
  getInvoiceDetails,
  getInvoices,
  sendInvoiceByEmail,
  updateDraftInvoice,
  updateInvoiceStatus,
} from "@/app/actions/billing"
import { BillingProfileGate } from "@/components/billing/BillingProfileGate"
import { InvoiceDraftDialog } from "@/components/billing/InvoiceDraftDialog"
import { InvoicePreviewSheet } from "@/components/billing/InvoicePreviewSheet"
import { SendInvoiceDialog } from "@/components/billing/SendInvoiceDialog"
import { InvoiceRowActions } from "@/components/billing/InvoiceRowActions"
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

type BillingFilter = "all" | "draft" | "sent" | "paid"

export default function BillingPage() {
  const t = useTranslations("dashboard.billing")
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<BillingFilter>("all")
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null)
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null)
  const [sendInvoice, setSendInvoice] = useState<{
    id: string
    number: string
    patientEmail: string | null
    mode: "send" | "resend"
  } | null>(null)

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

  const { data: editInvoice } = useQuery({
    queryKey: ["invoiceDetails", editInvoiceId],
    queryFn: () => getInvoiceDetails(editInvoiceId!),
    enabled: Boolean(editInvoiceId && billingProfileStatus?.ready),
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
      setPreviewInvoiceId(null)
      toast.success(t("toasts.invoiceDeleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.invoiceDeleteError"))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelInvoice,
    onSuccess: async (updatedInvoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoiceDetails", updatedInvoice.id] }),
      ])
      toast.success(t("toasts.invoiceCancelled"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.invoiceCancelError"))
    },
  })

  const updateDraftMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateDraftInvoice>[0]) => updateDraftInvoice(payload),
    onSuccess: async (updatedInvoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoiceDetails", updatedInvoice.id] }),
      ])
      setEditInvoiceId(null)
      toast.success(t("toasts.invoiceUpdated"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.invoiceUpdateError"))
    },
  })

  const sendEmailMutation = useMutation({
    mutationFn: async ({
      invoiceId,
      email,
      markAsSent,
    }: {
      invoiceId: string
      email: string
      markAsSent: boolean
    }) => {
      if (markAsSent) {
        await updateInvoiceStatus(invoiceId, "SENT")
      }
      await sendInvoiceByEmail(invoiceId, email)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] })
      setSendInvoice(null)
      toast.success(
        sendInvoice?.mode === "resend"
          ? t("toasts.invoiceResent")
          : t("toasts.invoiceSent")
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || t("toasts.emailSendError"))
    },
  })

  if (isBillingProfileLoading || (billingProfileStatus?.ready && isInvoicesLoading)) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!billingProfileStatus?.ready) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <BillingProfileGate missingFields={billingProfileStatus?.missingFields ?? []} />
      </div>
    )
  }

  const totalAmount = Number(
    (invoices
      ?.filter((invoice) => invoice.status === "SENT" || invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0
    ).toFixed(2)
  )
  const sentAmount = Number(
    (invoices
      ?.filter((invoice) => invoice.status === "SENT")
      .reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0
    ).toFixed(2)
  )
  const draftCount = invoices?.filter((invoice) => invoice.status === "DRAFT").length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("stats.totalRevenue")}</p>
          <p className="mt-1 text-lg font-semibold">{totalAmount.toFixed(2)}&nbsp;€</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("stats.pendingPayment")}</p>
          <p className="mt-1 text-lg font-semibold text-amber-600">{sentAmount.toFixed(2)}&nbsp;€</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{t("stats.drafts")}</p>
          <p className="mt-1 text-lg font-semibold">{draftCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as BillingFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
              <TabsTrigger value="draft">{t("filters.draft")}</TabsTrigger>
              <TabsTrigger value="sent">{t("filters.sent")}</TabsTrigger>
              <TabsTrigger value="paid">{t("filters.paid")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Badge variant="secondary">{t("results", { count: filteredInvoices.length })}</Badge>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-medium">{t("emptyState.title")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyState.description")}</p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.number")}</TableHead>
                <TableHead>{t("table.patient")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("table.date")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("table.service")}</TableHead>
                <TableHead className="text-right">{t("table.amount")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    {invoice.patient.firstName} {invoice.patient.lastName}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Date(invoice.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {invoice.serviceName || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {invoice.amount.toFixed(2)}&nbsp;€
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <InvoiceRowActions
                      invoiceId={invoice.id}
                      status={invoice.status}
                      onView={() => setPreviewInvoiceId(invoice.id)}
                      onEdit={() => setEditInvoiceId(invoice.id)}
                      onSend={() =>
                        setSendInvoice({
                          id: invoice.id,
                          number: invoice.number,
                          patientEmail: invoice.patient.email ?? null,
                          mode: "send",
                        })
                      }
                      onResend={() =>
                        setSendInvoice({
                          id: invoice.id,
                          number: invoice.number,
                          patientEmail: invoice.patient.email ?? null,
                          mode: "resend",
                        })
                      }
                      onMarkPaid={() =>
                        updateStatusMutation.mutate({ id: invoice.id, status: "PAID" })
                      }
                      onDelete={() => deleteMutation.mutate(invoice.id)}
                      onCancel={() => cancelMutation.mutate(invoice.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoicePreviewSheet
        invoiceId={previewInvoiceId}
        open={Boolean(previewInvoiceId)}
        onOpenChange={(open) => {
          if (!open) setPreviewInvoiceId(null)
        }}
        onEdit={() => {
          setEditInvoiceId(previewInvoiceId)
          setPreviewInvoiceId(null)
        }}
        onSend={() => {
          const inv = invoices?.find((i) => i.id === previewInvoiceId)
          if (inv) {
            setSendInvoice({
              id: inv.id,
              number: inv.number,
              patientEmail: inv.patient.email ?? null,
              mode: "send",
            })
          }
        }}
        onResend={() => {
          const inv = invoices?.find((i) => i.id === previewInvoiceId)
          if (inv) {
            setSendInvoice({
              id: inv.id,
              number: inv.number,
              patientEmail: inv.patient.email ?? null,
              mode: "resend",
            })
          }
        }}
        onMarkPaid={() =>
          previewInvoiceId && updateStatusMutation.mutate({ id: previewInvoiceId, status: "PAID" })
        }
        onDelete={() => previewInvoiceId && deleteMutation.mutate(previewInvoiceId)}
        onCancel={() => previewInvoiceId && cancelMutation.mutate(previewInvoiceId)}
        isUpdating={updateStatusMutation.isPending}
        isDeleting={deleteMutation.isPending}
        isCancelling={cancelMutation.isPending}
      />

      <InvoiceDraftDialog
        invoice={editInvoice ?? null}
        open={Boolean(editInvoiceId)}
        onOpenChange={(open) => {
          if (!open) setEditInvoiceId(null)
        }}
        isSaving={updateDraftMutation.isPending}
        onSave={async (payload) => {
          if (!editInvoice) return
          await updateDraftMutation.mutateAsync({
            invoiceId: editInvoice.id,
            ...payload,
          })
        }}
      />

      {sendInvoice && (
        <SendInvoiceDialog
          open
          onOpenChange={(open) => {
            if (!open) setSendInvoice(null)
          }}
          invoiceNumber={sendInvoice.number}
          patientEmail={sendInvoice.patientEmail}
          mode={sendInvoice.mode}
          isLoading={sendEmailMutation.isPending || updateStatusMutation.isPending}
          onConfirm={async ({ sendEmail, email }) => {
            if (sendEmail) {
              await sendEmailMutation.mutateAsync({
                invoiceId: sendInvoice.id,
                email,
                markAsSent: sendInvoice.mode === "send",
              })
            } else {
              updateStatusMutation.mutate(
                { id: sendInvoice.id, status: "SENT" },
                {
                  onSuccess: () => {
                    setSendInvoice(null)
                    toast.success(t("toasts.invoiceMarkedSent"))
                  },
                }
              )
            }
          }}
        />
      )}
    </div>
  )
}
