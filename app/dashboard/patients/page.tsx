"use client"

import { CreatePatientDialog } from "@/components/patients/CreatePatientDialog"
import { PatientList } from "@/components/patients/PatientList"
import { useTranslations } from 'next-intl'

export default function PatientsPage() {
  const t = useTranslations('dashboard.patientsPage')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <CreatePatientDialog />
      </div>

      <PatientList />
    </div>
  )
}