import { NextResponse } from "next/server"

import { requireSessionUserId, UnauthorizedError } from "@/lib/core-access"
import { getSupportThreadForRequester } from "@/lib/support/service"

export async function GET() {
  try {
    const userId = await requireSessionUserId()
    const conversation = await getSupportThreadForRequester(userId)

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to fetch support thread", error)

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to fetch thread" }, { status: 500 })
  }
}
