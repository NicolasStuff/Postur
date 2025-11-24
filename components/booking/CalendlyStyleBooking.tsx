"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createPublicAppointment, getPublicAvailability } from "@/app/actions/booking"
import { Loader2, CheckCircle2, Clock, Euro, ArrowLeft, Calendar as CalendarIcon, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'

interface Service {
    id: string
    name: string
    duration: number
    price: number | string
    description?: string
}

interface Practitioner {
    id: string
    name: string
    services: Service[]
    openingHours: string | Record<string, string[]>
}

interface CalendlyStyleBookingProps {
    practitioner: Practitioner
    slug: string
}

export function CalendlyStyleBooking({ practitioner, slug }: CalendlyStyleBookingProps) {
    const t = useTranslations('booking')
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
    const [isSuccess, setIsSuccess] = useState(false)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [timeSlot, setTimeSlot] = useState<string>("")
    const [patientDetails, setPatientDetails] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
    })

    const { data: appointments } = useQuery({
        queryKey: ['publicAvailability', practitioner.id, date],
        queryFn: () => getPublicAvailability(practitioner.id, date!),
        enabled: !!date && currentStep === 2
    })

    const mutation = useMutation({
        mutationFn: createPublicAppointment,
        onSuccess: () => setIsSuccess(true),
        onError: (err) => alert(err.message)
    })

    const getDayName = (date: Date) => {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        return days[date.getDay()]
    }

    const generateSlots = () => {
        if (!date || !practitioner.openingHours) return []

        const dayName = getDayName(date)
        let daySlots: string[] = []

        try {
            const openingHours = typeof practitioner.openingHours === 'string'
                ? JSON.parse(practitioner.openingHours)
                : practitioner.openingHours

            daySlots = openingHours[dayName] || []
        } catch (e) {
            console.error("Error parsing opening hours", e)
            return []
        }

        const slots: string[] = []

        daySlots.forEach(range => {
            const [startStr, endStr] = range.split('-')
            if (!startStr || !endStr) return

            const [startH, startM] = startStr.split(':').map(Number)
            const [endH, endM] = endStr.split(':').map(Number)

            let currentH = startH
            let currentM = startM

            while (currentH < endH || (currentH === endH && currentM < endM)) {
                const timeString = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`
                slots.push(timeString)

                currentM += 30
                if (currentM >= 60) {
                    currentH += 1
                    currentM -= 60
                }
            }
        })

        return slots.filter(slot => {
            const [h, m] = slot.split(':').map(Number)
            const slotTime = new Date(date)
            slotTime.setHours(h, m, 0, 0)

            if (new Date().toDateString() === date.toDateString()) {
                if (slotTime < new Date()) return false
            }

            return !appointments?.some(appt => {
                const apptStart = new Date(appt.start)
                const apptEnd = new Date(appt.end)
                return slotTime >= apptStart && slotTime < apptEnd
            })
        })
    }

    const handleConfirm = () => {
        if (!date || !timeSlot || !selectedService) return

        const [hours, minutes] = timeSlot.split(':').map(Number)
        const start = new Date(date)
        start.setHours(hours, minutes, 0, 0)

        mutation.mutate({
            slug,
            serviceId: selectedService.id,
            start,
            ...patientDetails
        })
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        }).format(date)
    }

    const isFormValid = () => {
        return patientDetails.firstName &&
               patientDetails.lastName &&
               patientDetails.email &&
               patientDetails.phone
    }

    // Success screen
    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-green-50 rounded-full p-4 mb-6">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {t('bookingSuccess.title')}
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                    {t('bookingSuccess.subtitle')}
                </p>
                <div className="bg-gray-50 rounded-lg p-6 my-6 max-w-md w-full">
                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700">{practitioner.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700">
                                {date && formatDate(date)} à {timeSlot}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-700">{selectedService?.name} - {selectedService?.duration}{t('min')}</span>
                        </div>
                    </div>
                </div>
                <p className="text-gray-500 mb-8">
                    {t('bookingSuccess.confirmationSent', { email: patientDetails.email })}
                </p>
                <Button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {t('bookAnother')}
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full">
            {/* Step indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <div className={cn(
                        "flex items-center gap-2",
                        currentStep >= 1 ? "text-blue-600" : "text-gray-400"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                            currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                        )}>
                            1
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">{t('step.service')}</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                        <div
                            className={cn(
                                "h-full bg-blue-600 transition-all",
                                currentStep >= 2 ? "w-full" : "w-0"
                            )}
                        />
                    </div>
                    <div className={cn(
                        "flex items-center gap-2",
                        currentStep >= 2 ? "text-blue-600" : "text-gray-400"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                            currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                        )}>
                            2
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">{t('step.dateTime')}</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                        <div
                            className={cn(
                                "h-full bg-blue-600 transition-all",
                                currentStep >= 3 ? "w-full" : "w-0"
                            )}
                        />
                    </div>
                    <div className={cn(
                        "flex items-center gap-2",
                        currentStep >= 3 ? "text-blue-600" : "text-gray-400"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                            currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"
                        )}>
                            3
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">{t('step.information')}</span>
                    </div>
                </div>
            </div>

            {/* Step 1: Select Service */}
            {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('chooseConsultationType')}
                        </h2>
                        <p className="text-gray-600">
                            {t('selectServiceDescription')}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {practitioner.services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setSelectedService(service)}
                                className={cn(
                                    "w-full text-left p-6 rounded-xl border-2 transition-all hover:border-blue-400 hover:shadow-md",
                                    selectedService?.id === service.id
                                        ? "border-blue-600 bg-blue-50 shadow-md"
                                        : "border-gray-200 bg-white"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                            {service.name}
                                        </h3>
                                        {service.description && (
                                            <p className="text-gray-600 text-sm mb-3">
                                                {service.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{service.duration} min</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Euro className="h-4 w-4" />
                                                <span>{Number(service.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4",
                                        selectedService?.id === service.id
                                            ? "border-blue-600 bg-blue-600"
                                            : "border-gray-300"
                                    )}>
                                        {selectedService?.id === service.id && (
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={() => setCurrentStep(2)}
                        disabled={!selectedService}
                        className="w-full mt-6 h-12 text-base bg-blue-600 hover:bg-blue-700"
                    >
                        {t('continue')}
                    </Button>
                </div>
            )}

            {/* Step 2: Select Date & Time */}
            {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('selectDateAndTime')}
                        </h2>
                        <p className="text-gray-600">
                            {t('chooseBestTime')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex justify-center mb-6">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => date < new Date()}
                                className="rounded-lg"
                            />
                        </div>

                        {date && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    {formatDate(date)}
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                                    {generateSlots().length > 0 ? (
                                        generateSlots().map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setTimeSlot(slot)}
                                                className={cn(
                                                    "py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                                                    timeSlot === slot
                                                        ? "bg-blue-600 text-white shadow-md"
                                                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                )}
                                            >
                                                {slot}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-8 text-gray-500">
                                            {t('noSlotsAvailable')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentStep(1)
                                setDate(undefined)
                                setTimeSlot("")
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('back')}
                        </Button>
                        <Button
                            onClick={() => setCurrentStep(3)}
                            disabled={!date || !timeSlot}
                            className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
                        >
                            {t('continue')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Enter Details (but actually step 3 is shown before confirmation) */}
            {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {t('yourInformation')}
                        </h2>
                        <p className="text-gray-600">
                            {t('fillDetailsToComplete')}
                        </p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">{t('summary')}</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('service')} :</span>
                                <span className="font-medium">{selectedService?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('date')} :</span>
                                <span className="font-medium">{date && formatDate(date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('time')} :</span>
                                <span className="font-medium">{timeSlot}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('duration')} :</span>
                                <span className="font-medium">{selectedService?.duration} {t('minutes')}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-200">
                                <span className="text-gray-600">{t('price')} :</span>
                                <span className="font-semibold text-lg">{Number(selectedService?.price)} €</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-gray-700">
                                    {t('firstName')} *
                                </Label>
                                <Input
                                    id="firstName"
                                    value={patientDetails.firstName}
                                    onChange={(e) => setPatientDetails({
                                        ...patientDetails,
                                        firstName: e.target.value
                                    })}
                                    className="h-11"
                                    placeholder={t('firstNamePlaceholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-gray-700">
                                    {t('lastName')} *
                                </Label>
                                <Input
                                    id="lastName"
                                    value={patientDetails.lastName}
                                    onChange={(e) => setPatientDetails({
                                        ...patientDetails,
                                        lastName: e.target.value
                                    })}
                                    className="h-11"
                                    placeholder={t('lastNamePlaceholder')}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">
                                {t('email')} *
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={patientDetails.email}
                                onChange={(e) => setPatientDetails({
                                    ...patientDetails,
                                    email: e.target.value
                                })}
                                className="h-11"
                                placeholder={t('emailPlaceholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-gray-700">
                                {t('phone')} *
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={patientDetails.phone}
                                onChange={(e) => setPatientDetails({
                                    ...patientDetails,
                                    phone: e.target.value
                                })}
                                className="h-11"
                                placeholder={t('phonePlaceholder')}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCurrentStep(2)
                            }}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('back')}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!isFormValid() || mutation.isPending}
                            className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('confirmingInProgress')}
                                </>
                            ) : (
                                t('confirmBooking')
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
