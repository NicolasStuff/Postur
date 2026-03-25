"use client"

import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PatientDetail } from "@/components/patients/detail/types"

const invoiceStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PAID: "default",
  SENT: "secondary",
  DRAFT: "outline",
  CANCELLED: "destructive",
}

export function PatientBillingTab({ patient }: { patient: PatientDetail }) {
  const t = useTranslations("patientDetail.billing")
  const tStatuses = useTranslations("dashboard.billing.statuses")
  const locale = useLocale()
  const dateLocale = locale === "fr" ? fr : enUS

  const totalBilled = patient.invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalPaid = patient.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0)
  const totalPending = patient.invoices
    .filter((inv) => inv.status !== "PAID" && inv.status !== "CANCELLED")
    .reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("totalBilled")}</p>
            <p className="text-2xl font-bold">{totalBilled.toFixed(2)} &euro;</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("totalPaid")}</p>
            <p className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} &euro;</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t("totalPending")}</p>
            <p className="text-2xl font-bold text-amber-600">{totalPending.toFixed(2)} &euro;</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("number")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("service")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground h-24"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              )}
              {patient.invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>
                    {format(new Date(invoice.date), "dd/MM/yyyy", {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell>{invoice.serviceName ?? "-"}</TableCell>
                  <TableCell>{invoice.amount.toFixed(2)} &euro;</TableCell>
                  <TableCell>
                    <Badge variant={invoiceStatusVariant[invoice.status] ?? "outline"}>
                      {tStatuses(invoice.status.toLowerCase())}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
