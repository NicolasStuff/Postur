"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Ban,
  CheckCircle2,
  Download,
  FilePenLine,
  Eye,
  Mail,
  MoreHorizontal,
  Printer,
  Send,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface InvoiceRowActionsProps {
  invoiceId: string
  status: string
  onView: () => void
  onEdit: () => void
  onSend: () => void
  onResend: () => void
  onMarkPaid: () => void
  onDelete: () => void
  onCancel: () => void
}

export function InvoiceRowActions({
  invoiceId,
  status,
  onView,
  onEdit,
  onSend,
  onResend,
  onMarkPaid,
  onDelete,
  onCancel,
}: InvoiceRowActionsProps) {
  const t = useTranslations("dashboard.billing")
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  const canEdit = status === "DRAFT"
  const canSend = status === "DRAFT"
  const canResend = status === "SENT"
  const canMarkPaid = status === "SENT"
  const canDelete = status === "DRAFT"
  const canCancel = status === "SENT" || status === "PAID"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t("actions.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            {t("actions.view")}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/api/invoices/${invoiceId}/pdf`} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              {t("actions.downloadPdf")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/billing/${invoiceId}/print`} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              {t("actions.print")}
            </Link>
          </DropdownMenuItem>
          {(canEdit || canSend || canResend || canMarkPaid) && (
            <>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  {t("actions.editDraft")}
                </DropdownMenuItem>
              )}
              {canSend && (
                <DropdownMenuItem onClick={onSend}>
                  <Send className="mr-2 h-4 w-4" />
                  {t("actions.send")}
                </DropdownMenuItem>
              )}
              {canResend && (
                <DropdownMenuItem onClick={onResend}>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("sendDialog.resend")}
                </DropdownMenuItem>
              )}
              {canMarkPaid && (
                <DropdownMenuItem onClick={onMarkPaid}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t("actions.markAsPaid")}
                </DropdownMenuItem>
              )}
            </>
          )}
          {(canDelete || canCancel) && (
            <>
              <DropdownMenuSeparator />
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem
                  onClick={() => setConfirmCancelOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {t("actions.cancelInvoice")}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
