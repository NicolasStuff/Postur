import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

import { requireAdminAccess, UnauthorizedError } from "@/lib/core-access"
import { markAdminSupportConversationRead } from "@/lib/support/service"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const admin = await requireAdminAccess()
    const { conversationId } = await params
    const conversation = await markAdminSupportConversationRead(
      admin.id,
      conversationId
    )

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to mark admin support conversation as read", error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to mark conversation as read" }, { status: 500 })
  }
}
