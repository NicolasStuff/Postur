import crypto from "crypto"
import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import {
  findNotificationByProviderMessageId,
  mapSmsmodeStatusToNotificationStatus,
  recordNotificationEvent,
  transitionNotificationStatus,
} from "@/lib/notifications/notification-tracking.service"

type SmsmodeWebhookStatusPayload = {
  messageId?: string
  message_id?: string
  status?:
    | {
        value?: string
        code?: string | number
        description?: string
      }
    | string
  error?: {
    code?: string | number
    message?: string
  }
  [key: string]: unknown
}

function getSmsmodeToken(request: Request): string | null {
  const headerToken = request.headers.get("x-webhook-token")
  if (headerToken) return headerToken

  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length)
  }

  const url = new URL(request.url)
  const queryToken = url.searchParams.get("token")
  if (queryToken) return queryToken

  return null
}

export async function POST(request: Request) {
  const webhookToken = process.env.SMSMODE_WEBHOOK_TOKEN
  if (!webhookToken) {
    return NextResponse.json(
      { error: "Webhook SMSMode non configure" },
      { status: 503 },
    )
  }

  const token = getSmsmodeToken(request)
  if (token !== webhookToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rawBody = await request.text()
  const dedupeKey = `smsmode:${crypto.createHash("sha256").update(rawBody).digest("hex")}`

  let payload: SmsmodeWebhookStatusPayload
  try {
    payload = JSON.parse(rawBody) as SmsmodeWebhookStatusPayload
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    )
  }

  const providerMessageId = payload.messageId ?? payload.message_id
  if (!providerMessageId) {
    return NextResponse.json(
      { ok: true, ignored: "missing-message-id" },
      { status: 202 },
    )
  }

  const notification = await findNotificationByProviderMessageId(prisma, {
    provider: "SMSMODE",
    providerMessageId,
  })

  if (!notification) {
    return NextResponse.json(
      { ok: true, ignored: "notification-not-found" },
      { status: 202 },
    )
  }

  const rawStatus =
    typeof payload.status === "string"
      ? payload.status
      : (payload.status?.value ?? "UNKNOWN")

  const transitionStatus = mapSmsmodeStatusToNotificationStatus(rawStatus)
  const statusDescription =
    payload.status && typeof payload.status !== "string"
      ? (payload.status.description ?? null)
      : null

  const created = await prisma.$transaction(async (tx) => {
    const event = await recordNotificationEvent(tx, {
      notificationId: notification.id,
      source: "SMSMODE",
      externalEventType: "sms.status",
      externalStatus: rawStatus,
      dedupeKey,
      payload: payload as unknown as Prisma.InputJsonValue,
    })

    if (!event.created) {
      return false
    }

    await transitionNotificationStatus(tx, {
      notificationId: notification.id,
      nextStatus: transitionStatus,
      providerStatus: rawStatus,
      errorCode:
        payload.error?.code != null ? String(payload.error.code) : null,
      errorMessage: payload.error?.message ?? statusDescription,
      providerMessageId,
    })

    return true
  })

  return NextResponse.json({ ok: true, deduplicated: !created })
}
