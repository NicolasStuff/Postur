import type { Notification, PoolClient } from "pg"

import { postgresPool } from "@/lib/postgres"
import {
  parseSupportRealtimeEvent,
  SUPPORT_EVENTS_CHANNEL,
  type SupportRealtimeEvent,
} from "@/lib/support/realtime"

function formatSseEvent(eventName: string, payload: unknown) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`
}

export function createSupportEventStreamResponse(input: {
  signal: AbortSignal
  filter?: (event: SupportRealtimeEvent) => boolean
}) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let client: PoolClient | null = null
      let keepAliveTimer: ReturnType<typeof setInterval> | null = null
      let closed = false

      const cleanup = async () => {
        if (closed) {
          return
        }

        closed = true
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer)
        }

        if (client) {
          client.off("notification", handleNotification)
          try {
            await client.query(`UNLISTEN ${SUPPORT_EVENTS_CHANNEL}`)
          } catch (error) {
            console.error("Failed to unlisten support events", error)
          }
          client.release()
        }
      }

      const handleNotification = (message: Notification) => {
        const event = parseSupportRealtimeEvent(message)
        if (!event || (input.filter && !input.filter(event))) {
          return
        }

        controller.enqueue(
          encoder.encode(formatSseEvent("support.updated", event))
        )
      }

      try {
        client = await postgresPool.connect()
        client.on("notification", handleNotification)
        await client.query(`LISTEN ${SUPPORT_EVENTS_CHANNEL}`)

        controller.enqueue(
          encoder.encode(formatSseEvent("support.ready", { ok: true }))
        )

        keepAliveTimer = setInterval(() => {
          controller.enqueue(encoder.encode(": keepalive\n\n"))
        }, 25_000)

        input.signal.addEventListener(
          "abort",
          () => {
            void cleanup()
            controller.close()
          },
          { once: true }
        )
      } catch (error) {
        console.error("Failed to open support event stream", error)
        controller.error(error)
        await cleanup()
      }
    },
    async cancel() {
      // Cleanup is handled by the abort signal listener above.
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
