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
}

export function CreateAppointmentDialog({ open, onOpenChange, initialDate }: CreateAppointmentDialogProps) {
  const queryClient = useQueryClient()
  const [patientId, setPatientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  
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
    },
    onError: (error) => {
      alert("Failed to create appointment: " + error.message)
    }
  })

  const handleSubmit = () => {
    if (!initialDate || !patientId || !serviceId) return
    
    const service = services?.find(s => s.id === serviceId)
    if (!service) return

    const end = new Date(initialDate.getTime() + service.duration * 60000)

    mutation.mutate({
        patientId,
        serviceId,
        start: initialDate,
        end
    })
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
                <div className="text-sm text-muted-foreground">
                    Date: {initialDate?.toLocaleString()}
                </div>
            </div>
            <DialogFooter>
            <Button onClick={handleSubmit} disabled={mutation.isPending || !patientId || !serviceId}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
            </Button>
            </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
