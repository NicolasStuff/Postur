"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { BOOKING_TIMEZONE } from '@/lib/booking'
import { updateAppointment } from '@/app/actions/appointments'
import {
  createScheduleException,
  updateScheduleException,
  deleteScheduleException,
} from '@/app/actions/schedule-exceptions'
import DroppableSlot from './DroppableSlot'
import DraggableAppointment from './DraggableAppointment'
import DraggableException from './DraggableException'
import CalendarDragOverlay from './CalendarDragOverlay'
import ExceptionPopup from './ExceptionPopup'
import ClosedSlotConfirmModal from './ClosedSlotConfirmModal'
import AppointmentHoverCard from './AppointmentHoverCard'
import AppointmentDurationModal from './AppointmentDurationModal'
import AppointmentConflictConfirmModal from './AppointmentConflictConfirmModal'
import type {
  CalendarAppointment,
  WeekCalendarProps,
  DragSelection,
  FinalSelection,
  PendingClosedDrop,
  AppointmentResizeState,
  EventDragPayload,
  AppointmentUpdatePayload,
  ExceptionEvent,
  ScheduleWindow,
} from './types'
import { getDurationMinutes, FIRST_HOUR, SLOT_HEIGHT_PX, SLOT_MINUTES, SLOTS_PER_HOUR, TOTAL_SLOTS } from './types'
import {
  clientYToSlot,
  slotToTime,
  timeToSlot,
  formatHM,
  getSelectionRange,
  getSlotWindow,
  isSlotOpen,
  durationToSlots,
  timeDiffToSlots,
  isConflictError,
  getErrorMessage,
  parseTimeString,
} from './utils'

const tz = BOOKING_TIMEZONE

