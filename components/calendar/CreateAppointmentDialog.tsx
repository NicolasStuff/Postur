"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createAppointment } from "@/app/actions/appointments"
import { getPatients } from "@/app/actions/patients"
import { getServices } from "@/app/actions/services"

interface CreateAppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialDate?: Date
    preselectedPatientId?: string
}

export function CreateAppointmentDialog({ open, onOpenChange, initialDate, preselectedPatientId }: CreateAppointmentDialogProps) {
  const queryClient = useQueryClient()
  const [patientId, setPatientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate)

  // Update selectedDate when initialDate changes
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate)
    }
  }, [initialDate])

  // Set preselected patient when provided
  useEffect(() => {
    if (preselectedPatientId) {
      setPatientId(preselectedPatientId)
    }
  }, [preselectedPatientId])

  // Fetch Patients & Services
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => getPatients() })
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: () => getServices() })

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      onOpenChange(false)
      setPatientId("")
      setServiceId("")
      setSelectedDate(undefined)
    },
    onError: (error) => {
      alert("Failed to create appointment: " + error.message)
    }
  })

  const handleSubmit = () => {
    if (!selectedDate || !patientId || !serviceId) return

    const service = services?.find(s => s.id === serviceId)
    if (!service) return

    const end = new Date(selectedDate.getTime() + service.duration * 60000)

    mutation.mutate({
        patientId,
        serviceId,
        start: selectedDate,
        end
    })
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      setSelectedDate(new Date(value))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Patient</Label>
                    <Select onValueChange={setPatientId} value={patientId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                            {patients?.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Service</Label>
                    <Select onValueChange={setServiceId} value={serviceId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                            {services?.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration} min)</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Date & Time</Label>
                    <input
                        type="datetime-local"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedDate ? formatDateTimeLocal(selectedDate) : ''}
                        onChange={handleDateChange}
                        min={formatDateTimeLocal(new Date())}
                    />
                </div>
            </div>
            <DialogFooter>
            <Button onClick={handleSubmit} disabled={mutation.isPending || !patientId || !serviceId || !selectedDate}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
            </Button>
            </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
