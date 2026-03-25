import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdminAccess, UnauthorizedError } from "@/lib/core-access"
import { updateAdminSupportConversationStatus } from "@/lib/support/service"

const supportStatusSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const admin = await requireAdminAccess()
    const { conversationId } = await params
    const payload = supportStatusSchema.parse(await request.json())
    const conversation = await updateAdminSupportConversationStatus({
      adminUserId: admin.id,
      conversationId,
      status: payload.status,
    })

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to update support conversation status", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to update conversation" }, { status: 500 })
  }
}
