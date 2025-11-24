"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  DollarSign,
  CheckCircle2
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createAppointment } from "@/app/actions/appointments"
import { getPatients } from "@/app/actions/patients"
import { getServices } from "@/app/actions/services"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useTranslations } from "next-intl"

interface CreateAppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialDate?: Date
    preselectedPatientId?: string
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  initialDate,
  preselectedPatientId
}: CreateAppointmentDialogProps) {
  const t = useTranslations('calendar')
  const queryClient = useQueryClient()
  const [patientId, setPatientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState({ hour: "09", minute: "00" })
  const [notes, setNotes] = useState("")

  // Update date when initialDate changes
  useEffect(() => {
    if (initialDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing form state with prop changes
      setDate(initialDate)
      setTime({
        hour: String(initialDate.getHours()).padStart(2, '0'),
        minute: String(initialDate.getMinutes()).padStart(2, '0')
      })
    }
  }, [initialDate])

  // Set preselected patient when provided
  useEffect(() => {
    if (preselectedPatientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing form state with prop changes
      setPatientId(preselectedPatientId)
    }
  }, [preselectedPatientId])

  // Fetch Patients & Services
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => getPatients()
  })
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices()
  })

  // Get selected patient and service
  const selectedPatient = useMemo(() =>
    patients?.find(p => p.id === patientId),
    [patients, patientId]
  )
  const selectedService = useMemo(() =>
    services?.find(s => s.id === serviceId),
    [services, serviceId]
  )

  // Calculate appointment date/time
  const appointmentDateTime = useMemo(() => {
    if (!date) return undefined
    const dateTime = new Date(date)
    dateTime.setHours(parseInt(time.hour), parseInt(time.minute), 0, 0)
    return dateTime
  }, [date, time])

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onOpenChange(false)
      // Reset form
      setPatientId("")
      setServiceId("")
      setDate(undefined)
      setTime({ hour: "09", minute: "00" })
      setNotes("")
    },
    onError: (error) => {
      alert(t('appointmentCreationFailed') + error.message)
    }
  })

  const handleSubmit = () => {
    if (!appointmentDateTime || !patientId || !serviceId || !selectedService) return

    const end = new Date(appointmentDateTime.getTime() + selectedService.duration * 60000)

    mutation.mutate({
        patientId,
        serviceId,
        start: appointmentDateTime,
        end
    })
  }

  const isFormValid = patientId && serviceId && date

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('newAppointment')}</DialogTitle>
          <DialogDescription>
            {t('newAppointmentDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('patient')}
            </Label>
            <Select onValueChange={setPatientId} value={patientId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t('selectPatient')} />
              </SelectTrigger>
              <SelectContent>
                {patients?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      {p.email && (
                        <span className="text-xs text-muted-foreground">• {p.email}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPatient && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        {selectedPatient.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedPatient.email}
                          </p>
                        )}
                        {selectedPatient.phone && (
                          <p className="text-xs text-muted-foreground">
                            {selectedPatient.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('service')}
            </Label>
            <Select onValueChange={setServiceId} value={serviceId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t('selectService')} />
              </SelectTrigger>
              <SelectContent>
                {services?.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{s.duration} {t('min')}</span>
                        <span>•</span>
                        <span>{s.price}€</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{selectedService.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="font-normal">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedService.duration} {t('min')}
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {selectedService.price}€
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Date & Time Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {t('date')}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : t('selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('time')}
              </Label>
              <div className="flex gap-2">
                <Select value={time.hour} onValueChange={(h) => setTime(prev => ({ ...prev, hour: h }))}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 14 }, (_, i) => i + 7).map(h => (
                      <SelectItem key={h} value={String(h).padStart(2, '0')}>
                        {String(h).padStart(2, '0')}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={time.minute} onValueChange={(m) => setTime(prev => ({ ...prev, minute: m }))}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map(m => (
                      <SelectItem key={m} value={m}>
                        {m} {t('min')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Appointment Summary */}
          {isFormValid && appointmentDateTime && selectedService && (
            <>
              <Separator />
              <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{t('appointmentSummary')}</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{selectedPatient?.firstName} {selectedPatient?.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{selectedService.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{format(appointmentDateTime, "EEEE d MMMM yyyy", { locale: fr })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            {format(appointmentDateTime, "HH:mm")}
                            {" - "}
                            {format(new Date(appointmentDateTime.getTime() + selectedService.duration * 60000), "HH:mm")}
                            {" "}
                            ({selectedService.duration} {t('min')})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !isFormValid}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('createAppointment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
