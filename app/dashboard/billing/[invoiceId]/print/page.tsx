"use client"

import { use } from "react"
import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { PdfViewer } from "@/components/billing/PdfViewer"
import { Button } from "@/components/ui/button"

export default function InvoicePrintPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = use(params)
  const t = useTranslations("dashboard.billing")
  const pdfUrl = `/api/invoices/${invoiceId}/pdf`

  return (
    <div className="flex h-screen flex-col bg-slate-100 print:bg-white">
      <div className="flex items-center justify-between px-6 py-4 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("print.back")}
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          {t("preview.print")}
        </Button>
      </div>

      <PdfViewer url={pdfUrl} />
    </div>
  )
}
