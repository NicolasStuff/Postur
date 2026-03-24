"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { format, isSameDay } from "date-fns"
import { enUS, fr } from "date-fns/locale"
import { Eye, Loader2, Search } from "lucide-react"

import { getConsultations } from "@/app/actions/consultation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type QuickFilter = "all" | "today" | "completed" | "unbilled" | "notes_missing"
type SortMode = "newest" | "oldest" | "patient"

export default function ConsultationsPage() {
  const t = useTranslations("dashboard.consultationsPage")
  const locale = useLocale()
  const dateLocale = locale === "fr" ? fr : enUS
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all")
  const [sortMode, setSortMode] = useState<SortMode>("newest")
  const patientFilter = searchParams.get("patient")

  const { data: consultations, isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: () => getConsultations(),
  })

  const selectedPatient = useMemo(() => {
    if (!patientFilter || !consultations) return null
    return consultations.find((consultation) => consultation.patient.id === patientFilter)?.patient ?? null
  }, [consultations, patientFilter])

  const patientFilterLabel = selectedPatient
    ? t("patientFilter", {
        patient: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      })
    : t("patientFilterActive")

  const filteredConsultations = useMemo(() => {
    const now = new Date()
    const normalizedSearch = search.trim().toLowerCase()
    const items = [...(consultations ?? [])]
      .filter((consultation) => {
        if (patientFilter && consultation.patient.id !== patientFilter) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const dateText = format(new Date(consultation.start), "dd/MM/yyyy HH:mm", {
          locale: dateLocale,
        }).toLowerCase()

        const haystack = [
          consultation.patient.firstName,
          consultation.patient.lastName,
          consultation.patient.email ?? "",
          consultation.patient.phone ?? "",
          consultation.service?.name ?? "",
          dateText,
        ]
          .join(" ")
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .filter((consultation) => {
        switch (quickFilter) {
          case "today":
            return isSameDay(new Date(consultation.start), now)
          case "completed":
            return consultation.status === "COMPLETED"
          case "unbilled":
            return consultation.status === "COMPLETED" && !consultation.invoice
          case "notes_missing":
            return !consultation.note
          default:
            return true
        }
      })

    items.sort((left, right) => {
      if (sortMode === "patient") {
        return `${left.patient.lastName} ${left.patient.firstName}`.localeCompare(
          `${right.patient.lastName} ${right.patient.firstName}`,
          locale
        )
      }

      const direction = sortMode === "oldest" ? 1 : -1
      return (new Date(left.start).getTime() - new Date(right.start).getTime()) * direction
    })

    return items
  }, [consultations, dateLocale, locale, patientFilter, quickFilter, search, sortMode])

  const clearPatientFilter = () => {
    router.replace(pathname)
  }

  const statusLabel = (status: string) => {
    const key = status.toLowerCase()
    return t(`statuses.${key}`)
  }

  const quickFilters: Array<{ key: QuickFilter; label: string }> = [
    { key: "all", label: t("filters.all") },
    { key: "today", label: t("filters.today") },
    { key: "completed", label: t("filters.completed") },
    { key: "unbilled", label: t("filters.unbilled") },
    { key: "notes_missing", label: t("filters.notesMissing") },
  ]

  if (isLoading) {
    return (
      <div className="p-8">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {t("results", { count: filteredConsultations.length })}
          </Badge>
          {patientFilter && (
            <Button variant="outline" size="sm" onClick={clearPatientFilter}>
              {patientFilterLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={sortMode === "newest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortMode("newest")}
            >
              {t("sorting.newest")}
            </Button>
            <Button
              type="button"
              variant={sortMode === "oldest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortMode("oldest")}
            >
              {t("sorting.oldest")}
            </Button>
            <Button
              type="button"
              variant={sortMode === "patient" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortMode("patient")}
            >
              {t("sorting.patient")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              size="sm"
              variant={quickFilter === filter.key ? "default" : "outline"}
              onClick={() => setQuickFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.patient")}</TableHead>
              <TableHead>{t("table.service")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.note")}</TableHead>
              <TableHead>{t("table.billing")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConsultations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t("table.noConsultations")}
                </TableCell>
              </TableRow>
            )}
            {filteredConsultations.map((consultation) => (
              <TableRow
                key={consultation.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(
                    `/dashboard/consultation/${consultation.id}?from=consultations${
                      patientFilter ? `&patient=${patientFilter}` : ""
                    }`
                  )
                }
              >
                <TableCell>
                  <div className="font-medium">
                    {format(new Date(consultation.start), "dd MMM yyyy", {
                      locale: dateLocale,
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(consultation.start), "HH:mm", { locale: dateLocale })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {consultation.patient.firstName} {consultation.patient.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {consultation.patient.phone || consultation.patient.email || t("table.noContact")}
                  </div>
                </TableCell>
                <TableCell>{consultation.service?.name ?? t("table.noService")}</TableCell>
                <TableCell>
                  <Badge
                    variant={consultation.status === "COMPLETED" ? "default" : "secondary"}
                    className={cn(
                      consultation.status === "COMPLETED" &&
                        "bg-emerald-600 text-white hover:bg-emerald-600"
                    )}
                  >
                    {statusLabel(consultation.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {consultation.note ? (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      {t("table.noteSaved")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("table.noNote")}</span>
                  )}
                </TableCell>
                <TableCell>
                  {consultation.invoice ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {t("table.billed", { number: consultation.invoice.number })}
                    </Badge>
                  ) : consultation.status === "COMPLETED" ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      {t("table.toBill")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("table.notBillableYet")}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      router.push(
                        `/dashboard/consultation/${consultation.id}?from=consultations${
                          patientFilter ? `&patient=${patientFilter}` : ""
                        }`
                      )
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("table.open")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
