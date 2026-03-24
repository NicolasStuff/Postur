"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"

export interface InvoiceDocumentData {
  id: string
  number: string
  date: Date | string
  amount: number
  subtotalAmount: number
  vatAmount: number
  vatRate: number | null
  status: string
  serviceName?: string | null
  patient: {
    firstName: string
    lastName: string
    address?: string | null
  }
  user: {
    name: string | null
    email: string
    practitionerType: string | null
    siret: string | null
    companyName: string | null
    companyAddress: string | null
    isVatExempt: boolean
    defaultVatRate?: number | null
  }
}

function getPractitionerTitle(type: string | null, t: ReturnType<typeof useTranslations>) {
  switch (type) {
    case "OSTEOPATH":
      return t("practitionerTypes.osteopath")
    default:
      return t("practitionerTypes.default")
  }
}

function formatDate(value: Date | string, locale: string) {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export function InvoiceDocument({
  invoice,
  className,
  showStatus = true,
}: {
  invoice: InvoiceDocumentData
  className?: string
  showStatus?: boolean
}) {
  const t = useTranslations("billing")
  const resolvedLocale = useLocale()
  const formattedDate = formatDate(invoice.date, resolvedLocale)
  const companyLabel = invoice.user.companyName || invoice.user.name || t("practitionerTypes.default")
  const practitionerLabel = invoice.user.name || t("practitionerTypes.default")

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md",
        className
      )}
    >
      <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_38%),linear-gradient(135deg,_#f8fafc_0%,_#ffffff_55%,_#eef6ff_100%)] px-8 py-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              {t("documentLabel")}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {getPractitionerTitle(invoice.user.practitionerType, t)}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                {companyLabel}
              </h2>
              {invoice.user.companyName && invoice.user.name && (
                <p className="text-sm text-slate-600">{practitionerLabel}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/85 p-5 text-right shadow-sm backdrop-blur">
            {showStatus && (
              <Badge variant="secondary" className="mb-4 rounded-full bg-slate-950 text-white">
                {invoice.status}
              </Badge>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t("invoiceNumber")}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {invoice.number}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {t("date")}: <span className="font-medium text-slate-700">{formattedDate}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8 px-8 py-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {t("issuer")}
              </p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{practitionerLabel}</p>
                {invoice.user.companyAddress && <p>{invoice.user.companyAddress}</p>}
                {invoice.user.email && <p>{invoice.user.email}</p>}
                {invoice.user.siret && (
                  <p>
                    {t("siret")}: {invoice.user.siret}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {t("patient")}
              </p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {invoice.patient.firstName} {invoice.patient.lastName}
                </p>
                {invoice.patient.address && <p>{invoice.patient.address}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_160px] border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span>{t("description")}</span>
              <span className="text-center">{t("quantity")}</span>
              <span className="text-right">{t("amountTtc")}</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_120px_160px] items-start px-5 py-5 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-slate-950">
                  {invoice.serviceName || t("services.default")}
                </p>
                <p className="text-slate-500">{getPractitionerTitle(invoice.user.practitionerType, t)}</p>
              </div>
              <span className="text-center text-slate-600">1</span>
              <span className="text-right font-medium text-slate-950">
                {formatCurrency(invoice.amount, resolvedLocale)}
              </span>
            </div>
          </div>
        </section>

        <aside className="border-t border-slate-200 bg-slate-50/70 px-8 py-8 lg:border-l lg:border-t-0">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t("totals")}
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{t("subtotalHt")}</span>
                <span>{formatCurrency(invoice.subtotalAmount, resolvedLocale)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>
                  {invoice.vatRate ? t("vatWithRate", { rate: invoice.vatRate.toFixed(2) }) : t("vat")}
                </span>
                <span>{formatCurrency(invoice.vatAmount, resolvedLocale)}</span>
              </div>
              <Separator />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {t("total")}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {formatCurrency(invoice.amount, resolvedLocale)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{t("legalNoticeTitle")}</p>
            <p className="mt-2">
              {invoice.user.isVatExempt ? t("vatNoticeExempt") : t("vatNoticeApplied")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
