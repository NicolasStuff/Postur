import { addHours, addMinutes } from "date-fns"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { notifyBookingReminder } from "@/lib/notifications/notification.service"
import { REMINDER_LEVELS } from "@/lib/notifications/types"

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    )
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const results: Record<string, number> = {}

  for (const config of REMINDER_LEVELS) {
    const from =
      config.fromHours != null
        ? addHours(now, config.fromHours)
        : addMinutes(now, config.fromMinutes!)
    const to =
      config.toHours != null
        ? addHours(now, config.toHours)
        : addMinutes(now, config.toMinutes!)

    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["PLANNED", "CONFIRMED"] },
        start: { gte: from, lte: to },
        [config.field]: null,
      },
      include: {
        patient: true,
        service: true,
        user: true,
      },
    })

    let sent = 0

    for (const appointment of appointments) {
      try {
        const result = await notifyBookingReminder(appointment, config.level)

        if (result.emailSent || result.smsSent) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { [config.field]: new Date() },
          })
          sent++
        } else {
          console.error(
            `All channels failed for ${config.level} reminder, appointment ${appointment.id}`,
          )
        }
      } catch (error) {
        console.error(
          `Error sending ${config.level} reminder for appointment ${appointment.id}:`,
          error,
        )
      }
    }

    results[config.level] = sent
  }

  return NextResponse.json({ ok: true, results })
}
