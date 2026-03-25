"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TZDate } from '@date-fns/tz'
import { BOOKING_TIMEZONE } from '@/lib/booking'
import { getAppointments, getWeekCalendarData } from '@/app/actions/appointments'
import WeekCalendar from './week-calendar/WeekCalendar'
import { CreateAppointmentDialog } from './CreateAppointmentDialog'
import { ChevronLeft, ChevronRight, Plus, LockOpen, Lock, Calendar } from 'lucide-react'

export function PractitionerCalendar() {
    const t = useTranslations('calendar')

    const [currentDate, setCurrentDate] = useState<Date>(() => new TZDate(Date.now(), BOOKING_TIMEZONE))
    const [exceptionMode, setExceptionMode] = useState(false)
    const [exceptionType, setExceptionType] = useState<'ADDED' | 'BLOCKED'>('ADDED')
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [selectedDate] = useState<Date | undefined>(undefined)

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

    const startDate = startOfDay(weekStart).toISOString()
    const endDate = endOfDay(weekEnd).toISOString()

    const startDateFormatted = format(weekStart, 'yyyy-MM-dd')
    const endDateFormatted = format(weekEnd, 'yyyy-MM-dd')

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', startDate, endDate],
        queryFn: () => getAppointments(new Date(startDate), new Date(endDate)),
    })

    const { data: scheduleData } = useQuery({
        queryKey: ['weekSchedule', startDateFormatted, endDateFormatted],
        queryFn: () => getWeekCalendarData(startDateFormatted, endDateFormatted),
    })

    return (
        <>
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-sm font-medium text-primary">
                        {t('weekOf', {
                            start: format(weekStart, 'd MMM', { locale: fr }),
                            end: format(weekEnd, 'd MMM yyyy', { locale: fr }),
                        })}
                    </h2>
                    <button
                        onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCreateDialogOpen(true)}
                        className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        {t('newAppointment')}
                    </button>
                    <button
                        onClick={() => {
                            setExceptionType('ADDED')
                            setExceptionMode(!exceptionMode || exceptionType !== 'ADDED')
                        }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                            exceptionMode && exceptionType === 'ADDED'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <LockOpen className="h-4 w-4" />
                        {exceptionMode && exceptionType === 'ADDED' ? t('cancelAction') : t('openSlots')}
                    </button>
                    <button
                        onClick={() => {
                            setExceptionType('BLOCKED')
                            setExceptionMode(!exceptionMode || exceptionType !== 'BLOCKED')
                        }}
                        className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                            exceptionMode && exceptionType === 'BLOCKED'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Lock className="h-4 w-4" />
                        {exceptionMode && exceptionType === 'BLOCKED' ? t('cancelAction') : t('closeSlots')}
                    </button>
                    <button
                        onClick={() => setCurrentDate(new TZDate(Date.now(), BOOKING_TIMEZONE))}
                        className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Calendar className="h-4 w-4" />
                        {t('today')}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : (
                <WeekCalendar
                    appointments={appointments ?? []}
                    currentDate={currentDate}
                    scheduleWindows={scheduleData?.scheduleWindows}
                    exceptionMode={exceptionMode}
                    exceptionType={exceptionType}
                    onExceptionModeChange={setExceptionMode}
                />
            )}

            <CreateAppointmentDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                initialDate={selectedDate}
            />
        </>
    )
}
