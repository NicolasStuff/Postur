"use client"

import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { StickyNote, Activity, Calendar, Receipt } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PatientDetail } from "@/components/patients/detail/types"

export function PatientOverviewTab({ patient }: { patient: PatientDetail }) {
  const t = useTranslations("patientDetail.overview")
  const locale = useLocale()
  const dateLocale = locale === "fr" ? fr : enUS

  const totalConsultations = patient.appointments.length
  const lastVisit = patient.appointments[0]
    ? format(new Date(patient.appointments[0].start), "dd MMMM yyyy", {
        locale: dateLocale,
      })
    : null
  const totalBilled = patient.invoices.reduce((sum, inv) => sum + inv.amount, 0)

  const medicalHistory =
    patient.medicalHistory && typeof patient.medicalHistory === "object"
      ? patient.medicalHistory
      : null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Stats */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-blue-50 p-2">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalConsultations}</p>
            <p className="text-xs text-muted-foreground">{t("totalConsultations")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-green-50 p-2">
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">{lastVisit ?? "-"}</p>
            <p className="text-xs text-muted-foreground">{t("lastVisit")}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-amber-50 p-2">
            <Receipt className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalBilled.toFixed(2)} &euro;</p>
            <p className="text-xs text-muted-foreground">{t("totalBilled")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="md:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <StickyNote className="h-4 w-4" />
            {t("notes")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patient.notes ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {patient.notes}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("noNotes")}</p>
          )}
        </CardContent>
      </Card>

      {/* Medical History */}
      {medicalHistory && (
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              {t("medicalHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(medicalHistory, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
