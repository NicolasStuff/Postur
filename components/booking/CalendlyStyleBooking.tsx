"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createPublicAppointment, getPublicAvailableSlots, PublicPractitioner } from "@/app/actions/booking"
import { Loader2, CheckCircle2, Clock, ChevronLeft, ChevronRight, ArrowLeft, Globe, MapPin, Phone as PhoneIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'

interface Service {
    id: string
    name: string
    duration: number
    price: number | string
    description?: string
}

interface CalendlyStyleBookingProps {
    practitioner: PublicPractitioner
    slug: string
}

type BookingStep = 'service' | 'datetime' | 'details' | 'success'

export function CalendlyStyleBooking({ practitioner, slug }: CalendlyStyleBookingProps) {
    const t = useTranslations('booking')

    // State
    const [step, setStep] = useState<BookingStep>(
        practitioner.services.length === 1 ? 'datetime' : 'service'
    )
    const [selectedService, setSelectedService] = useState<Service | null>(
        practitioner.services.length === 1 ? practitioner.services[0] : null
    )
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [patientDetails, setPatientDetails] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
    })

    // Timezone
    const timezoneDisplay = "Europe/Paris"
    const currentTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris'
    })
    const selectedDateValue = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : null

    // Query for availability
    const { data: availability } = useQuery({
        queryKey: ['publicAvailability', slug, selectedService?.id, selectedDateValue],
        queryFn: () => getPublicAvailableSlots({
            slug,
            serviceId: selectedService!.id,
            date: selectedDateValue!,
        }),
        enabled: Boolean(selectedService?.id && selectedDateValue)
    })

    // Mutation for booking
    const mutation = useMutation({
        mutationFn: createPublicAppointment,
        onSuccess: () => setStep('success'),
        onError: (err) => alert(err.message)
    })

    // Calendar logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday first

        return { daysInMonth, startingDay, year, month }
    }

    const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentMonth)

    const monthNames = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]

    const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

    const isDateAvailable = (day: number) => {
        const date = new Date(year, month, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (date < today) return false

        return Boolean(selectedService)
    }

    const timeSlots = availability?.slots || []

    const handleDateClick = (day: number) => {
        if (!isDateAvailable(day)) return
        const date = new Date(year, month, day)
        setSelectedDate(date)
        setSelectedTime(null)
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
        setStep('details')
    }

    const handleConfirm = () => {
        if (!selectedDateValue || !selectedTime || !selectedService) return

        mutation.mutate({
            slug,
            serviceId: selectedService.id,
            date: selectedDateValue,
            time: selectedTime,
            ...patientDetails
        })
    }

    const formatSelectedDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date)
    }

    const isFormValid = () => {
        return patientDetails.firstName &&
               patientDetails.lastName &&
               patientDetails.email &&
               patientDetails.phone
    }

    // Service Selection Screen
    if (step === 'service') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {practitioner.name}
                        </h1>
                        <p className="text-gray-600">{t('chooseConsultationType')}</p>
                    </div>

                    <div className="space-y-3 max-w-lg mx-auto">
                        {practitioner.services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => {
                                    setSelectedService(service)
                                    setStep('datetime')
                                }}
                                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                            {service.name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {service.duration} min
                                            </span>
                                            <span>{Number(service.price)} €</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Success Screen
    if (step === 'success') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8 md:p-12 text-center">
                    <div className="bg-green-100 rounded-full p-4 w-fit mx-auto mb-6">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('bookingSuccess.title')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {t('bookingSuccess.subtitle')}
                    </p>

                    <div className="bg-gray-50 rounded-lg p-5 max-w-sm mx-auto mb-6 text-left">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('service')}</span>
                                <span className="font-medium text-gray-900">{selectedService?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('date')}</span>
                                <span className="font-medium text-gray-900">
                                    {selectedDate && formatSelectedDate(selectedDate)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('time')}</span>
                                <span className="font-medium text-gray-900">{selectedTime}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        {t('bookingSuccess.confirmationSent', { email: patientDetails.email })}
                    </p>

                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {t('bookAnother')}
                    </Button>
                </div>
            </div>
        )
    }

    // Details Form Screen
    if (step === 'details') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Left Panel - Summary */}
                    <div className="md:w-80 border-b md:border-b-0 md:border-r border-gray-200 p-6">
                        <button
                            onClick={() => setStep('datetime')}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('back')}
                        </button>

                        <div className="mb-6">
                            <p className="text-sm text-gray-500 mb-1">{practitioner.name}</p>
                            <h2 className="text-xl font-bold text-gray-900">{selectedService?.name}</h2>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-gray-600">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{selectedService?.duration} min</span>
                            </div>
                            {practitioner.companyAddress && (
                                <div className="flex items-start gap-3 text-gray-600">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <span>{practitioner.companyAddress}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedDate && formatSelectedDate(selectedDate)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{selectedTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="flex-1 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">
                            {t('yourInformation')}
                        </h3>

                        <div className="space-y-4 max-w-md">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-sm text-gray-700">
                                        {t('firstName')} *
                                    </Label>
                                    <Input
                                        id="firstName"
                                        value={patientDetails.firstName}
                                        onChange={(e) => setPatientDetails({
                                            ...patientDetails,
                                            firstName: e.target.value
                                        })}
                                        placeholder={t('firstNamePlaceholder')}
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-sm text-gray-700">
                                        {t('lastName')} *
                                    </Label>
                                    <Input
                                        id="lastName"
                                        value={patientDetails.lastName}
                                        onChange={(e) => setPatientDetails({
                                            ...patientDetails,
                                            lastName: e.target.value
                                        })}
                                        placeholder={t('lastNamePlaceholder')}
                                        className="h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm text-gray-700">
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
                                    placeholder={t('emailPlaceholder')}
                                    className="h-10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm text-gray-700">
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
                                    placeholder={t('phonePlaceholder')}
                                    className="h-10"
                                />
                            </div>

                            <Button
                                onClick={handleConfirm}
                                disabled={!isFormValid() || mutation.isPending}
                                className="w-full h-11 mt-4 bg-blue-600 hover:bg-blue-700 text-base"
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
                </div>
            </div>
        )
    }

    // Main DateTime Selection (Calendly-style)
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex flex-col md:flex-row">
                {/* Left Panel - Service Info */}
                <div className="md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-gray-200 p-6">
                    {practitioner.services.length > 1 && (
                        <button
                            onClick={() => setStep('service')}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('back')}
                        </button>
                    )}

                    <p className="text-sm text-gray-500 mb-1">{practitioner.name}</p>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedService?.name}</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{selectedService?.duration} min</span>
                        </div>
                        {practitioner.companyAddress && (
                            <div className="flex items-start gap-3 text-gray-600">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span>{practitioner.companyAddress}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-gray-600">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <span>{practitioner.practitionerType}</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Calendar & Times */}
                <div className="flex-1 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        {t('selectDateAndTime')}
                    </h3>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Calendar */}
                        <div className="flex-1">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setCurrentMonth(new Date(year, month - 1))}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                                </button>
                                <h4 className="text-base font-medium text-gray-900 capitalize">
                                    {monthNames[month]} {year}
                                </h4>
                                <button
                                    onClick={() => setCurrentMonth(new Date(year, month + 1))}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 mb-2">
                                {dayNames.map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {/* Empty cells for offset */}
                                {Array.from({ length: startingDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}

                                {/* Days */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1
                                    const isAvailable = isDateAvailable(day)
                                    const isSelected = selectedDate?.getDate() === day &&
                                                      selectedDate?.getMonth() === month &&
                                                      selectedDate?.getFullYear() === year
                                    const isToday = new Date().getDate() === day &&
                                                   new Date().getMonth() === month &&
                                                   new Date().getFullYear() === year

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDateClick(day)}
                                            disabled={!isAvailable}
                                            className={cn(
                                                "aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all",
                                                isAvailable && !isSelected && "text-blue-600 hover:bg-blue-50",
                                                !isAvailable && "text-gray-300 cursor-not-allowed",
                                                isSelected && "bg-blue-600 text-white",
                                                isToday && !isSelected && isAvailable && "ring-2 ring-blue-600 ring-offset-1"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Timezone */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Globe className="h-4 w-4" />
                                    <span>{timezoneDisplay} ({currentTime})</span>
                                </div>
                            </div>
                        </div>

                        {/* Time Slots */}
                        {selectedDate && (
                            <div className="lg:w-48 lg:border-l lg:border-gray-200 lg:pl-6">
                                <p className="text-sm font-medium text-gray-900 mb-3 capitalize">
                                    {new Intl.DateTimeFormat('fr-FR', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    }).format(selectedDate)}
                                </p>

                                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                                    {timeSlots.length > 0 ? (
                                        timeSlots.map(time => (
                                            <button
                                                key={time}
                                                onClick={() => handleTimeSelect(time)}
                                                className={cn(
                                                    "w-full py-2.5 px-4 text-sm font-medium rounded-md border transition-all",
                                                    selectedTime === time
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "text-blue-600 border-blue-600 hover:bg-blue-50"
                                                )}
                                            >
                                                {time}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            {t('noSlotsAvailable')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
