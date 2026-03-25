"use client"

import { use, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import Link from "next/link"
import {
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Play,
  User,
} from "lucide-react"

import { getConsultation } from "@/app/actions/consultation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EditAppointmentDateTimeDialog } from "@/components/consultation/shared/EditAppointmentDateTimeDialog"
import { extractTextFromTipTap } from "@/lib/consultation-note"

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = use(params)
  const t = useTranslations("consultation.detail")
  const locale = useLocale()
  const dateLocale = locale === "fr" ? fr : enUS
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editDateTimeOpen, setEditDateTimeOpen] = useState(false)

  const { data: consultation, isLoading } = useQuery({
    queryKey: ["consultation", appointmentId],
    queryFn: () => getConsultation(appointmentId),
  })

  const backHref = useMemo(() => {
    const from = searchParams.get("from")
    const patientId = searchParams.get("patient")

    if (from === "calendar") {
      return "/dashboard/calendar"
    }

    if (from === "detail") {
      return `/dashboard/consultation/${appointmentId}/detail`
    }

    if (from === "consultations") {
      return patientId
        ? `/dashboard/consultations?patient=${patientId}`
        : "/dashboard/consultations"
    }

    if (from === "patient" && consultation?.patient.id) {
      return `/dashboard/consultations?patient=${consultation.patient.id}`
    }

    if (from === "patientDetail" && consultation?.patient.id) {
      return `/dashboard/patients/${consultation.patient.id}`
    }

    return "/dashboard/calendar"
  }, [appointmentId, consultation?.patient.id, searchParams])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t("loading")}
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t("notFound")}
      </div>
    )
  }

  const statusKey = consultation.status.toLowerCase()
  const isCompleted = consultation.status === "COMPLETED"
  const isCanceled =
    consultation.status === "CANCELED" || consultation.status === "NOSHOW"
  const noteText = consultation.note
    ? extractTextFromTipTap(consultation.note.content)
    : null

  const startButtonLabel = isCompleted
    ? t("viewConsultation")
    : consultation.note
      ? t("continueConsultation")
      : t("startConsultation")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {consultation.patient.firstName} {consultation.patient.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {consultation.service.name} &mdash;{" "}
              {format(new Date(consultation.start), "PPP", {
                locale: dateLocale,
              })}
            </p>
          </div>
        </div>
        <Button
          disabled={isCanceled}
          onClick={() =>
            router.push(`/dashboard/consultation/${appointmentId}?from=detail`)
          }
        >
          <Play className="mr-2 h-4 w-4" />
          {startButtonLabel}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column: appointment info + note preview */}
        <div className="space-y-6">
          {/* Appointment info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                {t("appointmentInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("dateAndTime")}
                  </p>
                  <p className="text-sm">
                    {format(new Date(consultation.start), "PPP", {
                      locale: dateLocale,
                    })}{" "}
                    {t("at", { defaultMessage: "" })}
                    {format(new Date(consultation.start), "HH:mm")} &ndash;{" "}
                    {format(new Date(consultation.end), "HH:mm")}
                  </p>
                </div>
                {!isCompleted && !isCanceled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditDateTimeOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    {t("editDateTime")}
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("duration")}
                </p>
                <p className="text-sm">
                  {t("durationMinutes", {
                    minutes: consultation.service.duration,
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("service")}
                </p>
                <p className="text-sm">{consultation.service.name}</p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("status")}
                </p>
                <Badge
                  variant={isCompleted ? "default" : "secondary"}
                  className={
                    isCompleted
                      ? "bg-emerald-600 text-white hover:bg-emerald-600"
                      : undefined
                  }
                >
                  {t(`statuses.${statusKey}`)}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("billingStatus")}
                </p>
                {consultation.invoice ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    {t("invoiceNumber", {
                      number: consultation.invoice.number,
                    })}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t("notBilled")}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Note preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                {t("notePreview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {noteText ? (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-6">
                  {noteText}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("noNote")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: patient info + history */}
        <div className="space-y-6">
          {/* Patient info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  {t("patientInfo")}
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/dashboard/patients/${consultation.patient.id}`}
                  >
                    {t("viewPatient")}
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">
                {consultation.patient.firstName}{" "}
                {consultation.patient.lastName}
              </p>
              {consultation.patient.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{consultation.patient.email}</span>
                </div>
              )}
              {consultation.patient.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{consultation.patient.phone}</span>
                </div>
              )}
              {consultation.patient.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{consultation.patient.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consultation history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                {t("consultationHistory")}
              </CardTitle>
              <CardDescription>
                {consultation.patient.appointments?.length ?? 0}{" "}
                {t("consultationHistory").toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consultation.patient.appointments &&
              consultation.patient.appointments.length > 0 ? (
                <div className="space-y-3">
                  {consultation.patient.appointments.map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/dashboard/consultation/${apt.id}/detail?from=detail`}
                      className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {format(
                            new Date(apt.start),
                            "dd MMM yyyy",
                            { locale: dateLocale }
                          )}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {apt.service?.name ?? t("service")}
                        </Badge>
                      </div>
                      {apt.note && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {extractTextFromTipTap(apt.note.content)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("noHistory")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Reminders / Notifications */}
          <ReminderSection
            notifications={consultation.notifications ?? []}
            t={t}
          />
        </div>
      </div>

      {/* Edit date/time dialog */}
      <EditAppointmentDateTimeDialog
        open={editDateTimeOpen}
        onOpenChange={setEditDateTimeOpen}
        appointmentId={appointmentId}
        currentStart={consultation.start}
      />
    </div>
  )
}

