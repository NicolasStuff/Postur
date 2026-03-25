"use client"

import { useState } from "react"
import Link from "next/link"
import { Ban, CheckCircle2, Download, FilePenLine, Loader2, Mail, Printer, Send, Trash2 } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface InvoicePreviewSheetProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onSend: () => void
  onResend: () => void
  onMarkPaid: () => void
  onDelete: () => void
  onCancel: () => void
  isUpdating: boolean
  isDeleting: boolean
  isCancelling: boolean
}

export function InvoicePreviewSheet({
  invoiceId,
  open,
  onOpenChange,
  onEdit,
  onSend,
  onResend,
  onMarkPaid,
  onDelete,
  onCancel,
  isUpdating,
  isDeleting,
  isCancelling,
}: InvoicePreviewSheetProps) {
  const t = useTranslations("dashboard.billing")
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoiceDetails", invoiceId],
    queryFn: () => getInvoiceDetails(invoiceId!),
    enabled: Boolean(invoiceId && open),
  })

  const canEdit = invoice?.status === "DRAFT"
  const canSend = invoice?.status === "DRAFT"
  const canResend = invoice?.status === "SENT"
  const canMarkPaid = invoice?.status === "SENT"
  const canDelete = invoice?.status === "DRAFT"
  const canCancel = invoice?.status === "SENT" || invoice?.status === "PAID"

  return (
    <>
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
                {canResend && (
                  <Button variant="outline" size="sm" onClick={onResend}>
                    <Mail className="mr-2 h-3.5 w-3.5" />
                    {t("sendDialog.resend")}
                  </Button>
                )}
                {canMarkPaid && (
                  <Button size="sm" onClick={onMarkPaid} disabled={isUpdating}>
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    {t("actions.markAsPaid")}
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteOpen(true)}
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
                )}
                {canCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={isCancelling}
                    className="ml-auto text-destructive hover:text-destructive"
                  >
                    {isCancelling ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Ban className="mr-2 h-3.5 w-3.5" />
                    )}
                    {t("actions.cancelInvoice")}
                  </Button>
                )}
              </div>

              <PdfViewer url={`/api/invoices/${invoice.id}/pdf`} />
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("cancelDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
