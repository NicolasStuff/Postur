import { NextResponse } from "next/server"

import { requireSessionUserId, UnauthorizedError } from "@/lib/core-access"
import { markRequesterSupportThreadRead } from "@/lib/support/service"

export async function POST() {
  try {
    const userId = await requireSessionUserId()
    const conversation = await markRequesterSupportThreadRead(userId)

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to mark support thread as read", error)

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to mark thread as read" }, { status: 500 })
  }
}