// --- Reminder section ---

const NOTIFICATION_KIND_ORDER = [
  "BOOKING_CONFIRMATION",
  "BOOKING_CANCELLATION",
  "REMINDER_J3",
  "REMINDER_J2",
  "REMINDER_J1",
  "REMINDER_H1",
] as const

type NotificationRow = {
  id: string
  kind: string
  channel: string
  provider: string
  status: string
  sentAt: string | Date | null
  deliveredAt: string | Date | null
  errorMessage: string | null
  createdAt: string | Date
}

function getStatusBadgeClass(status: string): string {
  if (status === "DELIVERED") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200"
  }
  if (status === "SENT" || status === "ENROUTE" || status === "DELIVERY_DELAYED") {
    return "bg-blue-100 text-blue-700 border-blue-200"
  }
  if (
    status === "FAILED" ||
    status === "BOUNCED" ||
    status === "UNDELIVERABLE" ||
    status === "UNDELIVERED" ||
    status === "COMPLAINED" ||
    status === "SUPPRESSED"
  ) {
    return "bg-red-100 text-red-700 border-red-200"
  }
  return "bg-slate-100 text-slate-600 border-slate-200"
}

function ReminderSection({
  notifications,
  t,
}: {
  notifications: NotificationRow[]
  t: ReturnType<typeof useTranslations>
}) {
  if (!notifications || notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {t("reminders.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {t("reminders.none")}
          </p>
        </CardContent>
      </Card>
    )
  }

  const notifMap = new Map<string, NotificationRow>()
  for (const n of notifications) {
    const key = `${n.kind}:${n.channel}`
    if (!notifMap.has(key)) {
      notifMap.set(key, n)
    }
  }

  const sent = notifications.filter(
    (n) =>
      n.status === "DELIVERED" ||
      n.status === "SENT" ||
      n.status === "ENROUTE" ||
      n.status === "DELIVERY_DELAYED"
  ).length
  const delivered = notifications.filter(
    (n) => n.status === "DELIVERED"
  ).length

  const kindsPresent = NOTIFICATION_KIND_ORDER.filter((kind) =>
    notifications.some((n) => n.kind === kind)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {t("reminders.title")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t("reminders.summary", {
              sent,
              total: notifications.length,
              delivered,
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {kindsPresent.map((kind) => {
          const kindKey = kind.toLowerCase().replace(/_/g, "")
          return (
            <div key={kind}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t(`reminders.kinds.${kindKey}`)}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["EMAIL", "SMS"] as const).map((channel) => {
                  const entry = notifMap.get(`${kind}:${channel}`)
                  return (
                    <div key={channel} className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t(`reminders.channels.${channel.toLowerCase()}`)}
                      </p>
                      {entry ? (
                        <Badge
                          variant="outline"
                          className={getStatusBadgeClass(entry.status)}
                        >
                          {t(
                            `reminders.statuses.${entry.status.toLowerCase()}`
                          )}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          {t("reminders.notSent")}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
