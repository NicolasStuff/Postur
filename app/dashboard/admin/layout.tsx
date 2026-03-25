import { redirect } from "next/navigation"

import { UnauthorizedError, requireAdminAccess } from "@/lib/core-access"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdminAccess()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/dashboard")
    }

    throw error
  }

  return children
}
