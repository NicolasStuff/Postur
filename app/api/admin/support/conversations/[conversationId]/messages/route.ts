import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdminAccess, UnauthorizedError } from "@/lib/core-access"
import {
  getAdminSupportConversationMessages,
  sendAdminSupportMessage,
} from "@/lib/support/service"

const supportMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    await requireAdminAccess()
    const { conversationId } = await params
    const response = await getAdminSupportConversationMessages(conversationId)

    if (!response) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to fetch admin support messages", error)

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const admin = await requireAdminAccess()
    const { conversationId } = await params
    const payload = supportMessageSchema.parse(await request.json())
    const response = await sendAdminSupportMessage({
      adminUserId: admin.id,
      conversationId,
      body: payload.body,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Failed to send admin support message", error)

    if (error instanceof z.ZodError || error instanceof Error && error.message === "INVALID_SUPPORT_MESSAGE") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Error && error.message === "SUPPORT_CONVERSATION_NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to send message" }, { status: 500 })
  }
}
