import type { DragSelection, ScheduleWindow } from './types'
import { FIRST_HOUR, SLOT_HEIGHT_PX, SLOT_MINUTES, SLOTS_PER_HOUR, TOTAL_SLOTS } from './types'

export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number)
  return { hours: h!, minutes: m! }
}

export function slotToTime(slot: number): { hour: number; minute: number } {
  const hour = FIRST_HOUR + Math.floor(slot / SLOTS_PER_HOUR)
  const minute = (slot % SLOTS_PER_HOUR) * SLOT_MINUTES
  return { hour, minute }
}

export function timeToSlot(hour: number, minute: number): number {
  return (hour - FIRST_HOUR) * SLOTS_PER_HOUR + Math.floor(minute / SLOT_MINUTES)
}

export function formatHM(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export function getSelectionRange(sel: DragSelection): { startSlot: number; endSlot: number } {
  const startSlot = Math.min(sel.anchorSlot, sel.currentSlot)
  const endSlot = Math.max(sel.anchorSlot, sel.currentSlot)
  return { startSlot, endSlot }
}

export function getWindowsAtTime(hour: number, minute: number, windows: ScheduleWindow[]): ScheduleWindow[] {
  const timeStr = formatHM(hour, minute)
  return windows.filter((window) => timeStr >= window.startTime && timeStr < window.endTime)
}

export function getSlotWindow(hour: number, minute: number, windows: ScheduleWindow[]): ScheduleWindow | null {
  const matching = getWindowsAtTime(hour, minute, windows)
  if (matching.length === 0) return null

  const blocked = matching.find((window) => window.type === 'exception' && window.exceptionType === 'BLOCKED')
  if (blocked) return blocked

  const added = matching.find((window) => window.type === 'exception' && window.exceptionType === 'ADDED')
  if (added) return added

  return matching[0] ?? null
}

export function isSlotOpen(hour: number, minute: number, windows: ScheduleWindow[]): boolean {
  const matching = getWindowsAtTime(hour, minute, windows)
  if (matching.some((window) => window.type === 'exception' && window.exceptionType === 'BLOCKED')) {
    return false
  }

  return matching.some(
    (window) => window.type === 'regular' || (window.type === 'exception' && window.exceptionType === 'ADDED'),
  )
}

export function durationToSlots(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / SLOT_MINUTES))
}

export function timeDiffToSlots(start: string, end: string): number {
  const { hours: startHour, minutes: startMin } = parseTimeString(start)
  const { hours: endHour, minutes: endMin } = parseTimeString(end)
  const diffMinutes = endHour * 60 + endMin - (startHour * 60 + startMin)
  return Math.max(1, Math.ceil(diffMinutes / SLOT_MINUTES))
}

export function getSlotBg(
  window: ScheduleWindow | null,
  isSelection: boolean,
  selectionType: 'ADDED' | 'BLOCKED',
  inDropPreview: boolean,
): string {
  if (inDropPreview) return 'bg-fuchsia-500/35 ring-1 ring-inset ring-fuchsia-600'
  if (isSelection) return selectionType === 'BLOCKED' ? 'bg-orange-500/35 ring-1 ring-inset ring-orange-600' : 'bg-cyan-500/35 ring-1 ring-inset ring-cyan-600'
  if (!window) return ''
  if (window.type === 'exception') {
    if (window.exceptionType === 'BLOCKED') return 'bg-orange-500/30'
    return 'bg-cyan-500/30'
  }
  return 'bg-emerald-500/25'
}

export function isConflictError(error: unknown): boolean {
  if (error instanceof Error) return error.message.startsWith('CONFLICT:')
  return false
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Une erreur est survenue'
}

export function clientYToSlot(clientY: number, containerEl: HTMLElement): number {
  const rect = containerEl.getBoundingClientRect()
  const offsetY = clientY - rect.top
  const raw = Math.floor(offsetY / SLOT_HEIGHT_PX)
  return Math.max(0, Math.min(raw, TOTAL_SLOTS - 1))
}
