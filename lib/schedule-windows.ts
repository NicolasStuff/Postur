import { addDays, format, isBefore, isEqual } from 'date-fns'
import { parseOpeningHours, getDayKeyForParisDate, type OpeningHoursConfig } from '@/lib/booking'

export interface ScheduleWindow {
  startTime: string
  endTime: string
  type: 'regular' | 'exception'
  exceptionId?: string
  exceptionType?: 'ADDED' | 'BLOCKED'
}

export interface DaySchedule {
  date: string
  windows: ScheduleWindow[]
}

interface BlockedException {
  startTime: string | null
  endTime: string | null
}

export function trimWindowByBlocked(
  windowStart: string,
  windowEnd: string,
  blocked: BlockedException[],
): Array<{ start: string; end: string }> {
  let segments = [{ start: windowStart, end: windowEnd }]

  for (const exc of blocked) {
    if (!exc.startTime || !exc.endTime) continue
    const bStart = exc.startTime
    const bEnd = exc.endTime

    const next: Array<{ start: string; end: string }> = []
    for (const seg of segments) {
      if (seg.end <= bStart || seg.start >= bEnd) {
        next.push(seg)
      } else {
        if (seg.start < bStart) {
          next.push({ start: seg.start, end: bStart })
        }
        if (seg.end > bEnd) {
          next.push({ start: bEnd, end: seg.end })
        }
      }
    }
    segments = next
  }

  return segments
}

export function computeWeekSchedule(params: {
  openingHours: OpeningHoursConfig
  exceptions: Array<{
    id: string
    date: Date
    type: 'ADDED' | 'BLOCKED'
    startTime: string | null
    endTime: string | null
  }>
  startDate: string
  endDate: string
}): DaySchedule[] {
  const { openingHours, exceptions, startDate, endDate } = params
  const parsed = parseOpeningHours(openingHours)

  const rangeStart = new Date(startDate + 'T00:00:00')
  const rangeEnd = new Date(endDate + 'T00:00:00')

  const result: DaySchedule[] = []

  let current = rangeStart
  while (isBefore(current, rangeEnd) || isEqual(current, rangeEnd)) {
    const dateStr = format(current, 'yyyy-MM-dd')
    const dayKey = getDayKeyForParisDate(dateStr)

    const dayExceptions = exceptions.filter(
      (e) => format(e.date, 'yyyy-MM-dd') === dateStr,
    )
    const blockedExceptions = dayExceptions.filter((e) => e.type === 'BLOCKED')
    const addedExceptions = dayExceptions.filter((e) => e.type === 'ADDED')

    const isFullDayBlocked = blockedExceptions.some((e) => !e.startTime && !e.endTime)

    const windows: ScheduleWindow[] = []

    if (!isFullDayBlocked && dayKey) {
      const dayRanges = parsed[dayKey] ?? []

      for (const range of dayRanges) {
        const [rangeStartTime, rangeEndTime] = range.split('-')
        if (!rangeStartTime || !rangeEndTime) continue

        const trimmed = trimWindowByBlocked(rangeStartTime, rangeEndTime, blockedExceptions)
        for (const w of trimmed) {
          windows.push({
            startTime: w.start,
            endTime: w.end,
            type: 'regular',
          })
        }
      }
    }

    for (const exc of addedExceptions) {
      if (exc.startTime && exc.endTime) {
        windows.push({
          startTime: exc.startTime,
          endTime: exc.endTime,
          type: 'exception',
          exceptionId: exc.id,
          exceptionType: 'ADDED',
        })
      }
    }

    for (const exc of blockedExceptions) {
      if (exc.startTime && exc.endTime) {
        windows.push({
          startTime: exc.startTime,
          endTime: exc.endTime,
          type: 'exception',
          exceptionId: exc.id,
          exceptionType: 'BLOCKED',
        })
      }
    }

    windows.sort((a, b) => a.startTime.localeCompare(b.startTime))

    result.push({ date: dateStr, windows })
    current = addDays(current, 1)
  }

  return result
}
