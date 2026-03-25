"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Mail, Phone, MapPin, Pencil, CalendarPlus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EditPatientDialog } from "@/components/patients/detail/EditPatientDialog"
import { CreateAppointmentDialog } from "@/components/calendar/CreateAppointmentDialog"
import type { PatientDetail } from "@/components/patients/detail/types"

export function PatientDetailHeader({ patient }: { patient: PatientDetail }) {
  const t = useTranslations("patientDetail")
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [appointmentOpen, setAppointmentOpen] = useState(false)

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="bg-slate-200 text-slate-700 text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {patient.email && (
                  <span className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{patient.email}</span>
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{patient.phone}</span>
                  </span>
                )}
                {patient.address && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{patient.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t("edit")}
            </Button>
            <Button size="sm" onClick={() => setAppointmentOpen(true)}>
              <CalendarPlus className="mr-2 h-3.5 w-3.5" />
              {t("newAppointment")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditPatientDialog
        patient={patient}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <CreateAppointmentDialog
        open={appointmentOpen}
        onOpenChange={setAppointmentOpen}
        preselectedPatientId={patient.id}
      />
    </>
  )
}
