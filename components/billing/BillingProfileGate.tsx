"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function BillingProfileGate({
  missingFields,
  compact = false,
}: {
  missingFields: string[]
  compact?: boolean
}) {
  const t = useTranslations("dashboard.billing")

  return (
    <Card className={compact ? "border-amber-200 bg-amber-50/80" : "border-amber-200 bg-amber-50/60"}>
      <CardHeader className={compact ? "pb-3" : "pb-4"}>
        <CardTitle className="flex items-center gap-3 text-amber-950">
          <span className="rounded-full bg-amber-100 p-2">
            {compact ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-5 w-5" />}
          </span>
          {t(compact ? "billingProfileGate.compactTitle" : "billingProfileGate.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-amber-900">{t("billingProfileGate.description")}</p>
        <div className="flex flex-wrap gap-2">
          {missingFields.map((field) => (
            <span
              key={field}
              className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-800"
            >
              {t(`billingProfileGate.fields.${field}`)}
            </span>
          ))}
        </div>
        <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white">
          <Link href="/dashboard/settings?tab=profile">
            {t("billingProfileGate.cta")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
