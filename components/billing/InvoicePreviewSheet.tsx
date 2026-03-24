"use client"

import Link from "next/link"
import { CheckCircle2, Download, FilePenLine, Loader2, Printer, Send, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { getInvoiceDetails } from "@/app/actions/billing"
import { PdfViewer } from "@/components/billing/PdfViewer"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

interface InvoicePreviewSheetProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onSend: () => void
  onMarkPaid: () => void
  onDelete: () => void
  isUpdating: boolean
  isDeleting: boolean
}

export function InvoicePreviewSheet({
  invoiceId,
  open,
  onOpenChange,
  onEdit,
  onSend,
  onMarkPaid,
  onDelete,
  isUpdating,
  isDeleting,
}: InvoicePreviewSheetProps) {
  const t = useTranslations("dashboard.billing")

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoiceDetails", invoiceId],
    queryFn: () => getInvoiceDetails(invoiceId!),
    enabled: Boolean(invoiceId && open),
  })

  const canEdit = invoice?.status === "DRAFT"
  const canSend = invoice?.status === "DRAFT"
  const canMarkPaid = invoice?.status === "SENT"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
        <SheetTitle className="sr-only">{t("sheet.title")}</SheetTitle>

        {isLoading || !invoice ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[500px] w-full" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                  <Download className="mr-2 h-3.5 w-3.5" />
                  {t("preview.downloadPdf")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/billing/${invoice.id}/print`} target="_blank">
                  <Printer className="mr-2 h-3.5 w-3.5" />
                  {t("preview.print")}
                </Link>
              </Button>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} disabled={isUpdating}>
                  <FilePenLine className="mr-2 h-3.5 w-3.5" />
                  {t("actions.editDraft")}
                </Button>
              )}
              {canSend && (
                <Button size="sm" onClick={onSend} disabled={isUpdating}>
                  <Send className="mr-2 h-3.5 w-3.5" />
                  {t("actions.send")}
                </Button>
              )}
              {canMarkPaid && (
                <Button size="sm" onClick={onMarkPaid} disabled={isUpdating}>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  {t("actions.markAsPaid")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="ml-auto text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                )}
                {t("actions.delete")}
              </Button>
            </div>

            <PdfViewer url={`/api/invoices/${invoice.id}/pdf`} />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
