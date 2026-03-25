import { useDraggable } from '@dnd-kit/core'
import type { CalendarAppointment } from './types'
import { CALENDAR_STATUS_COLORS, FIRST_HOUR, SLOT_HEIGHT_PX, SLOT_MINUTES, getDurationMinutes } from './types'
import { durationToSlots } from './utils'

interface DraggableAppointmentProps {
  appointment: CalendarAppointment
  dayIndex: number
  isDndActive: boolean
  onClickAppointment: (appointmentId: string) => void
  onMouseEnter: (appointment: CalendarAppointment, rect: DOMRect) => void
  onMouseLeave: (appointmentId: string) => void
  onResizeStart: (event: React.MouseEvent<HTMLButtonElement>, appointmentId: string, dayIndex: number) => void
  previewDurationSlots?: number
  isResizing?: boolean
}

export default function DraggableAppointment({
  appointment,
  dayIndex,
  isDndActive,
  onClickAppointment,
  onMouseEnter,
  onMouseLeave,
  onResizeStart,
  previewDurationSlots,
  isResizing = false,
}: DraggableAppointmentProps) {
  const durationMinutes = getDurationMinutes(appointment.start, appointment.end)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `appointment-${appointment.id}`,
    data: {
      kind: 'appointment' as const,
      appointmentId: appointment.id,
      durationSlots: durationToSlots(durationMinutes),
    },
  })

  const durationSlots = previewDurationSlots ?? durationToSlots(durationMinutes)
  const top = ((appointment.start.getHours() - FIRST_HOUR) * 60 + appointment.start.getMinutes()) / SLOT_MINUTES * SLOT_HEIGHT_PX
  const height = Math.max(22, durationSlots * SLOT_HEIGHT_PX)

  return (
    <div
      ref={setNodeRef}
      data-testid={`appointment-${appointment.id}`}
      onClick={(event) => {
        event.stopPropagation()
        onClickAppointment(appointment.id)
      }}
      onMouseEnter={(event) => onMouseEnter(appointment, event.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onMouseLeave(appointment.id)}
      className={`group absolute left-0.5 right-0.5 z-20 overflow-hidden rounded-md px-1 py-0.5 text-xs transition-opacity hover:opacity-90 ${CALENDAR_STATUS_COLORS[appointment.status]} ${isDragging ? 'opacity-40' : ''} ${isResizing ? 'ring-2 ring-fuchsia-500 ring-offset-1' : ''} ${isDndActive && !isDragging ? 'pointer-events-none' : ''}`}
      style={{ top, height }}
      title={`${appointment.patient.firstName} ${appointment.patient.lastName} - ${appointment.service.name}`}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        onMouseDown={(event) => event.stopPropagation()}
        className="min-h-full cursor-grab pb-3 pr-1 active:cursor-grabbing"
      >
        <div className="truncate font-medium">
          {appointment.patient.firstName} {appointment.patient.lastName[0]}.
        </div>
        <div className="truncate opacity-75">{appointment.service.name}</div>
      </div>
      <button
        type="button"
        data-testid={`appointment-resize-${appointment.id}`}
        onMouseDown={(event) => onResizeStart(event, appointment.id, dayIndex)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        className="absolute inset-x-0 bottom-0 flex h-2 cursor-row-resize items-center justify-center bg-black/15 opacity-0 transition-opacity hover:bg-black/25 group-hover:opacity-100"
        aria-label={`Redimensionner ${appointment.patient.firstName} ${appointment.patient.lastName}`}
      >
        <span className="h-1 w-10 rounded-full bg-white/90" />
      </button>
    </div>
  )
}
