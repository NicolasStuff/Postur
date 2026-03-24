"use client"

import Link from "next/link"
import {
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

interface InvoiceRowActionsProps {
  invoiceId: string
  status: string
  onView: () => void
  onEdit: () => void
  onSend: () => void
  onResend: () => void
  onMarkPaid: () => void
  onDelete: () => void
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
}: InvoiceRowActionsProps) {
  const t = useTranslations("dashboard.billing")

  const canEdit = status === "DRAFT"
  const canSend = status === "DRAFT"
  const canResend = status === "SENT"
  const canMarkPaid = status === "SENT"

  return (
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
