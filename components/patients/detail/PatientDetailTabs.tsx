"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PatientOverviewTab } from "@/components/patients/detail/PatientOverviewTab"
import { PatientConsultationsTab } from "@/components/patients/detail/PatientConsultationsTab"
import { PatientBillingTab } from "@/components/patients/detail/PatientBillingTab"
import type { PatientDetail } from "@/components/patients/detail/types"

export function PatientDetailTabs({ patient }: { patient: PatientDetail }) {
  const t = useTranslations("patientDetail.tabs")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") ?? "overview"

  return (
    <Tabs
      defaultValue={defaultTab}
      onValueChange={(value) => {
        router.replace(pathname + "?tab=" + value, { scroll: false })
      }}
    >
      <TabsList>
        <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
        <TabsTrigger value="consultations">{t("consultations")}</TabsTrigger>
        <TabsTrigger value="billing">{t("billing")}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <PatientOverviewTab patient={patient} />
      </TabsContent>

      <TabsContent value="consultations" className="mt-4">
        <PatientConsultationsTab patient={patient} />
      </TabsContent>

      <TabsContent value="billing" className="mt-4">
        <PatientBillingTab patient={patient} />
      </TabsContent>
    </Tabs>
  )
}
