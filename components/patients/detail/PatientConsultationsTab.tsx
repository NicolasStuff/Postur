"use client"

import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import Link from "next/link"

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

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  COMPLETED: "default",
  PLANNED: "secondary",
  CONFIRMED: "secondary",
  CANCELED: "destructive",
  NOSHOW: "destructive",
}

export function PatientConsultationsTab({ patient }: { patient: PatientDetail }) {
  const t = useTranslations("patientDetail.consultations")
  const locale = useLocale()
  const dateLocale = locale === "fr" ? fr : enUS

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("service")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("note")}</TableHead>
              <TableHead>{t("billing")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patient.appointments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground h-24"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
            {patient.appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/consultation/${appointment.id}?from=patientDetail&patient=${patient.id}`}
                    className="text-primary hover:underline"
                  >
                    {format(new Date(appointment.start), "dd/MM/yyyy", {
                      locale: dateLocale,
                    })}
                  </Link>
                </TableCell>
                <TableCell>{appointment.service.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[appointment.status] ?? "outline"}>
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {appointment.note ? (
                    <Badge variant="outline">{t("hasNote")}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {appointment.invoice ? (
                    <Badge variant="default">{appointment.invoice.number}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
