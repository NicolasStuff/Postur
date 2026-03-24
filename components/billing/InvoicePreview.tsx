"use client"

import Link from "next/link"
import { CheckCircle2, Download, Eye, FilePenLine, Printer, Send, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { InvoiceDocument, type InvoiceDocumentData } from "@/components/billing/InvoiceDocument"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function InvoicePreview({
  invoice,
  onEdit,
  onSend,
  onMarkPaid,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  invoice: InvoiceDocumentData | null
  onEdit: () => void
  onSend: () => void
  onMarkPaid: () => void
  onDelete: () => void
  isUpdating: boolean
  isDeleting: boolean
}) {
  const t = useTranslations("dashboard.billing")

  if (!invoice) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Eye className="h-5 w-5 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-900">{t("preview.emptyTitle")}</p>
          <p className="text-sm text-slate-500">{t("preview.emptyDescription")}</p>
        </div>
      </div>
    )
  }

  const canEdit = invoice.status === "DRAFT"
  const canSend = invoice.status === "DRAFT"
  const canMarkPaid = invoice.status === "SENT"
  const downloadHref = `/api/invoices/${invoice.id}/pdf`
  const printHref = `/dashboard/billing/${invoice.id}/print`

  return (
    <div className="flex h-full min-h-[720px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_50%,_#ecfeff_100%)] px-6 py-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t("preview.label")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {invoice.number}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {invoice.patient.firstName} {invoice.patient.lastName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={downloadHref} target="_blank">
                <Download className="mr-2 h-4 w-4" />
                {t("preview.downloadPdf")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={printHref} target="_blank">
                <Printer className="mr-2 h-4 w-4" />
                {t("preview.print")}
              </Link>
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={onEdit} disabled={isUpdating}>
                <FilePenLine className="mr-2 h-4 w-4" />
                {t("preview.editDraft")}
              </Button>
            )}
            {canSend && (
              <Button onClick={onSend} disabled={isUpdating}>
                <Send className="mr-2 h-4 w-4" />
                {t("actions.send")}
              </Button>
            )}
            {canMarkPaid && (
              <Button onClick={onMarkPaid} disabled={isUpdating}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t("actions.markAsPaid")}
              </Button>
            )}
            <Button variant="ghost" onClick={onDelete} disabled={isDeleting} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("actions.delete")}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-slate-100/80 p-4">
        <InvoiceDocument invoice={invoice} showStatus={false} />
      </ScrollArea>
    </div>
  )
}
