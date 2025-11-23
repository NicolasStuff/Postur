"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createPublicAppointment, getPublicAvailability } from "@/app/actions/booking"
import { Loader2, CheckCircle2 } from "lucide-react"

interface BookingFlowProps {
    practitioner: any
    slug: string
}

export function BookingFlow({ practitioner, slug }: BookingFlowProps) {
    const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'success'>('service')
    const [selectedServiceId, setSelectedServiceId] = useState<string>("")
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [timeSlot, setTimeSlot] = useState<string>("")
    const [patientDetails, setPatientDetails] = useState({ firstName: "", lastName: "", email: "", phone: "" })

    const { data: appointments } = useQuery({
        queryKey: ['publicAvailability', practitioner.id, date],
        queryFn: () => getPublicAvailability(practitioner.id, date!),
        enabled: !!date && step === 'datetime'
    })

    const mutation = useMutation({
        mutationFn: createPublicAppointment,
        onSuccess: () => setStep('success'),
        onError: (err) => alert(err.message)
    })

    const handleConfirm = () => {
        if (!date || !timeSlot) return;
        const [hours, minutes] = timeSlot.split(':').map(Number)
        const start = new Date(date)
        start.setHours(hours, minutes, 0, 0)

        mutation.mutate({
            slug,
            serviceId: selectedServiceId,
            start,
            ...patientDetails
        })
    }

    // Simple slot generation (9am - 6pm, every 30 mins)
    // Real app would check duration and overlap
    const generateSlots = () => {
        const slots = []
        for (let h = 9; h < 18; h++) {
            slots.push(`${h}:00`, `${h}:30`)
        }
        // Filter out booked slots (simplified)
        return slots.filter(slot => {
             const [h, m] = slot.split(':').map(Number)
             const slotTime = new Date(date!); slotTime.setHours(h,m,0,0);
             
             return !appointments?.some(appt => {
                 const apptStart = new Date(appt.start)
                 const apptEnd = new Date(appt.end)
                 return slotTime >= apptStart && slotTime < apptEnd
             })
        })
    }

    if (step === 'success') {
        return (
            <Card className="text-center p-8">
                <div className="flex justify-center mb-4"><CheckCircle2 className="h-16 w-16 text-green-500" /></div>
                <CardTitle className="text-2xl mb-2">Booking Confirmed!</CardTitle>
                <CardDescription>You will receive a confirmation email shortly.</CardDescription>
                <Button className="mt-6" onClick={() => window.location.reload()}>Book Another</Button>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Book Appointment</CardTitle>
                <CardDescription>
                    {step === 'service' && "Select a service"}
                    {step === 'datetime' && "Select a date and time"}
                    {step === 'details' && "Enter your details"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {step === 'service' && (
                    <div className="space-y-4">
                        <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Service" />
                            </SelectTrigger>
                            <SelectContent>
                                {practitioner.services.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.duration}min (€{Number(s.price)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button className="w-full" disabled={!selectedServiceId} onClick={() => setStep('datetime')}>Next</Button>
                    </div>
                )}

                {step === 'datetime' && (
                    <div className="space-y-6">
                        <div className="flex justify-center border rounded-md p-4">
                             <Calendar mode="single" selected={date} onSelect={setDate} disabled={(date) => date < new Date()} className="rounded-md" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {generateSlots().map(slot => (
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
                            <Button variant="outline" onClick={() => setStep('service')}>Back</Button>
                            <Button className="flex-1" disabled={!timeSlot} onClick={() => setStep('details')}>Next</Button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input value={patientDetails.firstName} onChange={(e) => setPatientDetails({...patientDetails, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input value={patientDetails.lastName} onChange={(e) => setPatientDetails({...patientDetails, lastName: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={patientDetails.email} onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={patientDetails.phone} onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('datetime')}>Back</Button>
                            <Button className="flex-1" onClick={handleConfirm} disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Booking
                            </Button>
                        </div>
                     </div>
                )}
            </CardContent>
        </Card>
    )
}
