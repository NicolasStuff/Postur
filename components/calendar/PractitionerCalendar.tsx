"use client"

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAppointments } from '@/app/actions/appointments'
import { CreateAppointmentDialog } from './CreateAppointmentDialog'
import { useRouter } from 'next/navigation'

export function PractitionerCalendar() {
    const router = useRouter()
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
        start: new Date(),
        end: new Date(new Date().setDate(new Date().getDate() + 7))
    })
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    const { data: appointments } = useQuery({
        queryKey: ['appointments', dateRange],
        queryFn: () => getAppointments(dateRange.start, dateRange.end)
    })

    const handleDatesSet = (arg: any) => {
        setDateRange({ start: arg.start, end: arg.end })
    }

    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.date)
        setCreateDialogOpen(true)
    }

    const handleEventClick = (info: any) => {
        // Navigate to consultation or show details
        const appointmentId = info.event.id
        router.push(`/dashboard/consultation/${appointmentId}`)
    }

    const events = appointments?.map(apt => ({
        id: apt.id,
        title: `${apt.patient.firstName} ${apt.patient.lastName}`, // Assuming patient is included
        start: apt.start,
        end: apt.end,
        color: '#2563eb'
    })) || []

    return (
        <>
            <div className='h-[calc(100vh-120px)] bg-background rounded-lg border p-4 shadow-sm'>
                <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                    editable={false} // Drag & drop logic would need another update handler
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    height="100%"
                    events={events}
                    eventContent={renderEventContent}
                    datesSet={handleDatesSet}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                />
            </div>
            <CreateAppointmentDialog 
                open={createDialogOpen} 
                onOpenChange={setCreateDialogOpen}
                initialDate={selectedDate}
            />
        </>
    )
}

function renderEventContent(eventInfo: any) {
  return (
    <div className="overflow-hidden text-xs font-medium p-1 h-full flex flex-col justify-center cursor-pointer">
      <div className="font-bold">{eventInfo.timeText}</div>
      <div className="truncate">{eventInfo.event.title}</div>
    </div>
  )
}