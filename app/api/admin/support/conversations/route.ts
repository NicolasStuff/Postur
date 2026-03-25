import { NextResponse } from "next/server"

import { requireAdminAccess, UnauthorizedError } from "@/lib/core-access"
import { listAdminSupportConversations } from "@/lib/support/service"

export async function GET(request: Request) {
  try {
    await requireAdminAccess()

    const url = new URL(request.url)
    const search = url.searchParams.get("q") ?? undefined
    const status = url.searchParams.get("status")
    const conversations = await listAdminSupportConversations({
      search,
      status:
        status === "OPEN" || status === "CLOSED" || status === "ALL"
          ? status
          : "ALL",
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Failed to fetch admin support conversations", error)

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Unable to fetch conversations" }, { status: 500 })
  }
}