export default function WeekCalendar({
  appointments,
  currentDate,
  scheduleWindows,
  exceptionMode,
  exceptionType = 'ADDED',
  onExceptionModeChange,
}: WeekCalendarProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const parisNow = new TZDate(Date.now(), tz)

  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null)
  const [finalSelection, setFinalSelection] = useState<FinalSelection | null>(null)
  const [reason, setReason] = useState('')
  const [pendingClosedDrop, setPendingClosedDrop] = useState<PendingClosedDrop | null>(null)
  const [hoverState, setHoverState] = useState<{ appointment: CalendarAppointment; rect: DOMRect } | null>(null)
  const [durationEditor, setDurationEditor] = useState<{
    appointmentId: string
    durationMinutes: number
  } | null>(null)
  const [resizeState, setResizeState] = useState<AppointmentResizeState | null>(null)
  const [pendingConflictUpdate, setPendingConflictUpdate] = useState<AppointmentUpdatePayload | null>(null)

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activePayload, setActivePayload] = useState<EventDragPayload | null>(null)
  const [overSlotData, setOverSlotData] = useState<{ dayIndex: number; slot: number } | null>(null)

  const isSelecting = useRef(false)
  const justResizedRef = useRef(false)
  const dayColumnRefs = useRef<Array<HTMLDivElement | null>>([])

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  const sensors = useSensors(pointerSensor)

  const queryClient = useQueryClient()

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    void queryClient.invalidateQueries({ queryKey: ['weekSchedule'] })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteScheduleException,
    onSuccess: invalidateAll,
    onError: (err: Error) => toast.error(err.message),
  })

  const createMutation = useMutation({
    mutationFn: createScheduleException,
    onSuccess: () => {
      invalidateAll()
      setFinalSelection(null)
      setReason('')
      if (exceptionMode) onExceptionModeChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateExceptionMutation = useMutation({
    mutationFn: updateScheduleException,
    onSuccess: invalidateAll,
    onError: (err: Error) => toast.error(err.message),
  })

  const updateAppointmentMutation = useMutation({
    mutationFn: updateAppointment,
  })

  const resetSelection = useCallback(() => {
    setDragSelection(null)
    setFinalSelection(null)
    setReason('')
    isSelecting.current = false
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isSelecting.current || !dragSelection) return

      isSelecting.current = false
      const { startSlot, endSlot } = getSelectionRange(dragSelection)
      setFinalSelection({
        dayIndex: dragSelection.dayIndex,
        startSlot,
        endSlot,
        selectionType: dragSelection.selectionType,
      })
      setDragSelection(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (pendingConflictUpdate) {
        setPendingConflictUpdate(null)
        return
      }

      if (durationEditor) {
        setDurationEditor(null)
        return
      }

      if (resizeState) {
        setResizeState(null)
        return
      }

      if (pendingClosedDrop) {
        setPendingClosedDrop(null)
        return
      }

      if (dragSelection || finalSelection) {
        resetSelection()
        if (exceptionMode) onExceptionModeChange(false)
        return
      }

      if (exceptionMode) onExceptionModeChange(false)
    }

    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    dragSelection,
    durationEditor,
    exceptionMode,
    finalSelection,
    onExceptionModeChange,
    pendingClosedDrop,
    pendingConflictUpdate,
    resizeState,
    resetSelection,
  ])

  const windowsByDay = useMemo(() => {
    const map = new Map<string, ScheduleWindow[]>()
    if (!scheduleWindows) return map

    for (const daySchedule of scheduleWindows) {
      map.set(daySchedule.date, daySchedule.windows)
    }
    return map
  }, [scheduleWindows])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>()

    for (const day of weekDays) {
      const parisDay = new TZDate(day.getTime(), tz)
      map.set(format(parisDay, 'yyyy-MM-dd'), [])
    }

    for (const appointment of appointments) {
      const start = new TZDate(appointment.start.getTime(), tz)
      const key = format(start, 'yyyy-MM-dd')
      const dayAppointments = map.get(key)
      if (!dayAppointments) continue

      dayAppointments.push(appointment)
    }

    return map
  }, [appointments, weekDays])

  const appointmentsById = useMemo(() => {
    const map = new Map<string, CalendarAppointment>()
    for (const appointment of appointments) {
      map.set(appointment.id, appointment)
    }
    return map
  }, [appointments])

  const editedAppointment = durationEditor
    ? appointmentsById.get(durationEditor.appointmentId) ?? null
    : null

  const exceptionEvents = useMemo(() => {
    const events: ExceptionEvent[] = []

    weekDays.forEach((day, dayIndex) => {
      const parisDay = new TZDate(day.getTime(), tz)
      const dayStr = format(parisDay, 'yyyy-MM-dd')
      const dayWindows = windowsByDay.get(dayStr) ?? []

      for (const window of dayWindows) {
        if (window.type !== 'exception' || !window.exceptionId) continue

        const { hours: startHour, minutes: startMinute } = parseTimeString(window.startTime)
        const startSlot = timeToSlot(startHour, startMinute)
        const durationSlots = timeDiffToSlots(window.startTime, window.endTime)

        if (startSlot < 0 || startSlot >= TOTAL_SLOTS) continue

        events.push({
          id: window.exceptionId,
          dayIndex,
          startSlot,
          durationSlots,
          exceptionType: window.exceptionType === 'BLOCKED' ? 'BLOCKED' : 'ADDED',
        })
      }
    })

    return events
  }, [weekDays, windowsByDay])

  const resolveSelectionType = useCallback(
    (dayIndex: number, slot: number): 'ADDED' | 'BLOCKED' => {
      if (exceptionMode) return exceptionType

      const day = weekDays[dayIndex]
      if (!day) return 'ADDED'

      const parisDay = new TZDate(day.getTime(), tz)
      const dayStr = format(parisDay, 'yyyy-MM-dd')
      const dayWindows = windowsByDay.get(dayStr) ?? []
      const { hour, minute } = slotToTime(slot)

      return isSlotOpen(hour, minute, dayWindows) ? 'BLOCKED' : 'ADDED'
    },
    [exceptionMode, exceptionType, weekDays, windowsByDay],
  )

  const handleSlotMouseDown = (event: React.MouseEvent<HTMLDivElement>, dayIndex: number, slot: number) => {
    if (event.button !== 0) return
    if (activeDragId) return

    setPendingClosedDrop(null)
    setFinalSelection(null)

    const selectionType = resolveSelectionType(dayIndex, slot)

    isSelecting.current = true
    setDragSelection({ dayIndex, anchorSlot: slot, currentSlot: slot, selectionType })
  }

  const handleSlotMouseEnter = (dayIndex: number, slot: number) => {
    if (!isSelecting.current || !dragSelection || dragSelection.dayIndex !== dayIndex) return
    setDragSelection((prev) => (prev ? { ...prev, currentSlot: slot } : null))
  }

  const slotTouchesClosedTime = useCallback(
    (dayIndex: number, startSlot: number, durationSlots: number): boolean => {
      const day = weekDays[dayIndex]
      if (!day) return true

      const parisDay = new TZDate(day.getTime(), tz)
      const dayStr = format(parisDay, 'yyyy-MM-dd')
      const dayWindows = windowsByDay.get(dayStr) ?? []

      for (let cursor = 0; cursor < durationSlots; cursor += 1) {
        const slot = startSlot + cursor
        if (slot >= TOTAL_SLOTS) return true

        const { hour, minute } = slotToTime(slot)
        if (!isSlotOpen(hour, minute, dayWindows)) return true
      }

      return false
    },
    [weekDays, windowsByDay],
  )

  const buildStartTimeIso = useCallback((dayIndex: number, slot: number) => {
    const day = weekDays[dayIndex]
    if (!day) return null

    const parisDay = new TZDate(day.getTime(), tz)
    const dateStr = format(parisDay, 'yyyy-MM-dd')
    const [year, month, dayOfMonth] = dateStr.split('-').map(Number)

    const { hour, minute } = slotToTime(slot)
    return new TZDate(year!, month! - 1, dayOfMonth!, hour, minute, 0, tz).toISOString()
  }, [weekDays])

  const submitAppointmentUpdate = useCallback(async (
    payload: AppointmentUpdatePayload,
    forceOverlap = false,
  ) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        ...payload,
        ...(forceOverlap ? { forceOverlap: true } : {}),
      })
      await queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setPendingConflictUpdate(null)
      if (payload.durationMinutes !== undefined) {
        setDurationEditor(null)
      }
    } catch (error) {
      if (isConflictError(error) && !forceOverlap) {
        setPendingConflictUpdate(payload)
        return
      }
      toast.error(getErrorMessage(error))
    }
  }, [updateAppointmentMutation, queryClient])

  const openDurationEditor = useCallback((appointmentId: string) => {
    if (justResizedRef.current) return

    const appointment = appointmentsById.get(appointmentId)
    if (!appointment) return

    setDurationEditor({
      appointmentId,
      durationMinutes: getDurationMinutes(appointment.start, appointment.end),
    })
  }, [appointmentsById])

  const handleResizeStart = useCallback((event: React.MouseEvent<HTMLButtonElement>, appointmentId: string, dayIndex: number) => {
    event.preventDefault()
    event.stopPropagation()

    const appointment = appointmentsById.get(appointmentId)
    if (!appointment) return

    const start = new TZDate(appointment.start.getTime(), tz)
    const startSlot = timeToSlot(start.getHours(), start.getMinutes())
    const initialDurationSlots = durationToSlots(getDurationMinutes(appointment.start, appointment.end))

    setHoverState(null)
    setResizeState({
      appointmentId,
      dayIndex,
      startSlot,
      initialDurationSlots,
      currentDurationSlots: initialDurationSlots,
    })
  }, [appointmentsById])

  useEffect(() => {
    if (!resizeState) return

    const handleMouseMove = (event: MouseEvent) => {
      const columnEl = dayColumnRefs.current[resizeState.dayIndex]
      if (!columnEl) return

      const hoveredSlot = clientYToSlot(event.clientY, columnEl)
      const currentDurationSlots = Math.max(1, Math.min(hoveredSlot - resizeState.startSlot + 1, TOTAL_SLOTS - resizeState.startSlot))

      setResizeState((current) => {
        if (!current) return current
        if (current.currentDurationSlots === currentDurationSlots) return current
        return { ...current, currentDurationSlots }
      })
    }

    const handleMouseUp = () => {
      const appointment = appointmentsById.get(resizeState.appointmentId)
      if (!appointment) {
        setResizeState(null)
        return
      }

      const nextDurationMinutes = resizeState.currentDurationSlots * SLOT_MINUTES
      setResizeState(null)

      justResizedRef.current = true
      requestAnimationFrame(() => { justResizedRef.current = false })

      if (resizeState.currentDurationSlots === resizeState.initialDurationSlots) {
        return
      }

      void submitAppointmentUpdate({
        id: appointment.id,
        durationMinutes: nextDurationMinutes,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [appointmentsById, resizeState, submitAppointmentUpdate])

  const handleDurationConfirm = useCallback(() => {
    if (!durationEditor || !editedAppointment) return
    if (!Number.isFinite(durationEditor.durationMinutes) || durationEditor.durationMinutes < 5 || durationEditor.durationMinutes > 480) {
      toast.error('La durée doit être comprise entre 5 et 480 minutes')
      return
    }
    const currentDuration = getDurationMinutes(editedAppointment.start, editedAppointment.end)
    if (durationEditor.durationMinutes === currentDuration) {
      setDurationEditor(null)
      return
    }
    void submitAppointmentUpdate({
      id: editedAppointment.id,
      durationMinutes: durationEditor.durationMinutes,
    })
  }, [durationEditor, editedAppointment, submitAppointmentUpdate])

  const runAppointmentMove = useCallback(
    (appointmentId: string, dayIndex: number, slot: number) => {
      const appointment = appointmentsById.get(appointmentId)
      if (!appointment) return

      const dSlots = durationToSlots(getDurationMinutes(appointment.start, appointment.end))
      if (slot + dSlots > TOTAL_SLOTS) {
        toast.error('Impossible de deplacer ce rendez-vous au-dela de la fin de journee')
        return
      }

      const nextStartIso = buildStartTimeIso(dayIndex, slot)
      if (!nextStartIso) return

      const currentStart = new TZDate(appointment.start.getTime(), tz)
      const currentDay = format(currentStart, 'yyyy-MM-dd')
      const currentSlot = timeToSlot(currentStart.getHours(), currentStart.getMinutes())
      const targetDay = format(new TZDate(weekDays[dayIndex]!.getTime(), tz), 'yyyy-MM-dd')

      if (currentDay === targetDay && currentSlot === slot) return

      void submitAppointmentUpdate({
        id: appointment.id,
        startTime: nextStartIso,
      })
    },
    [appointmentsById, buildStartTimeIso, submitAppointmentUpdate, weekDays],
  )

  const runExceptionMove = useCallback(
    (payload: Extract<EventDragPayload, { kind: 'exception' }>, dayIndex: number, slot: number) => {
      const day = weekDays[dayIndex]
      if (!day) return

      if (slot + payload.durationSlots > TOTAL_SLOTS) {
        toast.error('Impossible de deplacer cette exception au-dela de la fin de journee')
        return
      }

      const start = slotToTime(slot)
      const end = slotToTime(slot + payload.durationSlots)
      const parisDay = new TZDate(day.getTime(), tz)

      updateExceptionMutation.mutate({
        id: payload.id,
        date: format(parisDay, 'yyyy-MM-dd'),
        startTime: formatHM(start.hour, start.minute),
        endTime: formatHM(end.hour, end.minute),
      })
    },
    [updateExceptionMutation, weekDays],
  )

  const handleConfirmClosedDrop = () => {
    if (!pendingClosedDrop) return
    runAppointmentMove(pendingClosedDrop.appointmentId, pendingClosedDrop.dayIndex, pendingClosedDrop.slot)
    setPendingClosedDrop(null)
  }

  const handleConfirmException = () => {
    if (!finalSelection) return
    const day = weekDays[finalSelection.dayIndex]
    if (!day) return

    const start = slotToTime(finalSelection.startSlot)
    const end = slotToTime(finalSelection.endSlot + 1)
    const parisDay = new TZDate(day.getTime(), tz)

    createMutation.mutate({
      date: format(parisDay, 'yyyy-MM-dd'),
      type: finalSelection.selectionType,
      startTime: formatHM(start.hour, start.minute),
      endTime: formatHM(end.hour, end.minute),
      reason: reason || undefined,
    })
  }

  const isSlotSelected = (dayIndex: number, slot: number): { selected: boolean; type: 'ADDED' | 'BLOCKED' } => {
    if (dragSelection && dragSelection.dayIndex === dayIndex) {
      const { startSlot, endSlot } = getSelectionRange(dragSelection)
      if (slot >= startSlot && slot <= endSlot) {
        return { selected: true, type: dragSelection.selectionType }
      }
    }

    if (finalSelection && finalSelection.dayIndex === dayIndex) {
      if (slot >= finalSelection.startSlot && slot <= finalSelection.endSlot) {
        return { selected: true, type: finalSelection.selectionType }
      }
    }

    return { selected: false, type: 'ADDED' }
  }

  const isDropPreviewSlot = (dayIndex: number, slot: number): boolean => {
    if (!activePayload || !overSlotData || overSlotData.dayIndex !== dayIndex) return false
    return slot >= overSlotData.slot && slot < overSlotData.slot + activePayload.durationSlots
  }

  const disableHoverCard = Boolean(activeDragId || dragSelection || pendingClosedDrop || resizeState)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as EventDragPayload | undefined
    if (!data) return
    setActiveDragId(String(event.active.id))
    setActivePayload(data)
    setHoverState(null)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overData = event.over?.data.current as { dayIndex: number; slot: number } | undefined
    setOverSlotData(overData ?? null)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const payload = event.active.data.current as EventDragPayload | undefined
    const overData = event.over?.data.current as { dayIndex: number; slot: number } | undefined

    setActiveDragId(null)
    setActivePayload(null)
    setOverSlotData(null)

    if (!payload || !overData) return

    const { dayIndex, slot } = overData

    if (payload.kind === 'appointment') {
      if (slotTouchesClosedTime(dayIndex, slot, payload.durationSlots)) {
        setPendingClosedDrop({ appointmentId: payload.appointmentId, dayIndex, slot })
      } else {
        runAppointmentMove(payload.appointmentId, dayIndex, slot)
      }
    } else {
      runExceptionMove(payload, dayIndex, slot)
    }
  }, [slotTouchesClosedTime, runAppointmentMove, runExceptionMove])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
    setActivePayload(null)
    setOverSlotData(null)
  }, [])

  const activeAppointment = activePayload?.kind === 'appointment'
    ? appointmentsById.get(activePayload.appointmentId) ?? null
    : null

  const activeException = activePayload?.kind === 'exception'
    ? exceptionEvents.find((e) => e.id === activePayload.id) ?? null
    : null

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="select-none overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-2 text-center text-xs text-gray-400" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`border-l border-gray-200 p-2 text-center ${isSameDay(day, parisNow) ? 'bg-blue-50' : ''}`}
              >
                <div className="text-xs uppercase text-gray-500">{format(day, 'EEE', { locale: fr })}</div>
                <div className={`text-sm font-medium ${isSameDay(day, parisNow) ? 'text-blue-600' : 'text-primary'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            <div>
              {Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
                <div
                  key={`time-${slot}`}
                  className="border-b border-gray-100 pr-2 text-right text-xs text-gray-400"
                  style={{ height: SLOT_HEIGHT_PX }}
                >
                  {slot % SLOTS_PER_HOUR === 0 ? `${FIRST_HOUR + slot / SLOTS_PER_HOUR}h` : ''}
                </div>
              ))}
            </div>

            {weekDays.map((day, dayIndex) => {
              const parisDay = new TZDate(day.getTime(), tz)
              const dayStr = format(parisDay, 'yyyy-MM-dd')
              const dayWindows = windowsByDay.get(dayStr) ?? []
              const dayAppointments = appointmentsByDay.get(dayStr) ?? []
              const dayExceptions = exceptionEvents.filter((event) => event.dayIndex === dayIndex)

              return (
                <div
                  key={dayStr}
                  data-testid={`day-column-${dayIndex}`}
                  className="relative border-l border-gray-200"
                  style={{ height: TOTAL_SLOTS * SLOT_HEIGHT_PX }}
                  ref={(node) => { dayColumnRefs.current[dayIndex] = node }}
                >
                  {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
                    const { hour, minute } = slotToTime(slot)
                    const slotWindow = getSlotWindow(hour, minute, dayWindows)
                    const { selected, type } = isSlotSelected(dayIndex, slot)

                    return (
                      <DroppableSlot
                        key={`${dayStr}-${slot}`}
                        dayIndex={dayIndex}
                        slot={slot}
                        window={slotWindow}
                        isSelected={selected}
                        selectionType={type}
                        isDropPreview={isDropPreviewSlot(dayIndex, slot)}
                        isDndActive={Boolean(activeDragId)}
                        isHourStart={slot % SLOTS_PER_HOUR === 0}
                        onMouseDown={handleSlotMouseDown}
                        onMouseEnter={handleSlotMouseEnter}
                      />
                    )
                  })}

                  {dayExceptions.map((event) => (
                    <DraggableException
                      key={event.id}
                      event={event}
                      isDndActive={Boolean(activeDragId)}
                      onDelete={(id) => deleteMutation.mutate({ id })}
                    />
                  ))}

                  {dayAppointments.map((appointment) => {
                    const start = new TZDate(appointment.start.getTime(), tz)
                    const startSlot = timeToSlot(start.getHours(), start.getMinutes())

                    if (startSlot < 0 || startSlot >= TOTAL_SLOTS) return null

                    return (
                      <DraggableAppointment
                        key={appointment.id}
                        appointment={appointment}
                        dayIndex={dayIndex}
                        isDndActive={Boolean(activeDragId)}
                        onClickAppointment={openDurationEditor}
                        onResizeStart={handleResizeStart}
                        previewDurationSlots={
                          resizeState?.appointmentId === appointment.id
                            ? resizeState.currentDurationSlots
                            : undefined
                        }
                        isResizing={resizeState?.appointmentId === appointment.id}
                        onMouseEnter={(appt, rect) => {
                          if (disableHoverCard) return
                          setHoverState({ appointment: appt, rect })
                        }}
                        onMouseLeave={(id) => {
                          setHoverState((prev) => (prev?.appointment.id === id ? null : prev))
                        }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>

          {finalSelection && (
            <ExceptionPopup
              selection={finalSelection}
              weekDays={weekDays}
              reason={reason}
              onReasonChange={setReason}
              onConfirm={handleConfirmException}
              onCancel={resetSelection}
              isPending={createMutation.isPending}
              exceptionType={finalSelection.selectionType}
            />
          )}

          <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 px-4 py-3 text-[10px] text-gray-600">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm border border-emerald-700 bg-emerald-500" />
              Ouvert
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm border border-cyan-800 bg-cyan-500" />
              Ouverture exceptionnelle
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm border border-orange-700 bg-orange-500" />
              Fermeture exceptionnelle
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" />
              Ferme
            </span>
            <span className="ml-auto text-[10px] font-medium text-fuchsia-700">
              Astuce: faites glisser la poignée basse d&apos;un rendez-vous pour ajuster sa durée par 15 min.
            </span>
          </div>
        </div>

        <CalendarDragOverlay
          activePayload={activePayload}
          appointment={activeAppointment}
          exception={activeException}
        />
      </DndContext>

      {hoverState && !disableHoverCard && (
        <AppointmentHoverCard appointment={hoverState.appointment} anchorRect={hoverState.rect} />
      )}

      <ClosedSlotConfirmModal
        open={Boolean(pendingClosedDrop)}
        onOpenChange={(open) => {
          if (!open) setPendingClosedDrop(null)
        }}
        onConfirm={handleConfirmClosedDrop}
        isPending={updateAppointmentMutation.isPending}
      />

      {editedAppointment && durationEditor && (
        <AppointmentDurationModal
          open
          onOpenChange={(open) => {
            if (!open) setDurationEditor(null)
          }}
          patientName={`${editedAppointment.patient.firstName} ${editedAppointment.patient.lastName}`}
          serviceName={editedAppointment.service.name}
          appointmentId={editedAppointment.id}
          value={durationEditor.durationMinutes}
          onValueChange={(value) =>
            setDurationEditor((current) => (current ? { ...current, durationMinutes: value } : current))
          }
          onConfirm={handleDurationConfirm}
          isPending={updateAppointmentMutation.isPending}
        />
      )}

      <AppointmentConflictConfirmModal
        open={Boolean(pendingConflictUpdate)}
        onOpenChange={(open) => {
          if (!open) setPendingConflictUpdate(null)
        }}
        onConfirm={() => {
          if (!pendingConflictUpdate) return
          void submitAppointmentUpdate(pendingConflictUpdate, true)
        }}
        isPending={updateAppointmentMutation.isPending}
      />
    </>
  )
}
