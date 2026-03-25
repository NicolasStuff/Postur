import { NextResponse } from "next/server"
import { z } from "zod"

import { requireSessionUserId, UnauthorizedError } from "@/lib/core-access"
import { RateLimitExceededError } from "@/lib/rate-limit"
import {
  getSupportMessagesForRequester,
  sendRequesterSupportMessage,
} from "@/lib/support/service"

const supportMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
})

export async function GET() {
  try {
    const userId = await requireSessionUserId()
    const response = await getSupportMessagesForRequester(userId)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch support messages", error)

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId()
    const payload = supportMessageSchema.parse(await request.json())
    const response = await sendRequesterSupportMessage({
      requesterUserId: userId,
      body: payload.body,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to send support message", error)

    if (error instanceof z.ZodError || error instanceof Error && error.message === "INVALID_SUPPORT_MESSAGE") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to send message" }, { status: 500 })
  }
}
