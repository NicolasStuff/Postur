import type { NotificationKind } from "@prisma/client"

export type ReminderLevel = "J3" | "J2" | "J1" | "H1"

export interface ReminderConfig {
  level: ReminderLevel
  fromHours?: number
  toHours?: number
  fromMinutes?: number
  toMinutes?: number
  field:
    | "reminderJ3SentAt"
    | "reminderJ2SentAt"
    | "reminderJ1SentAt"
    | "reminderH1SentAt"
}

export const REMINDER_LEVELS: ReminderConfig[] = [
  { level: "J3", fromHours: 71, toHours: 73, field: "reminderJ3SentAt" },
  { level: "J2", fromHours: 47, toHours: 49, field: "reminderJ2SentAt" },
  { level: "J1", fromHours: 23, toHours: 25, field: "reminderJ1SentAt" },
  { level: "H1", fromMinutes: 0, toMinutes: 90, field: "reminderH1SentAt" },
]

export const REMINDER_KIND_BY_LEVEL: Record<ReminderLevel, NotificationKind> = {
  J3: "REMINDER_J3",
  J2: "REMINDER_J2",
  J1: "REMINDER_J1",
  H1: "REMINDER_H1",
}
