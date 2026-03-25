import type { AppointmentStatus } from '@prisma/client'
import type { DaySchedule, ScheduleWindow } from '@/lib/schedule-windows'

export type { DaySchedule, ScheduleWindow }

export type CalendarAppointment = {
  id: string
  start: Date
  end: Date
  status: AppointmentStatus
  notes: string | null
  patient: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null }
  service: { id: string; name: string; duration: number; price: number }
}

export function getDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000)
}

export interface DragSelection {
  dayIndex: number
  anchorSlot: number
  currentSlot: number
  selectionType: 'ADDED' | 'BLOCKED'
}

export interface FinalSelection {
  dayIndex: number
  startSlot: number
  endSlot: number
  selectionType: 'ADDED' | 'BLOCKED'
}

export interface PendingClosedDrop {
  appointmentId: string
  dayIndex: number
  slot: number
}

export interface AppointmentResizeState {
  appointmentId: string
  dayIndex: number
  startSlot: number
  initialDurationSlots: number
  currentDurationSlots: number
}

export type EventDragPayload =
  | {
      kind: 'appointment'
      appointmentId: string
      durationSlots: number
    }
  | {
      kind: 'exception'
      id: string
      exceptionType: 'ADDED' | 'BLOCKED'
      durationSlots: number
    }

export type AppointmentUpdatePayload = {
  id: string
  startTime?: string
  durationMinutes?: number
}

export interface WeekCalendarProps {
  appointments: CalendarAppointment[]
  currentDate: Date
  scheduleWindows?: DaySchedule[]
  exceptionMode: boolean
  exceptionType?: 'ADDED' | 'BLOCKED'
  onExceptionModeChange: (active: boolean) => void
}

export interface ExceptionEvent {
  id: string
  dayIndex: number
  startSlot: number
  durationSlots: number
  exceptionType: 'ADDED' | 'BLOCKED'
}

export const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)
export const FIRST_HOUR = HOURS[0]!
export const SLOTS_PER_HOUR = 4
export const SLOT_MINUTES = 15
export const TOTAL_SLOTS = HOURS.length * SLOTS_PER_HOUR
export const SLOT_HEIGHT_PX = 20

export const CALENDAR_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PLANNED:
    'bg-amber-500 text-slate-950 border border-amber-700 shadow-[inset_3px_0_0_0_rgb(146_64_14)]',
  CONFIRMED:
    'bg-blue-600 text-white border border-blue-800 shadow-[inset_3px_0_0_0_rgb(30_64_175)]',
  COMPLETED:
    'bg-emerald-600 text-white border border-emerald-800 shadow-[inset_3px_0_0_0_rgb(6_95_70)]',
  CANCELED:
    'bg-red-600 text-white border border-red-800 shadow-[inset_3px_0_0_0_rgb(153_27_27)]',
  NOSHOW:
    'bg-fuchsia-700 text-white border border-fuchsia-900 shadow-[inset_3px_0_0_0_rgb(112_26_117)]',
}
