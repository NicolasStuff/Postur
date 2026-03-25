import { DragOverlay } from '@dnd-kit/core'
import type { CalendarAppointment, EventDragPayload, ExceptionEvent } from './types'
import { CALENDAR_STATUS_COLORS, SLOT_HEIGHT_PX } from './types'

interface CalendarDragOverlayProps {
  activePayload: EventDragPayload | null
  appointment: CalendarAppointment | null
  exception: ExceptionEvent | null
}

export default function CalendarDragOverlay({
  activePayload,
  appointment,
  exception,
}: CalendarDragOverlayProps) {
  if (!activePayload) return null

  if (activePayload.kind === 'appointment' && appointment) {
    const height = Math.max(22, activePayload.durationSlots * SLOT_HEIGHT_PX)

    return (
      <DragOverlay dropAnimation={null}>
        <div
          className={`w-[160px] overflow-hidden rounded-md px-1 py-0.5 text-xs shadow-lg ${CALENDAR_STATUS_COLORS[appointment.status]}`}
          style={{ height }}
        >
          <div className="truncate font-medium">
            {appointment.patient.firstName} {appointment.patient.lastName[0]}.
          </div>
          <div className="truncate opacity-75">{appointment.service.name}</div>
          <div className="truncate text-[10px] opacity-60">{appointment.status}</div>
        </div>
      </DragOverlay>
    )
  }

  if (activePayload.kind === 'exception' && exception) {
    const height = Math.max(SLOT_HEIGHT_PX, activePayload.durationSlots * SLOT_HEIGHT_PX)
    const isBlocked = exception.exceptionType === 'BLOCKED'

    return (
      <DragOverlay dropAnimation={null}>
        <div
          className={`w-[140px] overflow-hidden rounded border px-1 py-0.5 text-[10px] font-medium shadow-lg ${
            isBlocked
              ? 'border-orange-700 bg-orange-500 text-white'
              : 'border-cyan-800 bg-cyan-500 text-slate-950'
          }`}
          style={{ height }}
        >
          <span>{isBlocked ? 'Fermeture' : 'Ouverture'}</span>
        </div>
      </DragOverlay>
    )
  }

  return null
}
