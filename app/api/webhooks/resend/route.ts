import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { Resend } from "resend"

import { prisma } from "@/lib/prisma"
import {
  findNotificationByProviderMessageId,
  mapResendEventToNotificationStatus,
  recordNotificationEvent,
  transitionNotificationStatus,
} from "@/lib/notifications/notification-tracking.service"

type ResendWebhookEvent = {
  type: string
  created_at?: string
  data?: {
    email_id?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook Resend non configure" },
      { status: 503 },
    )
  }

  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    )
  }

  const rawBody = await request.text()

  let event: ResendWebhookEvent
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    }) as unknown as ResendWebhookEvent
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    )
  }

  const providerMessageId = event.data?.email_id
  if (!providerMessageId) {
    return NextResponse.json(
      { ok: true, ignored: "missing-email-id" },
      { status: 202 },
    )
  }

  const notification = await findNotificationByProviderMessageId(prisma, {
    provider: "RESEND",
    providerMessageId,
  })

  if (!notification) {
    return NextResponse.json(
      { ok: true, ignored: "notification-not-found" },
      { status: 202 },
    )
  }

  const dedupeKey = `resend:${svixId}`
  const mappedStatus = mapResendEventToNotificationStatus(event.type)

  const created = await prisma.$transaction(async (tx) => {
    const eventWrite = await recordNotificationEvent(tx, {
      notificationId: notification.id,
      source: "RESEND",
      externalEventType: event.type,
      externalStatus: event.type,
      dedupeKey,
      payload: event as unknown as Prisma.InputJsonValue,
      receivedAt: event.created_at ? new Date(event.created_at) : new Date(),
    })

    if (!eventWrite.created) {
      return false
    }

    if (mappedStatus) {
      await transitionNotificationStatus(tx, {
        notificationId: notification.id,
        nextStatus: mappedStatus,
        providerStatus: event.type,
        providerMessageId,
        eventAt: event.created_at ? new Date(event.created_at) : new Date(),
      })
    }

    return true
  })

  return NextResponse.json({ ok: true, deduplicated: !created })
}
