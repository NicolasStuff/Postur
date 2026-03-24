import { z } from "zod"

export const BOOKING_TIMEZONE = "Europe/Paris"
export const PUBLIC_BOOKING_SLOT_MINUTES = 30
export const INTERNAL_BOOKING_SLOT_MINUTES = 15
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type DayKey = (typeof DAY_KEYS)[number]
export type OpeningHoursConfig = Partial<Record<DayKey, string[]>>

export function isValidDateInput(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split("-").map(Number)
  const candidate = new Date(Date.UTC(year, month - 1, day))

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

export const publicBookingSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  serviceId: z.string().trim().min(1),
  date: z.string().regex(DATE_PATTERN).refine(isValidDateInput),
  time: z.string().regex(TIME_PATTERN),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(32),
})

export const internalAppointmentSchema = z.object({
  patientId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
  start: z.coerce.date(),
  notes: z.string().trim().max(2000).optional(),
})

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return (
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    ) - date.getTime()
  )
}

export function getParisDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
  const offset = getTimeZoneOffsetMs(utcGuess, BOOKING_TIMEZONE)
  return new Date(utcGuess.getTime() - offset)
}

export function getParisDate(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  return formatter.format(date)
}

export function getParisTime(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BOOKING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return formatter.format(date)
}

export function getDayKeyForParisDate(date: string): DayKey {
  const parisDate = getParisDateTime(date, "12:00")
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "short",
  }).format(parisDate)

  const map: Record<string, DayKey> = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  }

  return map[weekday]
}

export function parseOpeningHours(value: unknown): OpeningHoursConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const result: OpeningHoursConfig = {}

  for (const dayKey of DAY_KEYS) {
    const daySlots = (value as Record<string, unknown>)[dayKey]
    if (!Array.isArray(daySlots)) {
      continue
    }

    result[dayKey] = daySlots.filter((slot): slot is string => typeof slot === "string")
  }

  return result
}

export function parseTimeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value)
  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

export function isValidTimeStep(value: string, stepMinutes: number) {
  const minutes = parseTimeToMinutes(value)
  return minutes !== null && minutes % stepMinutes === 0
}

export function isFutureParisSlot(date: string, time: string, now = new Date()) {
  return getParisDateTime(date, time).getTime() > now.getTime()
}

export function isSlotInsideOpeningHours(input: {
  openingHours: OpeningHoursConfig
  date: string
  time: string
  durationMinutes: number
}) {
  const dayKey = getDayKeyForParisDate(input.date)
  const ranges = input.openingHours[dayKey] ?? []
  const startMinutes = parseTimeToMinutes(input.time)

  if (startMinutes === null) {
    return false
  }

  const endMinutes = startMinutes + input.durationMinutes

  return ranges.some((range) => {
    const [rangeStart, rangeEnd] = range.split("-")
    const rangeStartMinutes = parseTimeToMinutes(rangeStart)
    const rangeEndMinutes = parseTimeToMinutes(rangeEnd)

    if (rangeStartMinutes === null || rangeEndMinutes === null) {
      return false
    }

    return startMinutes >= rangeStartMinutes && endMinutes <= rangeEndMinutes
  })
}

export function isSlotAlignedToOpeningHours(input: {
  openingHours: OpeningHoursConfig
  date: string
  time: string
  stepMinutes: number
}) {
  const dayKey = getDayKeyForParisDate(input.date)
  const ranges = input.openingHours[dayKey] ?? []
  const startMinutes = parseTimeToMinutes(input.time)

  if (startMinutes === null) {
    return false
  }

  return ranges.some((range) => {
    const [rangeStart, rangeEnd] = range.split("-")
    const rangeStartMinutes = parseTimeToMinutes(rangeStart)
    const rangeEndMinutes = parseTimeToMinutes(rangeEnd)

    if (rangeStartMinutes === null || rangeEndMinutes === null) {
      return false
    }

    if (startMinutes < rangeStartMinutes || startMinutes > rangeEndMinutes) {
      return false
    }

    return (startMinutes - rangeStartMinutes) % input.stepMinutes === 0
  })
}

export function hasAppointmentOverlap(input: {
  start: Date
  end: Date
  appointments: Array<{ start: Date; end: Date }>
}) {
  return input.appointments.some((appointment) => {
    return input.start < appointment.end && input.end > appointment.start
  })
}

export function generateAvailableSlots(input: {
  openingHours: OpeningHoursConfig
  date: string
  serviceDurationMinutes: number
  stepMinutes: number
  appointments: Array<{ start: Date; end: Date }>
  now?: Date
}) {
  const dayKey = getDayKeyForParisDate(input.date)
  const ranges = input.openingHours[dayKey] ?? []
  const slots: string[] = []

  for (const range of ranges) {
    const [rangeStart, rangeEnd] = range.split("-")
    const rangeStartMinutes = parseTimeToMinutes(rangeStart)
    const rangeEndMinutes = parseTimeToMinutes(rangeEnd)

    if (rangeStartMinutes === null || rangeEndMinutes === null) {
      continue
    }

    for (
      let currentMinutes = rangeStartMinutes;
      currentMinutes + input.serviceDurationMinutes <= rangeEndMinutes;
      currentMinutes += input.stepMinutes
    ) {
      const time = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(
        currentMinutes % 60
      ).padStart(2, "0")}`

      if (!isFutureParisSlot(input.date, time, input.now)) {
        continue
      }

      const start = getParisDateTime(input.date, time)
      const end = new Date(start.getTime() + input.serviceDurationMinutes * 60_000)

      if (hasAppointmentOverlap({ start, end, appointments: input.appointments })) {
        continue
      }

      slots.push(time)
    }
  }

  return slots
}
