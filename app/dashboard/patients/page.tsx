"use client"

import { CreatePatientDialog } from "@/components/patients/CreatePatientDialog"
import { PatientList } from "@/components/patients/PatientList"

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
        <CreatePatientDialog />
      </div>

      <PatientList />
    </div>
  )
}