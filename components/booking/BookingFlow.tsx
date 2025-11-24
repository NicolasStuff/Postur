"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createPublicAppointment, getPublicAvailability, PublicPractitioner } from "@/app/actions/booking"
import { Loader2, CheckCircle2 } from "lucide-react"
import { useTranslations } from 'next-intl'

interface Service {
    id: string
    name: string
    duration: number
    price: number | string
}

interface BookingFlowProps {
    practitioner: PublicPractitioner
    slug: string
}

export function BookingFlow({ practitioner, slug }: BookingFlowProps) {
    const t = useTranslations('booking')
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
    // Helper to get day name from date
    const getDayName = (date: Date) => {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return days[date.getDay()];
    }

    const generateSlots = () => {
        if (!date || !practitioner.openingHours) return [];

        const dayName = getDayName(date);
        // Parse opening hours safely
        let daySlots: string[] = [];
        try {
            const openingHours = typeof practitioner.openingHours === 'string' 
                ? JSON.parse(practitioner.openingHours) 
                : practitioner.openingHours;
            
            daySlots = openingHours[dayName] || [];
        } catch (e) {
            console.error("Error parsing opening hours", e);
            return [];
        }

        const slots: string[] = [];

        daySlots.forEach(range => {
            const [startStr, endStr] = range.split('-');
            if (!startStr || !endStr) return;

            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);

            let currentH = startH;
            let currentM = startM;

            while (currentH < endH || (currentH === endH && currentM < endM)) {
                const timeString = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
                slots.push(timeString);

                // Increment by 30 mins
                currentM += 30;
                if (currentM >= 60) {
                    currentH += 1;
                    currentM -= 60;
                }
            }
        });

        // Filter out booked slots
        return slots.filter(slot => {
             const [h, m] = slot.split(':').map(Number)
             const slotTime = new Date(date); 
             slotTime.setHours(h,m,0,0);
             
             // Don't show past slots if today
             if (new Date().toDateString() === date.toDateString()) {
                 if (slotTime < new Date()) return false;
             }
             
             return !appointments?.some(appt => {
                 const apptStart = new Date(appt.start)
                 const apptEnd = new Date(appt.end)
                 // Check if slot start is within appointment
                 return slotTime >= apptStart && slotTime < apptEnd
             })
        })
    }

    if (step === 'success') {
        return (
            <Card className="text-center p-8">
                <div className="flex justify-center mb-4"><CheckCircle2 className="h-16 w-16 text-green-500" /></div>
                <CardTitle className="text-2xl mb-2">{t('confirmed')}</CardTitle>
                <CardDescription>{t('confirmationEmail')}</CardDescription>
                <Button className="mt-6" onClick={() => window.location.reload()}>{t('bookAnother')}</Button>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>
                    {step === 'service' && t('selectService')}
                    {step === 'datetime' && t('selectDateTime')}
                    {step === 'details' && t('enterDetails')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {step === 'service' && (
                    <div className="space-y-4">
                        <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('selectServicePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {practitioner.services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} - {s.duration}{t('min')} (€{Number(s.price)})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button className="w-full" disabled={!selectedServiceId} onClick={() => setStep('datetime')}>{t('next')}</Button>
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
                            <Button variant="outline" onClick={() => setStep('service')}>{t('back')}</Button>
                            <Button className="flex-1" disabled={!timeSlot} onClick={() => setStep('details')}>{t('next')}</Button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('firstName')}</Label>
                                <Input value={patientDetails.firstName} onChange={(e) => setPatientDetails({...patientDetails, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('lastName')}</Label>
                                <Input value={patientDetails.lastName} onChange={(e) => setPatientDetails({...patientDetails, lastName: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('email')}</Label>
                            <Input type="email" value={patientDetails.email} onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('phone')}</Label>
                            <Input value={patientDetails.phone} onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('datetime')}>{t('back')}</Button>
                            <Button className="flex-1" onClick={handleConfirm} disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('confirmBooking')}
                            </Button>
                        </div>
                     </div>
                )}
            </CardContent>
        </Card>
    )
}
