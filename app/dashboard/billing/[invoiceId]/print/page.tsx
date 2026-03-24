"use client"

import { use, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Printer } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { getInvoiceDetails } from "@/app/actions/billing"
import { InvoiceDocument } from "@/components/billing/InvoiceDocument"
import { Button } from "@/components/ui/button"

export default function InvoicePrintPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = use(params)
  const t = useTranslations("dashboard.billing")
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoicePrint", invoiceId],
    queryFn: () => getInvoiceDetails(invoiceId),
  })

  useEffect(() => {
    if (!invoice) {
      return
    }

    const timer = window.setTimeout(() => {
      window.print()
    }, 200)

    return () => window.clearTimeout(timer)
  }, [invoice])

  if (isLoading || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto mb-6 flex max-w-[900px] items-center justify-between print:hidden">
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

      <InvoiceDocument invoice={invoice} showStatus={false} className="print:shadow-none print:border-0 print:rounded-none" />
    </div>
  )
}
