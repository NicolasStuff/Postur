import type { Notification } from "pg"

import { postgresPool } from "@/lib/postgres"

export const SUPPORT_EVENTS_CHANNEL = "support_events"

export interface SupportRealtimeEvent {
  conversationId: string
  requesterUserId: string
  event: "message.created" | "conversation.updated" | "conversation.read"
  actorType: "USER" | "ADMIN" | "SYSTEM"
  updatedAt: string
}

export async function publishSupportEvent(payload: SupportRealtimeEvent) {
  await postgresPool.query(
    `SELECT pg_notify('${SUPPORT_EVENTS_CHANNEL}', $1)`,
    [JSON.stringify(payload)]
  )
}

export function parseSupportRealtimeEvent(message: Notification) {
  if (!message.payload) {
    return null
  }

  try {
    return JSON.parse(message.payload) as SupportRealtimeEvent
  } catch (error) {
    console.error("Failed to parse support realtime event", error)
    return null
  }
}
