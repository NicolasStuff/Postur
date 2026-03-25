import { NextResponse } from "next/server"

import { requireAdminAccess, UnauthorizedError } from "@/lib/core-access"
import { createSupportEventStreamResponse } from "@/lib/support/stream"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await requireAdminAccess()

    return createSupportEventStreamResponse({
      signal: request.signal,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Failed to open admin support stream", error)
    return NextResponse.json({ error: "Unable to open stream" }, { status: 500 })
  }
}
