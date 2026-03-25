"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

import { getPatient } from "@/app/actions/patients"
import { Button } from "@/components/ui/button"
import { PatientDetailHeader } from "@/components/patients/detail/PatientDetailHeader"
import { PatientDetailTabs } from "@/components/patients/detail/PatientDetailTabs"

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = use(params)
  const t = useTranslations("patientDetail")

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/patients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {patient.firstName} {patient.lastName}
        </h1>
      </div>

      <PatientDetailHeader patient={patient} />
      <PatientDetailTabs patient={patient} />
    </div>
  )
}
