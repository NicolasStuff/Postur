import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BOOKING_TIMEZONE } from '@/lib/booking'
import type { CalendarAppointment } from './types'
import { getDurationMinutes } from './types'

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

function getCardPosition(anchorRect: DOMRect): React.CSSProperties {
  if (typeof window === 'undefined') return { position: 'fixed', left: 8, top: 8, width: 320 }

  const cardWidth = 320
  const estimatedHeight = 280
  const margin = 10

  let left = anchorRect.right + margin
  if (left + cardWidth > window.innerWidth - margin) {
    left = anchorRect.left - cardWidth - margin
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin))

  let top = anchorRect.top
  if (top + estimatedHeight > window.innerHeight - margin) {
    top = window.innerHeight - estimatedHeight - margin
  }
  top = Math.max(margin, top)

  return {
    position: 'fixed',
    left,
    top,
    width: cardWidth,
  }
}

interface AppointmentHoverCardProps {
  appointment: CalendarAppointment
  anchorRect: DOMRect
}

export default function AppointmentHoverCard({ appointment, anchorRect }: AppointmentHoverCardProps) {
  const parisStart = new TZDate(appointment.start.getTime(), BOOKING_TIMEZONE)
  const dateLabel = format(parisStart, "EEEE d MMM yyyy 'à' HH:mm", { locale: fr })
  const durationMinutes = getDurationMinutes(appointment.start, appointment.end)

  return (
    <div
      className="z-40 rounded-xl border border-gray-200 bg-white p-3 shadow-xl pointer-events-none"
      style={getCardPosition(anchorRect)}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {appointment.patient.firstName} {appointment.patient.lastName}
          </p>
          <p className="truncate text-xs text-gray-600">{appointment.service.name}</p>
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-700">
        <p><span className="font-medium text-gray-900">Date:</span> <span className="capitalize">{dateLabel}</span></p>
        <p><span className="font-medium text-gray-900">Durée:</span> {formatDuration(durationMinutes)}</p>
        {appointment.patient.phone && (
          <p><span className="font-medium text-gray-900">Téléphone:</span> {appointment.patient.phone}</p>
        )}
        {appointment.patient.email && (
          <p className="truncate"><span className="font-medium text-gray-900">Email:</span> {appointment.patient.email}</p>
        )}
      </div>

      {appointment.notes && (
        <div className="mt-2 rounded-md bg-gray-50 p-2">
          <p className="mb-0.5 text-[11px] font-medium text-gray-700">Notes</p>
          <p className="line-clamp-3 text-[11px] text-gray-600">{appointment.notes}</p>
        </div>
      )}
    </div>
  )
}
