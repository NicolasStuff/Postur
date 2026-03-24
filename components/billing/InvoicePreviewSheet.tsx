"use client"

import Link from "next/link"
import { CheckCircle2, Download, FilePenLine, Loader2, Printer, Send, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"

import { getInvoiceDetails } from "@/app/actions/billing"
import { InvoiceDocument } from "@/components/billing/InvoiceDocument"
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
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
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {isLoading || !invoice ? (
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="space-y-1">
                  <SheetTitle className="text-xl">{invoice.number}</SheetTitle>
                  <SheetDescription>
                    {invoice.patient.firstName} {invoice.patient.lastName}
                  </SheetDescription>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </div>

              <div className="flex flex-wrap gap-2 pt-3">
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
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 bg-muted/30 p-4">
              <InvoiceDocument invoice={invoice} showStatus={false} />
            </ScrollArea>

            <div className="border-t px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                )}
                {t("actions.delete")}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
