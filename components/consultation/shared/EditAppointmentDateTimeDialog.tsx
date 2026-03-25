"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { fr, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { updateAppointmentDateTime } from "@/app/actions/appointments"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface EditAppointmentDateTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  currentStart: Date | string
}

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 7; hour < 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      )
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function EditAppointmentDateTimeDialog({
  open,
  onOpenChange,
  appointmentId,
  currentStart,
}: EditAppointmentDateTimeDialogProps) {
  const t = useTranslations("consultation.detail")
  const locale = useLocale()
  const dateLocale = locale === "fr" ? fr : enUS
  const queryClient = useQueryClient()

  const currentDate = new Date(currentStart)
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [selectedTime, setSelectedTime] = useState<string>(
    format(currentDate, "HH:mm")
  )
  const [calendarOpen, setCalendarOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const newStart = new Date(selectedDate)
      newStart.setHours(hours, minutes, 0, 0)
      return updateAppointmentDateTime({ appointmentId, start: newStart })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["consultation", appointmentId] })
      await queryClient.invalidateQueries({ queryKey: ["appointments"] })
      toast.success(t("dateTimeUpdated"))
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || t("dateTimeUpdateError"))
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const d = new Date(currentStart)
      setSelectedDate(d)
      setSelectedTime(format(d, "HH:mm"))
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("editDateTimeTitle")}</DialogTitle>
          <DialogDescription>{t("editDateTimeDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("newDate")}</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP", { locale: dateLocale })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      setCalendarOpen(false)
                    }
                  }}
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("newTime")}</label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("saving") : t("saveDateTime")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
