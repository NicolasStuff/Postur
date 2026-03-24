"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  createPublicAppointment,
  getPublicAvailableSlots,
  PublicPractitioner,
} from "@/app/actions/booking"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BookingFlowProps {
  practitioner: PublicPractitioner
  slug: string
}

function formatDateValue(date: Date | undefined) {
  if (!date) {
    return null
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

export function BookingFlow({ practitioner, slug }: BookingFlowProps) {
  const t = useTranslations("booking")
  const [step, setStep] = useState<"service" | "datetime" | "details" | "success">("service")
  const [selectedServiceId, setSelectedServiceId] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [timeSlot, setTimeSlot] = useState("")
  const [patientDetails, setPatientDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const selectedDateValue = formatDateValue(date)

  const { data: availability } = useQuery({
    queryKey: ["publicAvailability", slug, selectedServiceId, selectedDateValue],
    queryFn: () =>
      getPublicAvailableSlots({
        slug,
        serviceId: selectedServiceId,
        date: selectedDateValue!,
      }),
    enabled: Boolean(selectedServiceId && selectedDateValue && step === "datetime"),
  })

  const mutation = useMutation({
    mutationFn: createPublicAppointment,
    onSuccess: () => setStep("success"),
    onError: (err) => alert(err.message),
  })

  const handleConfirm = () => {
    if (!selectedDateValue || !timeSlot) return

    mutation.mutate({
      slug,
      serviceId: selectedServiceId,
      date: selectedDateValue,
      time: timeSlot,
      ...patientDetails,
    })
  }

  if (step === "success") {
    return (
      <Card className="text-center p-8">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl mb-2">{t("confirmed")}</CardTitle>
        <CardDescription>{t("confirmationEmail")}</CardDescription>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          {t("bookAnother")}
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {step === "service" && t("selectService")}
          {step === "datetime" && t("selectDateTime")}
          {step === "details" && t("enterDetails")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === "service" && (
          <div className="space-y-4">
            <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectServicePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {practitioner.services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.duration}
                    {t("min")} (€{Number(service.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" disabled={!selectedServiceId} onClick={() => setStep("datetime")}>
              {t("next")}
            </Button>
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-6">
            <div className="flex justify-center border rounded-md p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(currentDate) => currentDate < new Date()}
                className="rounded-md"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(availability?.slots || []).map((slot) => (
                <Button
                  key={slot}
                  variant={timeSlot === slot ? "default" : "outline"}
                  onClick={() => setTimeSlot(slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("service")}>
                {t("back")}
              </Button>
              <Button className="flex-1" disabled={!timeSlot} onClick={() => setStep("details")}>
                {t("next")}
              </Button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("firstName")}</Label>
                <Input
                  value={patientDetails.firstName}
                  onChange={(event) =>
                    setPatientDetails({ ...patientDetails, firstName: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("lastName")}</Label>
                <Input
                  value={patientDetails.lastName}
                  onChange={(event) =>
                    setPatientDetails({ ...patientDetails, lastName: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("email")}</Label>
              <Input
                type="email"
                value={patientDetails.email}
                onChange={(event) =>
                  setPatientDetails({ ...patientDetails, email: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input
                value={patientDetails.phone}
                onChange={(event) =>
                  setPatientDetails({ ...patientDetails, phone: event.target.value })
                }
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("datetime")}>
                {t("back")}
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("confirmBooking")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
